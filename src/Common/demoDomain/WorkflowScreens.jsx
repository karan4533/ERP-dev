import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import RegisterPage from './RegisterPage'
import { StatusBadge } from './statusBadge'
import {
    ConfirmAction,
    DataTable,
    Dialog,
    IntegrationNotice,
    StatusBadge as SharedStatusBadge,
} from '../ui'
import {
    advanceProcurement,
    createProcurementRequest,
    downloadQuotationTemplate,
    getProcurementRequests,
    getPurchaseOrders,
    PROCUREMENT_STATUSES,
} from './procurement'
import { getApprovers } from './governance'
import { AUDIT_COMPONENTS_KEY, COMPONENT_SEED, DEVIATION_SEED, OVERALL_REMARKS } from './auditSeeds'
import { criticalAlerts } from './inventory'
import { AUDIT_DEVIATIONS_KEY } from './auditSeeds'
import { ensureSeed } from './storage'

const PROCUREMENT_FLOWS = {
    minor: ['QUOTATION_PENDING', 'DEPARTMENT_REVIEW', 'MINOR_APPROVED', 'PO_REQUIRED', 'PO_RAISED', 'PO_APPROVED', 'COMPLETED'],
    standard: ['QUOTATION_PENDING', 'DEPARTMENT_REVIEW', 'ESCALATED', 'QUOTATION_APPROVED', 'PO_REQUIRED', 'PO_RAISED', 'PO_APPROVED', 'COMPLETED'],
}

const getNextProcurementStatus = (request) => {
    const flow = request.minorPurchase ? PROCUREMENT_FLOWS.minor : PROCUREMENT_FLOWS.standard
    const currentIndex = flow.indexOf(request.status)
    return flow[Math.min(currentIndex + 1, flow.length - 1)] || request.status
}

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
}).format(Number(amount) || 0)

