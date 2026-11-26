import { useMemo, useState } from 'react'
import { Check, Download, X } from 'lucide-react'
import FinancialActionFlow from '../../../Common/Finance/FinancialActionFlow'
import {
    ConfirmAction,
    DataTable,
    DataToolbar,
    IntegrationNotice,
    PageHeader,
    Pagination,
    StatusBadge,
} from '../../../Common/ui'
import { paginateRows } from '../../../Common/ui/dataTableState'
import { useAuth } from '../../../context/AuthContext'
import {
    APPROVAL_DEPARTMENTS,
    APPROVAL_RULES,
    APPROVALS_TABS,
    APPROVED_REQUESTS,
    PENDING_REQUESTS,
    REJECTED_REQUESTS,
} from './approvalsData'
import { applyFinanceApprovalDecision } from './financeApprovalState'

const STORAGE_KEY = 'school-erp-finance-approvals-v2'

const seedRows = () => [
    ...PENDING_REQUESTS.map((row) => ({ ...row, status: 'Pending' })),
    ...APPROVED_REQUESTS.map((row) => ({
        ...row,
        department: 'Not recorded',
        raisedOn: row.approvedOn,
        status: 'Approved',
        decision: { actor: row.approvedBy, actorRole: 'Approver', remarks: '', decidedAt: '' },
    })),
    ...REJECTED_REQUESTS.map((row) => ({
        ...row,
        department: 'Not recorded',
        raisedOn: row.rejectedOn,
        status: 'Rejected',
        decision: { actor: 'Finance reviewer', actorRole: 'Account Head', remarks: row.reason, decidedAt: '' },
    })),
]

const readRows = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : seedRows()
    } catch {
        return seedRows()
    }
}

