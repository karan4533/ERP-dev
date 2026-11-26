import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, RefreshCw } from 'lucide-react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import {
    DataTable,
    DataToolbar,
    IntegrationNotice,
    PageHeader,
    Pagination,
    StatusBadge,
} from '../ui'
import { paginateRows, parseTableState, serializeTableState } from '../ui/dataTableState'
import GroupStatusProgress from './Components/GroupStatusProgress'
import {
    APPROVAL_STATUSES,
    buildLessonPlanGroupHref,
    CLASS_OPTIONS,
    filterLessonPlans,
    getLessonPlans,
    groupLessonPlansByTeacherSubject,
    SECTION_OPTIONS,
    SUBJECT_OPTIONS,
    SUBMITTER_ROLES,
} from './lessonPlanApprovalData'

const LessonPlanReviewWorkspace = () => {
    const location = useLocation()
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [revision, setRevision] = useState(0)
    const [search, setSearch] = useState(initialTableState.query)
    const [subject, setSubject] = useState(initialTableState.filters.subject || '')
    const [className, setClassName] = useState(initialTableState.filters.className || '')
    const [section, setSection] = useState(initialTableState.filters.section || '')
    const [approvalStatus, setApprovalStatus] = useState(initialTableState.filters.approvalStatus || '')
    const [submitterRole, setSubmitterRole] = useState(initialTableState.filters.submitterRole || '')
    const [fromDate, setFromDate] = useState(initialTableState.filters.fromDate || '')
    const [toDate, setToDate] = useState(initialTableState.filters.toDate || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(urlParams.has('pageSize') ? initialTableState.pageSize : 10)

    const plans = useMemo(() => {
        const refreshToken = `${location.key}:${revision}`
        void refreshToken
        return getLessonPlans()
    }, [location.key, revision])

    const filteredPlans = useMemo(() => filterLessonPlans(plans, {
        search,
        subject,
        className,
        section,
        approvalStatus,
        submitterRole,
        fromDate,
        toDate,
        trackStatus: '',
    }), [approvalStatus, className, fromDate, plans, search, section, subject, submitterRole, toDate])
    const groups = useMemo(() => groupLessonPlansByTeacherSubject(filteredPlans), [filteredPlans])
    const pagination = paginateRows(groups, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { subject, className, section, approvalStatus, submitterRole, fromDate, toDate },
        }), { replace: true })
    }, [approvalStatus, className, fromDate, pageSize, pagination.page, search, section, setUrlParams, subject, submitterRole, toDate])

    const counts = APPROVAL_STATUSES.reduce((result, status) => ({
        ...result,
        [status]: plans.filter((plan) => plan.approvalStatus === status).length,
    }), {})

    const resetFilters = () => {
        setSearch('')
        setSubject('')
        setClassName('')
        setSection('')
        setApprovalStatus('')
        setSubmitterRole('')
        setFromDate('')
        setToDate('')
        setPage(1)
    }

    const filterSelectClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'
    const columns = [
        {
            key: 'submitterName',
            label: 'Submitted by',
            required: true,
            render: (group) => (
                <span>
                    <span className='block font-semibold text-[var(--erp-ink)]'>{group.submitterName}</span>
                    <span className='block text-xs text-[var(--erp-muted)]'>{group.submitterRole}</span>
                </span>
            ),
        },
        { key: 'subject', label: 'Subject' },
        { key: 'planCount', label: 'Plans', render: (group) => `${group.planCount} plan${group.planCount === 1 ? '' : 's'}` },
        { key: 'latestSubmittedAt', label: 'Latest submission', render: (group) => group.latestSubmittedAt || 'Not recorded' },
        { key: 'status', label: 'Approval status', render: (group) => <GroupStatusProgress group={group} mode='approval' /> },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Lesson-plan approvals'
                description='Review submitted teaching plans, record a governed decision and return rejected plans with actionable feedback.'
                context={`${plans.length} lesson plan${plans.length === 1 ? '' : 's'} across ${groupLessonPlansByTeacherSubject(plans).length} review group${groupLessonPlansByTeacherSubject(plans).length === 1 ? '' : 's'}`}
                actions={(
                    <>
                        <button type='button' onClick={() => setRevision((current) => current + 1)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-ink)]'><RefreshCw aria-hidden='true' size={16} /> Refresh</button>
                        <button type='button' disabled title='Export will be enabled after the academic reporting API is connected.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'><Download aria-hidden='true' size={16} /> Export unavailable</button>
                    </>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Local academic approval queue'
                description='Plans and decisions are stored in this browser for demonstration. Production requires versioned content, server-enforced reviewer permissions, immutable decisions and author notifications.'
            />

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                <button type='button' onClick={() => { setApprovalStatus(''); setPage(1) }} className={`rounded-[var(--erp-radius-surface)] border bg-white p-4 text-left ${!approvalStatus ? 'border-[var(--erp-indigo)] ring-1 ring-[var(--erp-indigo)]' : 'border-[var(--erp-line)]'}`}>
                    <span className='text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>All plans</span>
                    <strong className='mt-2 block text-2xl text-[var(--erp-ink)]'>{plans.length}</strong>
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
                    searchLabel='Search lesson-plan submissions'
                    searchPlaceholder='Teacher, subject, plan or class…'
                    resultCount={groups.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Subject
                                <select value={subject} onChange={(event) => { setSubject(event.target.value); setPage(1) }} className={filterSelectClass}><option value=''>All subjects</option>{SUBJECT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Class
                                <select value={className} onChange={(event) => { setClassName(event.target.value); setPage(1) }} className={filterSelectClass}><option value=''>All classes</option>{CLASS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Section
                                <select value={section} onChange={(event) => { setSection(event.target.value); setPage(1) }} className={filterSelectClass}><option value=''>All sections</option>{SECTION_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Status
                                <select value={approvalStatus} onChange={(event) => { setApprovalStatus(event.target.value); setPage(1) }} className={filterSelectClass}><option value=''>All statuses</option>{APPROVAL_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Submitter role
                                <select value={submitterRole} onChange={(event) => { setSubmitterRole(event.target.value); setPage(1) }} className={filterSelectClass}><option value=''>All roles</option>{SUBMITTER_ROLES.map((item) => <option key={item}>{item}</option>)}</select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>From
                                <input type='date' value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} className={filterSelectClass} />
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>To
                                <input type='date' value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1) }} className={filterSelectClass} />
                            </label>
                        </>
                    )}
                />
                <DataTable
                    caption='Lesson-plan approval groups'
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='key'
                    emptyTitle={approvalStatus === 'Pending' ? 'No lesson plans await review' : 'No lesson-plan groups found'}
                    emptyDescription={approvalStatus === 'Pending' ? 'All currently submitted lesson plans have a decision.' : 'Change the filters or wait for an academic submission.'}
                    renderActions={(group) => (
                        <NavLink to={buildLessonPlanGroupHref('/director', group.submitterName, group.subject)} aria-label={`Review ${group.submitterName} ${group.subject} lesson plans`} className='inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-indigo)]'>
                            <Eye aria-hidden='true' size={15} /> Review
                        </NavLink>
                    )}
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} pageSizeOptions={[10, 25, 50]} />
            </div>
        </section>
    )
}

export default LessonPlanReviewWorkspace