export function ProcurementBoard({ department, requestedBy }) {
    const [rows, setRows] = useState(() => getProcurementRequests())
    const [orders, setOrders] = useState(() => getPurchaseOrders())
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [minor, setMinor] = useState(true)
    const [pendingAdvance, setPendingAdvance] = useState(null)
    const [timeline, setTimeline] = useState(null)
    const approver = getApprovers().find((item) => item.department === department)

    const refresh = () => {
        setRows(getProcurementRequests())
        setOrders(getPurchaseOrders())
    }

    const create = (event) => {
        event.preventDefault()
        if (!title.trim()) {
            toast.error('Request title is required.')
            return
        }
        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            toast.error('Enter an amount greater than zero.')
            return
        }
        createProcurementRequest({
            title: title.trim(),
            amount,
            minorPurchase: minor,
            department,
            requestedBy,
            primaryApprover: approver?.primaryApprover,
        })
        setTitle('')
        setAmount('')
        refresh()
        toast.success('Request created. Vendor is not required at this stage.')
    }

    const commitAdvance = () => {
        if (!pendingAdvance) return
        const result = advanceProcurement(pendingAdvance.id, requestedBy)
        refresh()
        setPendingAdvance(null)
        if (result) toast.success(`${result.id} advanced to ${result.status.replaceAll('_', ' ')}.`)
    }

    const visible = rows.filter((row) => row.department === department || department === 'All')
    const requestColumns = [
        { key: 'id', label: 'Request', required: true },
        {
            key: 'title',
            label: 'Requirement',
            required: true,
            render: (row) => (
                <div>
                    <p className='font-semibold text-[var(--erp-ink)]'>{row.title}</p>
                    <p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{row.department} · {row.requestedBy}</p>
                </div>
            ),
        },
        { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
        { key: 'route', label: 'Approval route', render: (row) => row.minorPurchase ? 'Minor purchase' : 'Escalated approval' },
        { key: 'primaryApprover', label: 'Primary approver' },
        { key: 'status', label: 'Status', required: true, render: (row) => <SharedStatusBadge status={row.status} label={row.status.replaceAll('_', ' ')} /> },
        { key: 'poNumber', label: 'PO', render: (row) => row.poNumber || 'Not raised' },
    ]
    const orderColumns = [
        { key: 'id', label: 'Purchase order', required: true },
        { key: 'requestId', label: 'Request', required: true },
        { key: 'vendor', label: 'Vendor' },
        { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
        { key: 'date', label: 'Raised on' },
        { key: 'status', label: 'Status', required: true, render: (row) => <SharedStatusBadge status={row.status} label={row.status.replaceAll('_', ' ')} /> },
    ]

    return (
        <section className='space-y-6'>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div>
                        <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>Purchase workflow</h2>
                        <p className='mt-1 text-sm text-[var(--erp-slate)]'>Shared request workspace for {department}. Primary approver: {approver?.primaryApprover || 'Department Head'}.</p>
                    </div>
                    <button type='button' onClick={downloadQuotationTemplate} className='min-h-10 self-start rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-indigo)] hover:bg-[var(--erp-canvas)]'>Download quotation template</button>
                </div>
                <IntegrationNotice
                    state='demo'
                    className='mt-4'
                    title='Procurement integration pending'
                    description='This prototype stores requests, decisions, and purchase orders in this browser. The production API must enforce approval authority, immutable audit history, vendor selection, and document retention.'
                />
                <details className='mt-4 rounded-xl border border-[var(--erp-line)] bg-[var(--erp-canvas)] px-4 py-3 text-sm text-[var(--erp-slate)]'>
                    <summary className='cursor-pointer font-semibold text-[var(--erp-ink)]'>View governed workflow statuses</summary>
                    <p className='mt-2 leading-6'>{PROCUREMENT_STATUSES.join(' → ')}</p>
                </details>
                <form onSubmit={create} className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] md:items-end'>
                    <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>Request title
                        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder='e.g. Network switch replacement' className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                    </label>
                    <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>Estimated amount
                        <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder='0' type='number' min='1' step='1' className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                    </label>
                    <label className='flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--erp-ink)]'>
                        <input type='checkbox' checked={minor} onChange={(event) => setMinor(event.target.checked)} />
                        Minor purchase
                    </label>
                    <button type='submit' className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>Create request</button>
                </form>
            </div>
            <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                <div className='border-b border-[var(--erp-line)] px-4 py-4 sm:px-5'>
                    <h3 className='font-semibold text-[var(--erp-ink)]'>Requests requiring action</h3>
                    <p className='mt-1 text-sm text-[var(--erp-slate)]'>{visible.length} request{visible.length === 1 ? '' : 's'} in the current department scope.</p>
                </div>
                <DataTable
                    caption='Procurement request register'
                    rows={visible}
                    columns={requestColumns}
                    rowKey='id'
                    emptyTitle='No procurement requests found'
                    emptyDescription='Create the first request for this department to start its governed approval route.'
                    renderActions={(row) => (
                        <>
                            <button type='button' onClick={() => setTimeline(row)} className='min-h-9 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-ink)]'>Timeline</button>
                            {!['COMPLETED', 'REJECTED'].includes(row.status) && (
                                <button type='button' onClick={() => setPendingAdvance(row)} className='min-h-9 rounded-lg bg-[var(--erp-indigo)] px-3 text-xs font-semibold text-white'>Advance</button>
                            )}
                        </>
                    )}
                />
            </div>
            <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                <div className='border-b border-[var(--erp-line)] px-4 py-4 sm:px-5'>
                    <h3 className='font-semibold text-[var(--erp-ink)]'>Purchase orders</h3>
                    <p className='mt-1 text-sm text-[var(--erp-slate)]'>Orders generated after the PO-raised approval stage.</p>
                </div>
                <DataTable caption='Purchase order register' rows={orders} columns={orderColumns} rowKey='id' emptyTitle='No purchase orders raised' emptyDescription='An approved request will create a purchase order when it reaches the PO-raised stage.' />
            </div>
            <Dialog
                open={Boolean(timeline)}
                onClose={() => setTimeline(null)}
                title='Procurement timeline'
                description={timeline ? `${timeline.id} · ${timeline.title}` : undefined}
                size='md'
            >
                <ol className='space-y-4'>
                    {(timeline?.history || []).map((entry, index) => (
                        <li key={`${entry.at}-${entry.status}-${index}`} className='relative border-l-2 border-[var(--erp-line-strong)] pl-4'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <SharedStatusBadge status={entry.status} label={entry.status.replaceAll('_', ' ')} />
                                <span className='text-xs text-[var(--erp-muted)]'>{entry.at === 'Seed record' ? entry.at : new Date(entry.at).toLocaleString('en-IN')}</span>
                            </div>
                            <p className='mt-2 text-sm font-medium text-[var(--erp-ink)]'>{entry.note}</p>
                            <p className='mt-0.5 text-xs text-[var(--erp-slate)]'>Actor: {entry.actor || 'System import'}</p>
                        </li>
                    ))}
                </ol>
            </Dialog>
            <ConfirmAction
                open={Boolean(pendingAdvance)}
                onClose={() => setPendingAdvance(null)}
                onConfirm={commitAdvance}
                title='Advance procurement request?'
                description='Review the governed transition before recording it.'
                confirmLabel='Confirm advancement'
            >
                {pendingAdvance && (
                    <div className='space-y-2'>
                        <p><strong>{pendingAdvance.id}</strong> · {pendingAdvance.title}</p>
                        <p>{pendingAdvance.status.replaceAll('_', ' ')} → <strong>{getNextProcurementStatus(pendingAdvance).replaceAll('_', ' ')}</strong></p>
                        <p>This demo records the acting user and timestamp locally. The backend must re-check the user permission and current status to prevent skipped or conflicting approvals.</p>
                    </div>
                )}
            </ConfirmAction>
        </section>
    )
}