const Approvals = () => {
    const { name, email } = useAuth()
    const [rows, setRows] = useState(readRows)
    const [activeTab, setActiveTab] = useState('pending')
    const [department, setDepartment] = useState(APPROVAL_DEPARTMENTS[0])
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [decision, setDecision] = useState(null)
    const [remarks, setRemarks] = useState('')
    const [feedback, setFeedback] = useState('')

    const selectedStatus = activeTab === 'pending' ? 'Pending' : activeTab === 'approved' ? 'Approved' : activeTab === 'rejected' ? 'Rejected' : ''
    const filteredRows = useMemo(() => rows.filter((row) => {
        if (selectedStatus && row.status !== selectedStatus) return false
        if (department !== 'All Departments' && row.department !== department) return false
        const query = search.trim().toLowerCase()
        if (!query) return true
        return [row.id, row.raisedBy, row.type, row.amount, row.department, row.status]
            .join(' ')
            .toLowerCase()
            .includes(query)
    }), [department, rows, search, selectedStatus])
    const pagination = paginateRows(filteredRows, { page, pageSize })

    const persist = (next) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        setRows(next)
    }

    const closeDecision = () => {
        setDecision(null)
        setRemarks('')
    }

    const confirmDecision = () => {
        if (!decision) return
        const next = applyFinanceApprovalDecision(rows, decision.row.id, decision.status, {
            actor: name || email || 'Account Head',
            actorRole: 'Account Head',
            remarks,
        })
        persist(next)
        setFeedback(`${decision.row.id} was ${decision.status.toLowerCase()}. The decision is recorded locally and has not been posted or paid.`)
        closeDecision()
    }

    const openDecision = (row, status) => {
        setDecision({ row, status })
        setRemarks('')
    }

    const columns = [
        { key: 'id', label: 'Request', required: true, render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.id}</span> },
        { key: 'raisedBy', label: 'Raised by' },
        { key: 'department', label: 'Department', render: (row) => row.department || 'Not recorded' },
        { key: 'type', label: 'Type' },
        { key: 'amount', label: 'Amount', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.amount}</span> },
        { key: 'raisedOn', label: 'Submitted / decided' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'decision', label: 'Decision details', render: (row) => row.decision ? `${row.decision.actor}${row.decision.remarks ? ` · ${row.decision.remarks}` : ''}` : 'Awaiting review' },
    ]

    const ruleColumns = [
        { key: 'requestType', label: 'Request type', required: true },
        { key: 'threshold', label: 'Threshold' },
        { key: 'primaryApprover', label: 'Primary approver' },
        { key: 'escalatesTo', label: 'Escalates to' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Finance approvals'
                description='Review claims and expenses before posting or settlement. Approval alone never records a ledger posting or payment.'
                context={`${rows.filter((row) => row.status === 'Pending').length} requests await an Account Head decision`}
                actions={(
                    <button type='button' disabled title='Export requires the connected finance reporting API.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>
                        <Download aria-hidden='true' size={16} /> Export unavailable
                    </button>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Browser-stored approval decisions'
                description='Decisions are local demonstration records. Production requires permission checks, append-only audit events, posting controls and payout integrations.'
            />

            <FinancialActionFlow current='Approve' completed={['Calculate', 'Review']} title='Expense and claim lifecycle' />

            {feedback ? <p role='status' className='rounded-lg border border-[#B7E1C1] bg-[#EFFAF2] px-4 py-3 text-sm font-medium text-[#176B35]'>{feedback}</p> : null}

            <div className='flex gap-2 overflow-x-auto border-b border-[var(--erp-line)]' role='tablist' aria-label='Finance approval views'>
                {APPROVALS_TABS.map((tab) => (
                    <button key={tab.id} type='button' role='tab' aria-selected={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); setPage(1) }} className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${activeTab === tab.id ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]' : 'border-transparent text-[var(--erp-slate)]'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                {activeTab === 'approval-rules' ? (
                    <DataTable caption='Finance approval rules' rows={APPROVAL_RULES} columns={ruleColumns} rowKey='id' />
                ) : (
                    <>
                        <DataToolbar
                            query={search}
                            onQueryChange={(value) => { setSearch(value); setPage(1) }}
                            searchLabel='Search finance approval requests'
                            searchPlaceholder='Request, person, type or amount…'
                            resultCount={filteredRows.length}
                            onReset={() => { setSearch(''); setDepartment('All Departments'); setPage(1) }}
                            filters={(
                                <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Department
                                    <select value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                        {APPROVAL_DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}
                                    </select>
                                </label>
                            )}
                        />
                        <DataTable
                            caption={`${selectedStatus} finance requests`}
                            rows={pagination.rows}
                            columns={columns}
                            rowKey='id'
                            emptyTitle={`No ${selectedStatus.toLowerCase()} finance requests`}
                            emptyDescription='Change the search or department filter to see other records.'
                            renderActions={selectedStatus === 'Pending' ? (row) => (
                                <>
                                    <button type='button' onClick={() => openDecision(row, 'Rejected')} className='inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--erp-red)] px-3 text-sm font-semibold text-[var(--erp-red)]'><X aria-hidden='true' size={15} /> Reject</button>
                                    <button type='button' onClick={() => openDecision(row, 'Approved')} className='inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[var(--erp-green)] px-3 text-sm font-semibold text-white'><Check aria-hidden='true' size={15} /> Approve</button>
                                </>
                            ) : undefined}
                        />
                        <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} pageSizeOptions={[10, 25, 50]} />
                    </>
                )}
            </div>

            <ConfirmAction
                open={Boolean(decision)}
                onClose={closeDecision}
                onConfirm={confirmDecision}
                title={decision?.status === 'Approved' ? `Approve ${decision.row.id}?` : `Reject ${decision?.row.id || 'request'}?`}
                description={decision?.status === 'Approved' ? 'This records approval only; posting and payment remain separate actions.' : 'The request returns to its owner with your rationale.'}
                confirmLabel={decision?.status === 'Approved' ? 'Approve request' : 'Confirm rejection'}
                tone={decision?.status === 'Rejected' ? 'danger' : 'primary'}
                confirmDisabled={decision?.status === 'Rejected' && !remarks.trim()}
            >
                {decision ? (
                    <div className='space-y-3'>
                        <dl className='grid grid-cols-2 gap-2 rounded-lg bg-[var(--erp-canvas)] p-3 text-xs'>
                            <div><dt className='text-[var(--erp-muted)]'>Raised by</dt><dd className='font-semibold text-[var(--erp-ink)]'>{decision.row.raisedBy}</dd></div>
                            <div><dt className='text-[var(--erp-muted)]'>Amount</dt><dd className='font-semibold text-[var(--erp-ink)]'>{decision.row.amount}</dd></div>
                            <div><dt className='text-[var(--erp-muted)]'>Type</dt><dd className='font-semibold text-[var(--erp-ink)]'>{decision.row.type}</dd></div>
                            <div><dt className='text-[var(--erp-muted)]'>Department</dt><dd className='font-semibold text-[var(--erp-ink)]'>{decision.row.department || 'Not recorded'}</dd></div>
                        </dl>
                        <label htmlFor='finance-decision-remarks' className='block font-semibold text-[var(--erp-ink)]'>
                            {decision.status === 'Rejected' ? 'Rejection rationale (required)' : 'Approval remarks (optional)'}
                        </label>
                        <textarea id='finance-decision-remarks' rows={3} value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder={decision.status === 'Rejected' ? 'Explain what must be corrected…' : 'Add an optional approval note…'} className='w-full rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 text-sm' />
                    </div>
                ) : null}
            </ConfirmAction>
        </section>
    )
}

export default Approvals
