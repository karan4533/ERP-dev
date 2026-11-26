import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, Eye, FileText, RefreshCw } from 'lucide-react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import {
    DataTable,
    DataToolbar,
    IntegrationNotice,
    PageHeader,
    StatusBadge,
} from '../ui'
import { paginateRows, parseTableState, serializeTableState } from '../ui/dataTableState'
import {
    APPROVAL_STATUSES,
    encodeContextKey,
    filterMarkSessions,
    formatClassLabel,
    getAllMarkSessions,
    getSessionDisplayLabel,
} from './markEntryApprovalData'

const MarkEntryApprovalTierView = ({
    role = 'Coordinator',
    listBasePath = '/coordinator/student-evaluation/mark-entry-approval',
    reviewBasePath = '/coordinator/student-evaluation/mark-entry-approval/review',
    reportCardPath = '/coordinator/student-evaluation/report-cards',
}) => {
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

    const isCoordinator = role === 'Coordinator'
    const title = isCoordinator ? 'Marks Verification Queue' : 'Marks Approval Queue'
    const description = isCoordinator
        ? 'Tier 2 Verification: Inspect and verify assessment marks submitted by teachers before forwarding to the Principal.'
        : 'Tier 3 Approval: Approve marks verified by academic coordinators before transmitting to Director for publication.'

    const targetActionStatus = isCoordinator ? 'Pending' : 'Coordinator Reviewed'

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
        { key: 'submittedByRole', label: 'Submitted by', render: (session) => session.submittedByRole || 'Academic Staff' },
        { key: 'students', label: 'Students', render: (session) => session.students?.length ?? 0 },
        { key: 'approvalStatus', label: 'Status', render: (session) => <StatusBadge status={session.approvalStatus} /> },
    ]

    return (
        <section className='space-y-5 font-inter'>
            <PageHeader
                title={title}
                description={description}
                context={`${sessions.length} assessment submission${sessions.length === 1 ? '' : 's'}`}
                actions={(
                    <>
                        <NavLink
                            to={reportCardPath}
                            className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors'
                        >
                            <FileText size={16} /> Progress Report Cards
                        </NavLink>
                        <button
                            type='button'
                            onClick={refresh}
                            className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-ink)]'
                        >
                            <RefreshCw aria-hidden='true' size={16} /> Refresh
                        </button>
                    </>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='3-Tier Academic Assessment Governance'
                description='Sequence: Teacher (Entry) → Coordinator (Review & Verify) → Principal (Approve) → Director/DA (Publish). Verified and approved marks automatically update class rank lists and progress report cards.'
            />

            {location.state?.feedback ? (
                <p role='status' className='rounded-lg border border-[#B7E1C1] bg-[#EFFAF2] px-4 py-3 text-sm font-medium text-[#176B35]'>
                    {location.state.feedback}
                </p>
            ) : null}

            {/* Status KPI Filter Pills */}
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
                <button
                    type='button'
                    onClick={() => { setApprovalStatus(''); setPage(1) }}
                    className={`rounded-[var(--erp-radius-surface)] border bg-white p-3.5 text-left transition-all ${
                        !approvalStatus ? 'border-[var(--erp-indigo)] ring-1 ring-[var(--erp-indigo)]' : 'border-[var(--erp-line)]'
                    }`}
                >
                    <span className='text-[11px] font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>All Submissions</span>
                    <strong className='mt-1 block text-2xl text-[var(--erp-ink)]'>
                        {sessions.filter((item) => item.status === 'submitted').length}
                    </strong>
                </button>
                {APPROVAL_STATUSES.map((status) => (
                    <button
                        key={status}
                        type='button'
                        onClick={() => { setApprovalStatus(approvalStatus === status ? '' : status); setPage(1) }}
                        className={`rounded-[var(--erp-radius-surface)] border bg-white p-3.5 text-left transition-all ${
                            approvalStatus === status ? 'border-[var(--erp-indigo)] ring-1 ring-[var(--erp-indigo)]' : 'border-[var(--erp-line)]'
                        }`}
                    >
                        <StatusBadge status={status} />
                        <strong className='mt-1 block text-2xl text-[var(--erp-ink)]'>{counts[status] || 0}</strong>
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
                        <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>
                            Approval Status
                            <select
                                value={approvalStatus}
                                onChange={(event) => { setApprovalStatus(event.target.value); setPage(1) }}
                                className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'
                            >
                                <option value=''>All Statuses</option>
                                {APPROVAL_STATUSES.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </label>
                    )}
                />

                <DataTable
                    caption='Submitted mark entries'
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='contextKey'
                    emptyTitle={approvalStatus === targetActionStatus ? `No mark entries await ${role.toLowerCase()} review` : 'No mark entries found'}
                    emptyDescription={approvalStatus === targetActionStatus ? 'All submissions at this stage have been acted upon.' : 'Submissions will appear here after mark entry is submitted.'}
                    renderActions={(session) => {
                        const needsAction = session.approvalStatus === targetActionStatus
                        return (
                            <NavLink
                                to={`${reviewBasePath}/${encodeContextKey(session.contextKey)}`}
                                aria-label={`${needsAction ? (isCoordinator ? 'Verify' : 'Approve') : 'View'} ${getSessionDisplayLabel(session)}`}
                                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition-colors ${
                                    needsAction
                                        ? 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        : 'border-[var(--erp-line-strong)] text-[var(--erp-indigo)] hover:bg-slate-50'
                                }`}
                            >
                                {needsAction ? <CheckCircle2 size={15} /> : <Eye size={15} />}
                                {needsAction ? (isCoordinator ? 'Verify' : 'Approve') : 'View'}
                            </NavLink>
                        )
                    }}
                />
            </div>
        </section>
    )
}

export default MarkEntryApprovalTierView
