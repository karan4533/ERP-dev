import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, GraduationCap, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { filterAdmissionRecords } from '../../../../Common/Admissions/admissionFilters'
import { getAdmissionDraftKey, loadAdmissionDraft } from '../../../../Common/Admissions/admissionDraft'
import {
    ConfirmAction,
    DataTable,
    DataToolbar,
    IntegrationNotice,
    PageHeader,
    Pagination,
    StatusBadge,
} from '../../../../Common/ui'
import { paginateRows, parseTableState, serializeTableState } from '../../../../Common/ui/dataTableState'
import {
    ADMISSION_STATUS_OPTIONS,
    deleteAdmission,
    enrollAdmissionAsStudent,
    getAdmissionEditPath,
    getAdmissionProfileImage,
    getAdmissionViewPath,
    getAllAdmissions,
    getStudentDisplayName,
} from './admissionListData'
import { getAddAdmissionPath, isAdminFrontOfficePath } from '../AdmissionEnquiry/admissionEnquiryData'

const AdminssionList = () => {
    const { pathname } = useLocation()
    const isAdminView = isAdminFrontOfficePath(pathname)
    const addAdmissionPath = getAddAdmissionPath(pathname)
    const draftKey = getAdmissionDraftKey(pathname, 'new')
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [records, setRecords] = useState(() => getAllAdmissions())
    const [search, setSearch] = useState(initialTableState.query)
    const [status, setStatus] = useState(initialTableState.filters.status || '')
    const [fromDate, setFromDate] = useState(initialTableState.filters.fromDate || '')
    const [toDate, setToDate] = useState(initialTableState.filters.toDate || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(initialTableState.pageSize)
    const [pendingAction, setPendingAction] = useState(null)
    const [hasDraft] = useState(() => Boolean(loadAdmissionDraft(draftKey)))

    const filteredRecords = useMemo(
        () => filterAdmissionRecords(records, { search, status, fromDate, toDate }),
        [records, search, status, fromDate, toDate],
    )
    const pagination = paginateRows(filteredRecords, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { status, fromDate, toDate },
        }), { replace: true })
    }, [fromDate, pageSize, pagination.page, search, setUrlParams, status, toDate])

    const resetFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate('')
        setToDate('')
        setPage(1)
    }

    const refresh = () => setRecords(getAllAdmissions())

    const confirmPendingAction = () => {
        if (!pendingAction) return
        const { type, record } = pendingAction

        if (type === 'delete') {
            deleteAdmission(record.id)
            refresh()
            setPendingAction(null)
            toast.success('Admission removed from this browser.')
            return
        }

        const result = enrollAdmissionAsStudent(record.id)
        if (!result.success) {
            toast.error(result.message)
            setPendingAction(null)
            return
        }
        refresh()
        setPendingAction(null)
        if (result.parentCreated) toast.success(`${getStudentDisplayName(record)} enrolled. Parent account created.`)
        else if (result.parentMapped) toast.success(`${getStudentDisplayName(record)} enrolled and linked to an existing parent.`)
        else toast.success(`${getStudentDisplayName(record)} enrolled as a student.`)
    }

    const columns = [
        {
            key: 'student',
            label: 'Student',
            required: true,
            render: (record) => (
                <span className='flex items-center gap-3'>
                    <img src={getAdmissionProfileImage(record)} alt='' className='size-9 rounded-full object-cover' />
                    <span>
                        <span className='block font-semibold text-[var(--erp-ink)]'>{getStudentDisplayName(record)}</span>
                        <span className='block text-xs text-[var(--erp-muted)]'>{record.admissionNumber || record.id}</span>
                    </span>
                </span>
            ),
        },
        { key: 'className', label: 'Class', render: (record) => record.className || 'Not assigned' },
        { key: 'rollNumber', label: 'Roll number', render: (record) => record.rollNumber || 'Pending' },
        { key: 'status', label: 'Status', render: (record) => <StatusBadge status={record.status} /> },
        { key: 'mobileNumber', label: 'Contact', render: (record) => record.mobileNumber || '—' },
        { key: 'createdDate', label: 'Created' },
        { key: 'location', label: 'Location', render: (record) => [record.city, record.country].filter(Boolean).join(', ') || '—' },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Admissions'
                description={isAdminView ? 'Monitor admission status and review submitted student records.' : 'Create, resume, verify and enrol student admissions.'}
                context={`${records.length} total · ${filteredRecords.length} matching`}
                actions={!isAdminView ? (
                    <NavLink to={addAdmissionPath} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                        {hasDraft ? <Save aria-hidden='true' size={16} /> : <Plus aria-hidden='true' size={16} />}
                        {hasDraft ? 'Resume draft' : 'New admission'}
                    </NavLink>
                ) : null}
            />

            <IntegrationNotice
                state='demo'
                title='Browser-stored admission records'
                description='Records, enrolment and parent mapping are local demo workflows. Production submission, document verification, payment and identity checks require backend APIs.'
            />

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder='Search student, admission, class or contact'
                    resultCount={filteredRecords.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Status
                                <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    <option value=''>All statuses</option>
                                    {ADMISSION_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Created from
                                <input type='date' value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Created to
                                <input type='date' value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                            </label>
                        </>
                    )}
                    actions={(
                        <button type='button' disabled title='Export service is not connected' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-65'>
                            <Download aria-hidden='true' size={16} /> Export unavailable
                        </button>
                    )}
                />
                <DataTable
                    caption='Admissions'
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No admissions found'
                    emptyDescription='No records match the current filters. Reset the filters or create a new admission.'
                    renderActions={(record) => (
                        <>
                            <NavLink to={getAdmissionViewPath(pathname, record.id)} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-ink)]'>
                                <Eye aria-hidden='true' size={14} /> View
                            </NavLink>
                            {!isAdminView && (
                                <>
                                    <NavLink to={getAdmissionEditPath(pathname, record.id)} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-ink)]'>
                                        <Pencil aria-hidden='true' size={14} /> Edit
                                    </NavLink>
                                    {record.status === 'Enrolled' ? (
                                        <span className='inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 text-xs font-semibold text-emerald-700'>
                                            <GraduationCap aria-hidden='true' size={14} /> Enrolled
                                        </span>
                                    ) : record.status === 'Pending Finance Approval' ? (
                                        <button
                                            type='button'
                                            onClick={() => toast.info('Awaiting fee payment and clearance from Finance before final enrollment.')}
                                            className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50/80 px-2.5 text-xs font-semibold text-amber-800'
                                            title='Student details submitted. Awaiting Finance approval and admission bill payment.'
                                        >
                                            <GraduationCap aria-hidden='true' size={14} /> Awaiting Finance
                                        </button>
                                    ) : (
                                        <button
                                            type='button'
                                            onClick={() => setPendingAction({ type: 'enrol', record })}
                                            className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-indigo)]'
                                        >
                                            <GraduationCap aria-hidden='true' size={14} /> Enrol
                                        </button>
                                    )}
                                    <button type='button' onClick={() => setPendingAction({ type: 'delete', record })} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#F4433655] px-3 text-xs font-semibold text-[#B42318]'>
                                        <Trash2 aria-hidden='true' size={14} /> Delete
                                    </button>
                                </>
                            )}
                        </>
                    )}
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
            </div>

            <ConfirmAction
                open={Boolean(pendingAction)}
                onClose={() => setPendingAction(null)}
                onConfirm={confirmPendingAction}
                title={pendingAction?.type === 'delete' ? 'Delete this admission?' : 'Enrol this student?'}
                description={pendingAction?.type === 'delete' ? 'The local admission record will be removed.' : 'A student record and guardian mapping will be created from this admission.'}
                confirmLabel={pendingAction?.type === 'delete' ? 'Delete admission' : 'Enrol student'}
                tone={pendingAction?.type === 'delete' ? 'danger' : 'primary'}
            >
                <p>
                    {pendingAction?.type === 'delete'
                        ? 'This cannot be undone in the current browser dataset.'
                        : 'Confirm that identity, guardian, fee and document checks are complete before enrolment.'}
                </p>
            </ConfirmAction>
        </section>
    )
}

export default AdminssionList