export function AuditComponentsPage() {
    return (
        <RegisterPage
            title='Audit Components & Rubrics'
            description='Demo master based on the named quality-audit components. The workbook file was not in this project, so this is not a full official import.'
            storageKey={AUDIT_COMPONENTS_KEY}
            seed={COMPONENT_SEED}
            columns={[
                { key: 'component', label: 'Component' },
                { key: 'subComponent', label: 'Sub Component' },
                { key: 'grades', label: 'Grades' },
                { key: 'rubrics', label: 'Rubrics' },
                { key: 'frequency', label: 'Frequency' },
                { key: 'ratingScale', label: 'Scale' },
                { key: 'stream', label: 'Stream' },
                { key: 'active', label: 'Active' },
            ]}
            fields={[
                { key: 'component', label: 'Component', required: true },
                { key: 'subComponent', label: 'Sub Component', required: true },
                { key: 'grades', label: 'Applicable Grades' },
                { key: 'rubrics', label: 'Rubrics' },
                { key: 'frequency', label: 'Frequency', type: 'select', options: ['ONE_TIME', 'DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'TERMLY', 'YEARLY'] },
                { key: 'ratingScale', label: 'Rating Scale', type: 'select', options: ['3', '5'] },
                { key: 'stream', label: 'Stream', type: 'select', options: ['QUALITY', 'PROCESS'] },
                { key: 'active', label: 'Active', type: 'select', options: ['Yes', 'No'] },
            ]}
            idField='id'
            idPrefix='AC-'
            searchKeys={['component', 'subComponent', 'stream']}
            statusKey='active'
        />
    )
}

export function SharedDeviationsPage() {
    const [stream, setStream] = useState('All')
    const [rows] = useState(() => ensureSeed(AUDIT_DEVIATIONS_KEY, DEVIATION_SEED))
    const visible = rows.filter((row) => stream === 'All' || row.stream === stream)
    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>Shared audit deviations</h2>
                <p className='text-sm text-[#667085] mt-1'>Process and Quality stay separate working streams. This index is the shared compliance view.</p>
                <select value={stream} onChange={(event) => setStream(event.target.value)} className='mt-3 border border-[#D9D9D9] rounded-md px-2 py-2 text-sm'>
                    <option>All</option>
                    <option>PROCESS</option>
                    <option>QUALITY</option>
                </select>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>{['ID', 'Stream', 'Component', 'Department', 'Severity', 'RCA', 'ATR', 'Status'].map((label) => <th key={label} className='px-2 py-3 text-left text-[#0C1E5B]'>{label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {visible.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.observationId}</td>
                                <td className='px-2 py-3'>{row.stream}</td>
                                <td className='px-2 py-3'>{row.component}</td>
                                <td className='px-2 py-3'>{row.department}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.severity} /></td>
                                <td className='px-2 py-3'>{row.rcaStatus}</td>
                                <td className='px-2 py-3'>{row.atrStatus}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <h3 className='font-semibold mt-6 mb-2'>Component comparison remarks</h3>
                <ul className='text-sm text-[#667085] space-y-2'>
                    {OVERALL_REMARKS.map((row) => (
                        <li key={row.component}><strong>{row.component}.</strong> PQA appreciation: {row.pqaAppreciation}. PQA improvement: {row.pqaImprovement}. SPQA appreciation: {row.spqaAppreciation}. SPQA improvement: {row.spqaImprovement}.</li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export function CriticalInventoryPage() {
    const rows = useMemo(() => criticalAlerts(), [])
    return (
        <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
            <h2 className='text-xl font-semibold mb-4'>Critical inventory alerts</h2>
            <table className='w-full text-sm'>
                <thead className='text-xs bg-[#EDEEF5]'>
                    <tr>{['Module', 'Item', 'Requirement', 'Available', 'Difference', 'Status'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.item} className='border-b border-[#f2f4f7]'>
                            <td className='px-2 py-3'>{row.module}</td>
                            <td className='px-2 py-3'>{row.item}</td>
                            <td className='px-2 py-3'>{row.required}</td>
                            <td className='px-2 py-3'>{row.actual}</td>
                            <td className='px-2 py-3'>{row.difference}</td>
                            <td className='px-2 py-3'><StatusBadge status={row.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
