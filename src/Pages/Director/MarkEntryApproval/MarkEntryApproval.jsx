import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, FileText, RefreshCw } from 'lucide-react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import {
    DataTable,
    DataToolbar,
    IntegrationNotice,
    PageHeader,
    Pagination,
    StatusBadge,
} from '../../../Common/ui'
import { paginateRows, parseTableState, serializeTableState } from '../../../Common/ui/dataTableState'
import {
    APPROVAL_STATUSES,
    encodeContextKey,
    filterMarkSessions,
    formatClassLabel,
    getAllMarkSessions,
    getSessionDisplayLabel,
} from '../../../Common/MarkEntryApproval/markEntryApprovalData'

const MarkEntryApproval = () => {
    const location = useLocation()
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [revision, setRevision] = useState(0)
    const [search, setSearch] = useState(initialTableState.query)
    const [approvalStatus, setApprovalStatus] = useState(initialTableState.filters.approvalStatus || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(urlParams.has('pageSize') ? initialTableState.pageSize : 10)

    void revision
    const sessions = getAllMarkSessions()

    const filteredSessions = useMemo(
        () => filterMarkSessions(sessions, { search, approvalStatus }),
        [approvalStatus, search, sessions],
    )
    const pagination = paginateRows(filteredSessions, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { approvalStatus },
        }), { replace: true })
    }, [approvalStatus, pageSize, pagination.page, search, setUrlParams])

    const counts = APPROVAL_STATUSES.reduce((result, status) => ({
        ...result,
        [status]: sessions.filter((session) => session.status === 'submitted' && session.approvalStatus === status).length,
    }), {})

    const resetFilters = () => {
        setSearch('')
        setApprovalStatus('')
        setPage(1)
    }

    const refresh = () => setRevision((current) => current + 1)

    const columns = [
        {
            key: 'exam',
            label: 'Assessment',
            required: true,
            render: (session) => (
                <span>
                    <span className='block font-semibold text-[var(--erp-ink)]'>{session.exam}</span>
                    <span className='block text-xs text-[var(--erp-muted)]'>{session.term} · {session.academicYear}</span>
                </span>
            ),
        },
        { key: 'class', label: 'Class', render: (session) => `${formatClassLabel(session.className)} — ${session.section}` },
        { key: 'subject', label: 'Subject' },
        { key: 'submittedByRole', label: 'Submitted by', render: (session) => session.submittedByRole || 'Academic staff' },
        { key: 'students', label: 'Students', render: (session) => session.students?.length ?? 0 },
        { key: 'approvalStatus', label: 'Status', render: (session) => <StatusBadge status={session.approvalStatus} /> },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Mark-entry approvals'
                description='Review submitted assessment marks and control publication to student and guardian portals.'
                context={`${sessions.length} submitted assessment record${sessions.length === 1 ? '' : 's'}`}
                actions={(
                    <>
                        <NavLink to='/director/student-evaluation/report-cards' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100'>
                            <FileText size={16} /> Progress Report Cards
                        </NavLink>
                        <button type='button' onClick={refresh} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-ink)]'>
                            <RefreshCw aria-hidden='true' size={16} /> Refresh
                        </button>
                        <button type='button' disabled title='Export will be enabled after the assessment reporting API is connected.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>
                            <Download aria-hidden='true' size={16} /> Export unavailable
                        </button>
                    </>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Local assessment approval queue'
                description='Decisions and publication state are stored in this browser for demonstration. Production requires server-side authorization, immutable audit events, notifications and transaction-safe publication.'
            />

            {location.state?.feedback ? <p role='status' className='rounded-lg border border-[#B7E1C1] bg-[#EFFAF2] px-4 py-3 text-sm font-medium text-[#176B35]'>{location.state.feedback}</p> : null}

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
                <button type='button' onClick={() => { setApprovalStatus(''); setPage(1) }} className={`rounded-[var(--erp-radius-surface)] border bg-white p-4 text-left ${!approvalStatus ? 'border-[var(--erp-indigo)] ring-1 ring-[var(--erp-indigo)]' : 'border-[var(--erp-line)]'}`}>
                    <span className='text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>All submissions</span>
                    <strong className='mt-2 block text-2xl text-[var(--erp-ink)]'>{sessions.filter((item) => item.status === 'submitted').length}</strong>
                </button>
                {APPROVAL_STATUSES.map((status) => (
                    <button key={status} type='button' onClick={() => { setApprovalStatus(approvalStatus === status ? '' : status); setPage(1) }} className={`rounded-[var(--erp-radius-surface)] border bg-white p-4 text-left ${approvalStatus === status ? 'border-[var(--erp-indigo)] ring-1 ring-[var(--erp-indigo)]' : 'border-[var(--erp-line)]'}`}>
                        <StatusBadge status={status} />
                        <strong className='mt-2 block text-2xl text-[var(--erp-ink)]'>{counts[status]}</strong>
                    </button>
                ))}
            </div>

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchLabel='Search mark-entry submissions'
                    searchPlaceholder='Exam, class, subject or submitter…'
                    resultCount={filteredSessions.length}
                    onReset={resetFilters}
                    filters={(
                        <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Approval status
                            <select value={approvalStatus} onChange={(event) => { setApprovalStatus(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                <option value=''>All statuses</option>
                                {APPROVAL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </label>
                    )}
                />
                <DataTable
                    caption='Submitted mark entries'
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='contextKey'
                    emptyTitle={approvalStatus === 'Pending' ? 'No mark entries await review' : 'No submitted mark entries'}
                    emptyDescription={approvalStatus === 'Pending' ? 'All currently submitted mark entries have a decision.' : 'Submissions appear here after a teacher or coordinator completes mark entry.'}
                    renderActions={(session) => {
                        const canAct = session.approvalStatus !== 'Approved' && session.approvalStatus !== 'Rejected'
                        return (
                            <NavLink to={`/director/mark-entry-approval/review/${encodeContextKey(session.contextKey)}`} aria-label={`${canAct ? 'Review' : 'View'} ${getSessionDisplayLabel(session)}`} className='inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-indigo)]'>
                                <Eye aria-hidden='true' size={15} /> {canAct ? 'Review & Publish' : 'View'}
                            </NavLink>
                        )
                    }}
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} pageSizeOptions={[10, 25, 50]} />
            </div>
        </section>
    )
}

export default MarkEntryApproval
