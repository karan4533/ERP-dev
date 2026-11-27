import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { canUseEmployeeDirectoryApi, loadEmployeeDirectory } from '../../services/employeeDirectoryApi'
import { useFinance } from '../../Pages/AccountHead/financeDomain/FinanceContext'
import { buildMfpFromInstallments } from '../../Pages/AccountHead/financeDomain/financeSnapshotAccounting'
import ReactECharts from 'echarts-for-react'
import { toast } from 'react-toastify'
import { getBiometricRows, hydrateBiometricFromApi, overrideAttendance, syncBiometricDemo } from './biometric'
import { StatusBadge } from './statusBadge'
import { bookFeeRows, getFeeProjection, projectFee, saveFeeProjection } from './financeExtras'
import EntryClosureGate from './EntryClosureGate'
import { entryBlocked } from './governance'
import { addRequirement, getInventory, getMovements, getRequirements, issueStock } from './inventory'
import { decideReentry, getReentryRequests, isEntryClosed, requestReentry } from './governance'
import { EXAM_TYPES } from './examTypes'
import { getActivityLogs, logActivity } from './activityLog'

export function DemoActivityPage() {
    const rows = getActivityLogs()
    return (
        <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
            <h2 className='text-xl font-semibold mb-3'>Demo activity log</h2>
            <p className='text-sm text-[#667085] mb-4'>Browser-side log of login, exports, and record changes made in this demo. This is not a secure audit trail.</p>
            <table className='w-full text-sm'>
                <thead className='text-xs bg-[#EDEEF5]'><tr>{['When', 'Actor', 'Action', 'Module', 'Record', 'Details'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr></thead>
                <tbody>
                    {rows.slice(0, 40).map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7]'>
                            <td className='px-2 py-3 whitespace-nowrap'>{row.timestamp?.replace('T', ' ').slice(0, 19)}</td>
                            <td className='px-2 py-3'>{row.actor}</td>
                            <td className='px-2 py-3'>{row.action}</td>
                            <td className='px-2 py-3'>{row.module}</td>
                            <td className='px-2 py-3'>{row.recordId || '—'}</td>
                            <td className='px-2 py-3'>{row.details || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
import RegisterPage from './RegisterPage'

const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

export function BiometricAttendancePage({ canOverride = false }) {
    const actor = canOverride ? 'Teacher' : 'Coordinator'
    const [rows, setRows] = useState(() => getBiometricRows())
    const [lastSync, setLastSync] = useState(rows[0]?.lastSync || '')
    const [reason, setReason] = useState('Official duty')
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let cancelled = false
        hydrateBiometricFromApi().finally(() => {
            if (cancelled) return
            const loaded = getBiometricRows()
            setRows(loaded)
            setLastSync(loaded[0]?.lastSync || '')
            setLoading(false)
        })
        return () => { cancelled = true }
    }, [])

    const sync = async () => {
        if (entryBlocked('Attendance', actor)) return
        setBusy(true)
        try {
            const result = await syncBiometricDemo()
            setRows(result.rows)
            if (!result.success) {
                toast.error(result.message)
                return
            }
            setLastSync(result.rows[0]?.lastSync || '')
            toast.success('Demo biometric sync completed.')
        } finally {
            setBusy(false)
        }
    }

    const override = async (id, status) => {
        if (entryBlocked('Attendance', actor)) return
        if (!reason.trim()) {
            toast.error('A reason is required for an override.')
            return
        }
        setBusy(true)
        try {
            const result = await overrideAttendance(id, status, actor, reason.trim())
            setRows(result.rows)
            if (result.success) toast.success(`Final status set to ${status}.`)
            else toast.error(result.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <section className='space-y-4'>
            <EntryClosureGate moduleName='Attendance' actor={actor} />
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>Biometric attendance</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Source: ESSL · Two punches per day (morning + afternoon). Missing one half = Half Day.
                    Last demo sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Not synced'}. Live device import is still off until eSSL is reachable.
                </p>
                <button type='button' onClick={sync} disabled={loading || busy} className='mt-3 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'>
                    {busy ? 'Working…' : 'Sync Biometric Data'}
                </button>
                {canOverride && (
                    <label className='block mt-3 text-sm'>Override reason
                        <input value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} mt-1 max-w-md`} />
                    </label>
                )}
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {[
                                'Person',
                                'Morning check-in',
                                'Morning check-out',
                                'Morning status',
                                'Afternoon check-in',
                                'Afternoon check-out',
                                'Afternoon status',
                                'Day status',
                                'Final status',
                                canOverride ? 'Override' : '',
                            ].filter(Boolean).map((label) => (
                                <th key={label} className='px-2 py-3 text-left whitespace-nowrap'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(loading || rows.length === 0) && (
                            <tr>
                                <td colSpan={canOverride ? 10 : 9} className='px-2 py-6 text-center text-[#667085]'>
                                    {loading ? 'Loading biometric records…' : 'No biometric punches recorded yet.'}
                                </td>
                            </tr>
                        )}
                        {!loading && rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3 font-medium text-[#1E1E1E]'>{row.person}</td>
                                <td className='px-2 py-3'>{row.morningCheckIn || '—'}</td>
                                <td className='px-2 py-3'>{row.morningCheckOut || '—'}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.morningStatus || 'Absent'} /></td>
                                <td className='px-2 py-3'>{row.afternoonCheckIn || '—'}</td>
                                <td className='px-2 py-3'>{row.afternoonCheckOut || '—'}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.afternoonStatus || 'Absent'} /></td>
                                <td className='px-2 py-3'><StatusBadge status={row.dayStatus || row.biometricStatus} /></td>
                                <td className='px-2 py-3'><StatusBadge status={row.finalStatus} /></td>
                                {canOverride && (
                                    <td className='px-2 py-3'>
                                        <div className='flex gap-1 flex-wrap'>
                                            {['Present', 'Absent', 'Half Day', 'OD'].map((status) => (
                                                <button key={status} type='button' disabled={busy} onClick={() => override(row.id, status)} className='text-xs border border-[#515DEF] text-[#515DEF] rounded px-2 py-1 cursor-pointer disabled:opacity-50'>{status}</button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export { default as StudentAnalyticsPage } from '../StudentAnalytics/StudentAnalyticsPage'

export function BookFeePage() {
    const { bookFeeBreakup, updateBookFeeBreakup, financePersistence, financeStatus, students, setBookFeeBreakup, bootstrapDemoFeeLedger } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)
    const rows = (bookFeeBreakup?.length
        ? bookFeeBreakup
        : (!apiLive ? bookFeeRows() : [])
    ).map((row) => ({
        ...row,
        total: Number(row.quantity || 0) * Number(row.unitCost || 0),
    }))
    const total = rows.reduce((sum, row) => sum + row.total, 0)
    return (
        <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
            <h2 className='text-xl font-semibold mb-1'>Book fee breakup</h2>
            <p className='text-sm text-[#667085] mb-2'>
                {apiLive
                    ? `Rows from campus finance snapshot bookFeeBreakup (${financeStatus}). Edits push with finance state.`
                    : 'Offline demo book fee rows — enable Finance API for campus snapshot.'}
            </p>
            <p className='text-sm text-[#667085] mb-4'>
                Multiple vendor rows contribute to one assigned book fee. Line total ₹{total}
                {rows[0]?.assignedFee != null ? `. Assigned fee on the student record is ₹${rows[0].assignedFee}.` : '.'}
            </p>
            {apiLive && rows.length === 0 && (
                <div className='mb-4 flex flex-wrap gap-3 items-center'>
                    <p className='text-sm text-[#667085]'>No book fee rows on the snapshot yet.</p>
                    <button
                        type='button'
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'
                        onClick={() => {
                            const result = bootstrapDemoFeeLedger({ force: false })
                            if (!result?.success && students?.length) {
                                setBookFeeBreakup(students.slice(0, 5).map((student, index) => ({
                                    id: `BF-${String(student.id).slice(0, 8)}-${index}`,
                                    student: student.name || student.admissionNo,
                                    studentId: student.id,
                                    academicYear: '2026-27',
                                    vendor: 'Campus Bookstore',
                                    book: `${student.className || 'Class'} package`,
                                    quantity: 1,
                                    unitCost: 4200,
                                    assignedFee: 4200,
                                })))
                                toast.success('Book fee rows added to finance snapshot.')
                            } else if (result?.success) {
                                toast.success('Fee ledger bootstrap also seeded book fee rows.')
                            } else {
                                toast.error(result?.message || 'Could not seed book fee rows.')
                            }
                        }}
                    >
                        Seed book fee from enrolled students
                    </button>
                </div>
            )}
            <table className='w-full text-sm'>
                <thead className='text-xs bg-[#EDEEF5]'><tr>{['Student', 'Year', 'Vendor', 'Book', 'Qty', 'Unit', 'Line total'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr></thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>No book fee breakup rows.</td></tr>
                    ) : rows.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7]'>
                            <td className='px-2 py-3'>{row.student}</td>
                            <td className='px-2 py-3'>{row.academicYear}</td>
                            <td className='px-2 py-3'>{row.vendor}</td>
                            <td className='px-2 py-3'>{row.book}</td>
                            <td className='px-2 py-3'>
                                {apiLive ? (
                                    <input type='number' value={row.quantity} onChange={(event) => updateBookFeeBreakup(row.id, 'quantity', event.target.value)} className='w-20 border border-[#D9D9D9] rounded-md px-2 py-1' />
                                ) : row.quantity}
                            </td>
                            <td className='px-2 py-3'>
                                {apiLive ? (
                                    <input type='number' value={row.unitCost} onChange={(event) => updateBookFeeBreakup(row.id, 'unitCost', event.target.value)} className='w-24 border border-[#D9D9D9] rounded-md px-2 py-1' />
                                ) : row.unitCost}
                            </td>
                            <td className='px-2 py-3'>{row.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function BudgetPage() {
    const { annualBudget, updateAnnualBudget, financePersistence, financeStatus } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)
    const rows = (annualBudget || []).map((row) => {
        const variance = row.budget - row.actual
        const utilization = row.budget ? (row.actual / row.budget) * 100 : 0
        return { ...row, variance, utilization, balance: variance }
    })
    const option = {
        color: ['#515DEF', '#8E9BFF'],
        tooltip: { trigger: 'axis' },
        legend: { data: ['Budget', 'Actual'] },
        xAxis: { type: 'category', data: rows.map((row) => row.department) },
        yAxis: { type: 'value' },
        series: [
            { name: 'Budget', type: 'bar', data: rows.map((row) => row.budget) },
            { name: 'Actual', type: 'bar', data: rows.map((row) => row.actual) },
        ],
    }
    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>Annual budget vs actual</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    {apiLive
                        ? `Rows from campus finance snapshot annualBudget (${financeStatus}). Edits push with finance state.`
                        : 'Offline demo budget rows — enable Finance API for campus snapshot.'}
                </p>
                <ReactECharts option={option} style={{ height: 280 }} />
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'><tr>{['Department', 'Budget', 'Actual', 'Balance', 'Utilization %', 'Variance', 'Flag'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr></thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.department}{row.category ? ` · ${row.category}` : ''}</td>
                                <td className='px-2 py-3'><input type='number' value={row.budget} onChange={(event) => updateAnnualBudget(row.id, 'budget', event.target.value)} className='w-28 border border-[#D9D9D9] rounded-md px-2 py-1' /></td>
                                <td className='px-2 py-3'><input type='number' value={row.actual} onChange={(event) => updateAnnualBudget(row.id, 'actual', event.target.value)} className='w-28 border border-[#D9D9D9] rounded-md px-2 py-1' /></td>
                                <td className='px-2 py-3'>{row.balance}</td>
                                <td className='px-2 py-3'>{row.utilization.toFixed(1)}</td>
                                <td className='px-2 py-3'>{row.variance}</td>
                                <td className={`px-2 py-3 font-medium ${row.variance < 0 ? 'text-[#FF5722]' : 'text-[#4CAF50]'}`}>{row.variance < 0 ? 'Increase' : 'Decrease'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export function FeeProjectionPanel() {
    const stored = getFeeProjection()
    const [increase, setIncrease] = useState(stored.increasePct)
    const [applied, setApplied] = useState(stored.applied)
    const projected = projectFee(stored.currentFee, increase)
    return (
        <div className='bg-white rounded-2xl shadow-md p-4 mt-4'>
            <h3 className='text-lg font-semibold'>Next-year fee projection</h3>
            <p className='text-sm text-[#667085] mt-1'>Current fee ₹{stored.currentFee}. Projected = current + current × increase %.</p>
            <div className='flex flex-wrap gap-3 items-end mt-3'>
                <label className='text-sm'>Increase %
                    <input type='number' value={increase} onChange={(event) => setIncrease(event.target.value)} className={`${inputClass} mt-1 w-28`} />
                </label>
                <p className='text-sm'>Preview: <strong>₹{projected.toFixed(0)}</strong></p>
                <button type='button' className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer' onClick={() => { saveFeeProjection({ ...stored, increasePct: Number(increase), projected, applied: true, academicYear: '2027-28' }); setApplied(true); toast.success('2027-28 fee structure preview stored locally.') }}>Apply to 2027-28</button>
            </div>
            {applied && <p className='text-sm text-[#4CAF50] mt-2'>A local 2027-28 projection is stored. It does not delete the current year fee.</p>}
        </div>
    )
}

export function MfpPlaceholder() {
    const { installments, financePersistence, financeStatus, dashboardMetrics } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)
    const rows = useMemo(() => buildMfpFromInstallments(installments || []), [installments])
    const totals = useMemo(() => rows.reduce((acc, row) => ({
        demand: acc.demand + row.demand,
        collected: acc.collected + row.collected,
        outstanding: acc.outstanding + row.outstanding,
        overdue: acc.overdue + row.overdue,
    }), { demand: 0, collected: 0, outstanding: 0, overdue: 0 }), [rows])
    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>MFP Report — Monthly Fee Performance</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    {apiLive
                        ? `Derived from campus fee installments on the finance snapshot (${financeStatus}). Demand / collected / outstanding are installment totals — not invented KPIs.`
                        : 'Offline: derived from local installment rows when present.'}
                </p>
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4'>
                    {[
                        { label: 'Demand', value: totals.demand },
                        { label: 'Collected', value: totals.collected },
                        { label: 'Outstanding', value: totals.outstanding },
                        { label: 'Overdue', value: totals.overdue },
                    ].map((card) => (
                        <div key={card.label} className='rounded-xl border border-[#F2F4F7] p-3'>
                            <p className='text-xs text-[#667085]'>{card.label}</p>
                            <p className='text-lg font-semibold text-[#1E1E1E]'>₹{Math.round(card.value).toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                </div>
                {dashboardMetrics?.collectionEfficiency != null && (
                    <p className='text-sm text-[#667085] mt-3'>
                        Snapshot collection efficiency: {Number(dashboardMetrics.collectionEfficiency).toFixed(1)}%
                    </p>
                )}
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['Month', 'Students', 'Demand', 'Collected', 'Outstanding', 'Overdue', 'Collection %'].map((label) => (
                                <th key={label} className='px-2 py-3 text-left'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                    No installment demand on the finance snapshot yet. Use Settings → Bootstrap campus fee ledger.
                                </td>
                            </tr>
                        ) : rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.label}</td>
                                <td className='px-2 py-3'>{row.studentCount}</td>
                                <td className='px-2 py-3'>₹{Math.round(row.demand).toLocaleString('en-IN')}</td>
                                <td className='px-2 py-3'>₹{Math.round(row.collected).toLocaleString('en-IN')}</td>
                                <td className='px-2 py-3'>₹{Math.round(row.outstanding).toLocaleString('en-IN')}</td>
                                <td className='px-2 py-3'>₹{Math.round(row.overdue).toLocaleString('en-IN')}</td>
                                <td className='px-2 py-3'>{row.collectionPct.toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export function SpecificationPage({ title }) {
    return (
        <div className='bg-white rounded-2xl shadow-md p-8'>
            <h2 className='text-xl font-semibold'>{title}</h2>
            <p className='text-sm text-[#667085] mt-2'>Specification required. A detailed workflow was not supplied, so this page is only a placeholder.</p>
        </div>
    )
}

export function IssueStockPage() {
    const [items] = useState(() => getInventory())
    const [movements, setMovements] = useState(() => getMovements())
    const [form, setForm] = useState({ itemName: items[0]?.name || '', quantity: 1, to: 'Housekeeping', receivedBy: 'Housekeeping Supervisor' })
    const submit = (event) => {
        event.preventDefault()
        if (entryBlocked('Inventory', 'Stores Manager')) return
        const result = issueStock({ ...form, issuedBy: 'Stores Manager' })
        if (!result.ok) {
            toast.error(result.message)
            return
        }
        setMovements(getMovements())
        toast.success('Stock issued. Housekeeping can see the same movement.')
    }
    return (
        <section className='space-y-4'>
            <EntryClosureGate moduleName='Inventory' actor='Stores Manager' />
            <form onSubmit={submit} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-4 gap-3'>
                <select value={form.itemName} onChange={(event) => setForm({ ...form, itemName: event.target.value })} className={inputClass}>{items.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                <input type='number' min='1' value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className={inputClass} />
                <select value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} className={inputClass}>{['Housekeeping', 'Academics', 'Café', 'Laboratory'].map((item) => <option key={item}>{item}</option>)}</select>
                <button className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer'>Issue stock</button>
            </form>
            <MovementTable rows={movements} />
        </section>
    )
}

export function MovementTable({ rows, department }) {
    const visible = department ? rows.filter((row) => row.to === department || row.from === department) : rows
    return (
        <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
            <h2 className='text-lg font-semibold mb-3'>Inventory movement {department ? `· ${department}` : ''}</h2>
            <table className='w-full text-sm'>
                <thead className='text-xs bg-[#EDEEF5]'><tr>{['ID', 'Item', 'Qty', 'From', 'To', 'Issued by', 'Date', 'Status'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr></thead>
                <tbody>
                    {visible.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7]'>
                            <td className='px-2 py-3'>{row.id}</td>
                            <td className='px-2 py-3'>{row.item}</td>
                            <td className='px-2 py-3'>{row.quantity}</td>
                            <td className='px-2 py-3'>{row.from}</td>
                            <td className='px-2 py-3'>{row.to}</td>
                            <td className='px-2 py-3'>{row.issuedBy}</td>
                            <td className='px-2 py-3'>{row.date}</td>
                            <td className='px-2 py-3'><StatusBadge status={row.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function RequirementsPage({ department, requestedBy, lockDepartment = false }) {
    const [rows, setRows] = useState(() => getRequirements())
    const [form, setForm] = useState({ item: 'Floor cleaner', quantity: 10, requiredDate: '2026-09-30', remarks: '', year: '2026-27', planType: 'Annual minimum order' })
    const visible = lockDepartment ? rows.filter((row) => row.department === department) : rows
    const submit = (event) => {
        event.preventDefault()
        addRequirement({ ...form, department, requestedBy, year: form.year, planType: form.planType })
        setRows(getRequirements())
        toast.success('Requirement sent to Stores. Vendor is not required.')
    }
    return (
        <section className='space-y-4'>
            <form onSubmit={submit} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-4 gap-3'>
                <select value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} className={inputClass}><option>2026-27</option><option>2025-26</option></select>
                <input value={form.item} onChange={(event) => setForm({ ...form, item: event.target.value })} className={inputClass} placeholder='Item' />
                <input type='number' value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className={inputClass} />
                <input type='date' value={form.requiredDate} onChange={(event) => setForm({ ...form, requiredDate: event.target.value })} className={inputClass} />
                <button className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer'>Submit requirement</button>
            </form>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'><tr>{['ID', 'Item', 'Qty', 'Department', 'Required', 'Status'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr></thead>
                    <tbody>
                        {visible.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.item}</td>
                                <td className='px-2 py-3'>{row.quantity}</td>
                                <td className='px-2 py-3'>{row.department}</td>
                                <td className='px-2 py-3'>{row.requiredDate}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export function ReentryPage() {
    const [rows, setRows] = useState(() => getReentryRequests())
    const closed = isEntryClosed('Mark Entry')
    const ask = () => {
        requestReentry({ module: 'Mark Entry', record: 'CA / RCT September', reason: 'Mentor correction after closure', requestedBy: 'Coordinator' })
        setRows(getReentryRequests())
        toast.success('Re-entry request sent to Super Admin.')
    }
    const decide = (id, approved) => {
        setRows(decideReentry(id, approved, 'Super Admin'))
        toast.success(approved ? 'Temporary unlock granted.' : 'Re-entry rejected.')
    }
    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>Entry closure and re-entry</h2>
                <p className='text-sm text-[#667085] mt-1'>Mark Entry for September is {closed ? 'closed' : 'open'} in this demo. Server enforcement is not used.</p>
                <button type='button' onClick={ask} className='mt-3 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'>Request re-entry</button>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'><tr>{['ID', 'Module', 'Requested by', 'Reason', 'Status', 'Action'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr></thead>
                    <tbody>
                        {rows.length === 0 && <tr><td colSpan={6} className='px-2 py-6 text-[#667085]'>No re-entry requests yet.</td></tr>}
                        {rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.module}</td>
                                <td className='px-2 py-3'>{row.requestedBy}</td>
                                <td className='px-2 py-3'>{row.reason}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.status} /></td>
                                <td className='px-2 py-3'>
                                    {row.status === 'Pending' && (
                                        <button type='button' onClick={() => decide(row.id, true)} className='text-[#515DEF] text-xs cursor-pointer'>Approve unlock</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export function ExamTypesPage() {
    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <h2 className='text-xl font-semibold'>Exam</h2>
            <p className='text-sm text-[#667085] mt-1'>Shared exam and test types used by evaluation forms.</p>
            <ul className='mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm'>
                {EXAM_TYPES.map((item) => <li key={item} className='border border-[#EDEEF5] rounded-md px-3 py-2'>{item}</li>)}
            </ul>
        </div>
    )
}

export { default as AssetImportPage } from '../../Pages/ITSupportManager/DataImport/DataImport'

const profileField = (label, value) => (
    <div>
        <p className='text-xs text-[#808080]'>{label}</p>
        <p className='text-sm text-[#1E1E1E] mt-0.5'>{value || '—'}</p>
    </div>
)

export function MyProfilePage({ roleLabel }) {
    const { email, name } = useAuth()
    const api = canUseEmployeeDirectoryApi()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(api)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!api) {
            setProfile(null)
            setLoading(false)
            setError('')
            return undefined
        }
        let cancelled = false
        setLoading(true)
        setError('')
        loadEmployeeDirectory()
            .then(({ records }) => {
                if (cancelled) return
                const emailKey = String(email || '').trim().toLowerCase()
                const nameKey = String(name || '').trim().toLowerCase()
                const match = records.find((item) => {
                    const row = item.row || item.detail || {}
                    if (emailKey && String(row.email || row.contact?.email || '').trim().toLowerCase() === emailKey) return true
                    if (nameKey && String(row.name || '').trim().toLowerCase() === nameKey) return true
                    return false
                })
                setProfile(match?.detail || match?.row || null)
            })
            .catch((err) => {
                if (cancelled) return
                setError(err?.message || 'Employee directory could not be loaded.')
                setProfile(null)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [api, email, name])

    if (loading) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                Loading {roleLabel?.toLowerCase() || 'staff'} profile…
            </section>
        )
    }

    if (!api) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center space-y-2'>
                <h2 className='text-xl font-semibold text-black'>My Profile</h2>
                <p className='text-sm text-[#667085]'>
                    Employee directory API is not available. Sign in against the campus API to load this {roleLabel?.toLowerCase() || 'staff'} profile.
                </p>
            </section>
        )
    }

    if (error || !profile) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center space-y-2'>
                <h2 className='text-xl font-semibold text-black'>My Profile</h2>
                <p className='text-sm text-[#667085]'>
                    {error || 'No employee directory record is linked to this login yet.'}
                </p>
                <p className='text-xs text-[#667085]'>
                    HR must create the staff record (matching this account email) before personal and employment details appear here.
                </p>
            </section>
        )
    }

    const contact = profile.contact || {}
    const employment = profile.employmentInfo || {}
    const professional = profile.professionalInfo || {}

    return (
        <section className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
                <h2 className='text-lg font-semibold'>Personal Details</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {profileField('Name', profile.name || profile.firstName)}
                    {profileField('Email', profile.email || contact.email || email)}
                    {profileField('Mobile', profile.mobileNumber || contact.mobileNumber)}
                    {profileField('Gender', profile.gender)}
                    {profileField('Date of birth', profile.dateOfBirth)}
                </div>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
                <h2 className='text-lg font-semibold'>Employment Details</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {profileField('Employee ID', profile.employeeId || profile.id)}
                    {profileField('Department', profile.department)}
                    {profileField('Designation', employment.designation || profile.role)}
                    {profileField('Employee type', employment.employeeType)}
                    {profileField('Joining date', professional.joiningDate)}
                    {profileField('Status', employment.status || profile.status)}
                </div>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-lg font-semibold'>Attendance</h2>
                <p className='text-sm text-[#667085] mt-2'>
                    Attendance continues to come from the existing My Attendance module.
                </p>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-lg font-semibold'>Leave Requests</h2>
                <p className='text-sm text-[#667085] mt-2'>
                    Leave requests continue to use the shared leave store.
                </p>
            </div>
        </section>
    )
}

export function BuildingMaintenancePage() {
    return (
        <RegisterPage
            title='Building maintenance actuals'
            description='Demo register for known categories. EB maintenance official format is still pending specification.'
            storageKey='schoolerp-building-maintenance-v1'
            seed={[{ id: 'BM-0001', date: '2026-09-10', category: 'Light', location: 'Block B corridor', cost: 2400, remarks: 'Replaced fittings', status: 'Completed' }]}
            columns={[{ key: 'date', label: 'Date' }, { key: 'category', label: 'Category' }, { key: 'location', label: 'Location' }, { key: 'cost', label: 'Cost' }, { key: 'status', label: 'Status' }]}
            fields={[
                { key: 'date', label: 'Date', type: 'date', required: true },
                { key: 'category', label: 'Category', type: 'select', options: ['Wire', 'Light', 'Other'], required: true },
                { key: 'location', label: 'Location', required: true },
                { key: 'cost', label: 'Cost', type: 'number' },
                { key: 'remarks', label: 'Remarks', type: 'textarea' },
                { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed'] },
            ]}
            idPrefix='BM-'
            statusKey='status'
            searchKeys={['category', 'location']}
        />
    )
}

export function HousekeepingDutyPage() {
    return (
        <RegisterPage
            title='Duty Allotment'
            storageKey='schoolerp-housekeeping-duty-v1'
            seed={[{ id: 'DUTY-2026-0001', staff: 'Lakshmi P.', area: 'Academic Block A', shift: 'Morning', dutyType: 'Daily Cleaning', assignedBy: 'Housekeeping Manager', date: '2026-09-23', startTime: '07:00', endTime: '11:00', priority: 'Normal', instructions: 'Classrooms', remarks: '', status: 'Assigned' }]}
            columns={[{ key: 'id', label: 'Duty ID' }, { key: 'staff', label: 'Staff' }, { key: 'area', label: 'Area' }, { key: 'shift', label: 'Shift' }, { key: 'dutyType', label: 'Duty' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' }]}
            fields={[
                { key: 'staff', label: 'Staff', required: true },
                { key: 'area', label: 'Area', required: true },
                { key: 'shift', label: 'Shift', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Night'] },
                { key: 'dutyType', label: 'Duty Type', type: 'select', options: ['Daily Cleaning', 'Deep Cleaning', 'Special'] },
                { key: 'assignedBy', label: 'Assigned By' },
                { key: 'date', label: 'Date', type: 'date' },
                { key: 'startTime', label: 'Start Time', type: 'time' },
                { key: 'endTime', label: 'End Time', type: 'time' },
                { key: 'priority', label: 'Priority', type: 'select', options: ['Normal', 'High'] },
                { key: 'instructions', label: 'Instructions', type: 'textarea' },
                { key: 'remarks', label: 'Remarks', type: 'textarea' },
                { key: 'status', label: 'Status', type: 'select', options: ['Assigned', 'In Progress', 'Completed'] },
            ]}
            idPrefix='DUTY-2026-'
            statusKey='status'
            searchKeys={['staff', 'area', 'shift', 'dutyType', 'remarks']}
        />
    )
}

export function SimpleRegister({ title, description, storageKey, seed, columns, fields, idPrefix, statusKey = 'status' }) {
    return (
        <RegisterPage
            title={title}
            description={description}
            storageKey={storageKey}
            seed={seed}
            columns={columns}
            fields={fields}
            idPrefix={idPrefix}
            statusKey={statusKey}
            searchKeys={columns.map((column) => column.key)}
        />
    )
}
