import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { canUseOpsApi, listOpsCollectionApi, stationeryDecideProcurementApi } from '../../../services/opsApi'
import { decideDepartmentRequestApi, listDepartmentRequestsApi } from '../../../services/opsWorkflowsApi'

const statusBadge = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Submitted: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const formatStamp = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('en-GB')
}

const askRemark = (label, required) => {
    const value = window.prompt(label, '')
    if (value == null) return null
    if (required && !value.trim()) {
        toast.error('A remark is required.')
        return null
    }
    return value.trim()
}

/** Purchases waiting on the Joint Director: the stage decision and the purchase-order approval. */
const JD_PROCUREMENT_STAGES = {
    DEPARTMENT_REVIEW: [
        { action: 'approve', label: 'Approve (minor)' },
        { action: 'escalate', label: 'Escalate to Finance' },
        { action: 'reject', label: 'Reject', remarkRequired: true },
    ],
    PO_RAISED: [{ action: 'mark_po_approved', label: 'Approve PO' }],
}

export default function DepartmentRequestsInbox() {
    const api = canUseOpsApi()
    const [items, setItems] = useState([])
    const [canDecide, setCanDecide] = useState(false)
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(api)
    const [error, setError] = useState('')
    const [statusFilter, setStatusFilter] = useState('Pending')
    const [busy, setBusy] = useState('')

    const refresh = useCallback(async () => {
        if (!api) return
        setLoading(true)
        setError('')
        try {
            const [inbox, procurement] = await Promise.all([
                listDepartmentRequestsApi(),
                listOpsCollectionApi('stationery-procurement').catch(() => []),
            ])
            setItems(Array.isArray(inbox?.items) ? inbox.items : [])
            setCanDecide(Boolean(inbox?.canDecide))
            setPurchases(
                (Array.isArray(procurement) ? procurement : []).filter((row) =>
                    Object.prototype.hasOwnProperty.call(JD_PROCUREMENT_STAGES, String(row.status || '').toUpperCase())
                )
            )
        } catch (err) {
            setError(err?.message || 'Department requests could not be loaded.')
        } finally {
            setLoading(false)
        }
    }, [api])

    useEffect(() => {
        refresh()
    }, [refresh])

    const visible = useMemo(
        () => items.filter((row) => {
            if (!statusFilter) return true
            if (statusFilter === 'Pending') return row.decidable
            return row.status === statusFilter
        }),
        [items, statusFilter]
    )

    const decide = async (row, decision) => {
        const remark = askRemark(
            decision === 'approve' ? 'Approval remark (optional):' : 'Rejection reason (required):',
            decision === 'reject'
        )
        if (remark == null) return
        setBusy(`${row.collection}:${row.id}`)
        try {
            const saved = await decideDepartmentRequestApi(row.collection, row.id, { decision, remark })
            toast.success(`${row.department} request ${saved.id} ${String(saved.status).toLowerCase()}.`)
            await refresh()
        } catch (err) {
            toast.error(err?.message || 'Decision failed.')
        } finally {
            setBusy('')
        }
    }

    const decidePurchase = async (row, step) => {
        const remark = askRemark(step.remarkRequired ? 'Reason (required):' : 'Remark (optional):', step.remarkRequired)
        if (remark == null) return
        setBusy(`procurement:${row.id}`)
        try {
            const saved = await stationeryDecideProcurementApi(row.id, { action: step.action, comment: remark })
            toast.success(`Purchase ${saved.id} is now ${saved.status}.`)
            await refresh()
        } catch (err) {
            toast.error(err?.message || 'Decision failed.')
        } finally {
            setBusy('')
        }
    }

    if (!api) return null

    return (
        <section className="mt-8 space-y-8">
            <div className="bg-white rounded-2xl shadow-md p-4">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                    <div>
                        <h2 className="text-xl font-medium text-black">Department Requests</h2>
                        <p className="text-sm text-[#667085]">Housekeeping, IT Support and Canteen requests sent to the Joint Director.</p>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm border border-[#D9D9D9] rounded-md px-2 py-2"
                    >
                        <option value="Pending">Awaiting decision</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="">All</option>
                    </select>
                </div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5]">
                            <tr>
                                {['Request ID', 'Department', 'Title', 'Amount', 'Raised By', 'Status', 'Decision', 'Actions'].map((label) => (
                                    <th key={label} className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && items.length === 0 ? (
                                <tr><td colSpan={8} className="px-2 py-8 text-center text-[#667085]">Loading department requests…</td></tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={8} className="px-2 py-8 text-center text-[#F44336]">
                                        {error}{' '}
                                        <button type="button" className="underline text-[#515DEF]" onClick={refresh}>Retry</button>
                                    </td>
                                </tr>
                            ) : visible.length === 0 ? (
                                <tr><td colSpan={8} className="px-2 py-8 text-center text-[#667085]">No department requests here.</td></tr>
                            ) : (
                                visible.map((row) => {
                                    const key = `${row.collection}:${row.id}`
                                    return (
                                        <tr key={key} className="border-b border-[#f2f4f7] text-[#667085]">
                                            <td className="px-2 py-4 font-medium text-[#1E1E1E]">{row.requestId || row.id}</td>
                                            <td className="px-2 py-4">{row.department}</td>
                                            <td className="px-2 py-4 max-w-[220px] truncate" title={row.description || row.title}>
                                                {row.title || row.purpose || row.requestType || '—'}
                                            </td>
                                            <td className="px-2 py-4">{row.amount || row.estimatedCost || row.estimatedAmount || '—'}</td>
                                            <td className="px-2 py-4">{row.requestedBy || row.raisedByEmail || '—'}</td>
                                            <td className="px-2 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadge[row.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                                    {row.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-4 text-xs">
                                                {row.decidedAt ? (
                                                    <>
                                                        <p>{row.decidedByName || row.decidedBy} · {formatStamp(row.decidedAt)}</p>
                                                        {row.decisionRemark && <p className="text-[#1E1E1E]">{row.decisionRemark}</p>}
                                                    </>
                                                ) : '—'}
                                            </td>
                                            <td className="px-2 py-4">
                                                {canDecide && row.decidable ? (
                                                    <div className="flex gap-2">
                                                        <button type="button" disabled={busy === key} className="text-[#4CAF50] underline" onClick={() => decide(row, 'approve')}>Approve</button>
                                                        <button type="button" disabled={busy === key} className="text-[#F44336] underline" onClick={() => decide(row, 'reject')}>Reject</button>
                                                    </div>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {canDecide && (
                <div className="bg-white rounded-2xl shadow-md p-4">
                    <h2 className="text-xl font-medium text-black">Stationery Purchases Awaiting JD</h2>
                    <p className="text-sm text-[#667085] mb-4">Stage decisions and purchase-order approvals for Stationery Store purchases.</p>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs bg-[#EDEEF5]">
                                <tr>
                                    {['Request ID', 'Title', 'Amount', 'Type', 'Status', 'PO', 'Actions'].map((label) => (
                                        <th key={label} className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && purchases.length === 0 ? (
                                    <tr><td colSpan={7} className="px-2 py-8 text-center text-[#667085]">Loading purchases…</td></tr>
                                ) : purchases.length === 0 ? (
                                    <tr><td colSpan={7} className="px-2 py-8 text-center text-[#667085]">No purchases waiting for the Joint Director.</td></tr>
                                ) : (
                                    purchases.map((row) => (
                                        <tr key={row.id} className="border-b border-[#f2f4f7] text-[#667085]">
                                            <td className="px-2 py-4 font-medium text-[#1E1E1E]">{row.id}</td>
                                            <td className="px-2 py-4">{row.title}</td>
                                            <td className="px-2 py-4">{row.amount ? `₹${Number(row.amount).toLocaleString('en-IN')}` : '—'}</td>
                                            <td className="px-2 py-4">{row.minorPurchase ? 'Minor' : 'Major'}</td>
                                            <td className="px-2 py-4">{row.status}</td>
                                            <td className="px-2 py-4">{row.poNumber || '—'}</td>
                                            <td className="px-2 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {JD_PROCUREMENT_STAGES[String(row.status).toUpperCase()].map((step) => (
                                                        <button
                                                            key={step.action}
                                                            type="button"
                                                            disabled={busy === `procurement:${row.id}`}
                                                            className="text-[#515DEF] underline"
                                                            onClick={() => decidePurchase(row, step)}
                                                        >
                                                            {step.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    )
}
