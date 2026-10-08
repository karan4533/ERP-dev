import { useState } from 'react'
import { useActiveStudent } from '../../context/ActiveStudentContext'
import { useFinance } from '../../Pages/AccountHead/financeDomain/FinanceContext'
import ReactECharts from 'echarts-for-react'
import { toast } from 'react-toastify'
import { getBiometricRows, overrideAttendance, syncBiometricDemo } from './biometric'
import { StatusBadge } from './statusBadge'
import { bookFeeRows, getFeeProjection, projectFee, saveFeeProjection } from './financeExtras'
import EntryClosureGate from './EntryClosureGate'
import { entryBlocked } from './governance'
import { addRequirement, getInventory, getMovements, getRequirements, issueStock } from './inventory'
import { decideReentry, getReentryRequests, isEntryClosed, requestReentry } from './governance'
import { EXAM_TYPES } from './examTypes'
import { ASSETS } from '../../Pages/ITSupportManager/AssetManagement/assetData'
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
import { ensureSeed, saveJson } from './storage'
import RegisterPage from './RegisterPage'

const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

export function BiometricAttendancePage({ canOverride = false }) {
    const actor = canOverride ? 'Teacher' : 'Coordinator'
    const [rows, setRows] = useState(() => getBiometricRows())
    const [lastSync, setLastSync] = useState(rows[0]?.lastSync || 'Not synced in this session')
    const [reason, setReason] = useState('Official duty')

    const sync = () => {
        if (entryBlocked('Attendance', actor)) return
        const next = syncBiometricDemo()
        setRows(next)
        setLastSync(next[0]?.lastSync || '')
        toast.success('Demo biometric sync completed.')
    }

    const override = (id, status) => {
        if (entryBlocked('Attendance', actor)) return
        if (!reason.trim()) {
            toast.error('A reason is required for an override.')
            return
        }
        setRows(overrideAttendance(id, status, 'Class Mentor', reason.trim()))
        toast.success(`Final status set to ${status}.`)
    }

    return (
        <section className='space-y-4'>
            <EntryClosureGate moduleName='Attendance' actor={actor} />
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>Biometric attendance</h2>
                <p className='text-sm text-[#667085] mt-1'>Source: ESSL · Last demo sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Not synced'}. This is a simulated sync.</p>
                <button type='button' onClick={sync} className='mt-3 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'>Sync Biometric Data</button>
                {canOverride && (
                    <label className='block mt-3 text-sm'>Override reason
                        <input value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} mt-1 max-w-md`} />
                    </label>
                )}
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>{['Person', 'Punch', 'Biometric status', 'Final status', 'Changed by', 'Reason', canOverride ? 'Override' : ''].filter(Boolean).map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.person}</td>
                                <td className='px-2 py-3'>{row.punchTime || '—'}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.biometricStatus} /></td>
                                <td className='px-2 py-3'><StatusBadge status={row.finalStatus} /></td>
                                <td className='px-2 py-3'>{row.changedBy || '—'}</td>
                                <td className='px-2 py-3'>{row.reason || '—'}</td>
                                {canOverride && (
                                    <td className='px-2 py-3'>
                                        <div className='flex gap-1 flex-wrap'>
                                            {['Present', 'Absent', 'Half Day', 'OD'].map((status) => (
                                                <button key={status} type='button' onClick={() => override(row.id, status)} className='text-xs border border-[#515DEF] text-[#515DEF] rounded px-2 py-1 cursor-pointer'>{status}</button>
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

function analyticsHistory(seedText) {
    const seed = [...String(seedText || 'student')].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const base = 62 + (seed % 18)
    return {
        '1 Year': {
            months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
            student: [base, base + 2, base + 4, base + 1, base + 6, base + 8],
            average: [base - 2, base - 1, base + 1, base + 1, base + 3, base + 4],
        },
        '3 Years': {
            months: ['2024', '2025', '2026'],
            student: [base - 4, base, base + 6],
            average: [base - 6, base - 2, base + 2],
        },
        '5 Years': {
            months: ['2022', '2023', '2024', '2025', '2026'],
            student: [base - 8, base - 4, base, base + 4, base + 8],
            average: [base - 6, base - 4, base - 2, base + 1, base + 3],
        },
    }
}

export function StudentAnalyticsPage() {
    const { activeStudent } = useActiveStudent()
    const studentName = activeStudent?.name || 'Student'
    const classLabel = activeStudent?.classSection || 'Grade 10-A'
    const [range, setRange] = useState('1 Year')
    const series = analyticsHistory(activeStudent?.id || studentName)[range]
    const option = {
        color: ['#515DEF', '#B4C4FF'],
        tooltip: { trigger: 'axis' },
        legend: { data: ['Student score', 'Class average'] },
        xAxis: { type: 'category', data: series.months },
        yAxis: { type: 'value', min: 50, max: 100 },
        series: [
            { name: 'Student score', type: 'line', data: series.student },
            { name: 'Class average', type: 'line', data: series.average },
        ],
    }
    return (
        <section className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
            <div className='flex justify-between gap-3 flex-wrap'>
                <div>
                    <h2 className='text-xl font-semibold'>Student performance comparison</h2>
                    <p className='text-sm text-[#667085]'>Student score and class average for {studentName}, {classLabel}. Monthly, yearly spans use deterministic demo history, not a live mark store. Official QMIS analytics format is not supplied.</p>
                </div>
                <select value={range} onChange={(event) => setRange(event.target.value)} className='border border-[#D9D9D9] rounded-md px-2 py-2 text-sm'>
                    {['1 Year', '3 Years', '5 Years'].map((item) => <option key={item}>{item}</option>)}
                </select>
            </div>
            <ReactECharts option={option} style={{ height: 320 }} />
        </section>
    )
}

export function BookFeePage() {
    const rows = bookFeeRows()
    const total = rows.reduce((sum, row) => sum + row.total, 0)
    return (
        <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
            <h2 className='text-xl font-semibold mb-1'>Book fee breakup</h2>
            <p className='text-sm text-[#667085] mb-4'>Multiple vendor rows contribute to one assigned book fee. Line total ₹{total}. Assigned fee on the student record is ₹{rows[0]?.assignedFee}.</p>
            <table className='w-full text-sm'>
                <thead className='text-xs bg-[#EDEEF5]'><tr>{['Student', 'Year', 'Vendor', 'Book', 'Qty', 'Unit', 'Line total'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr></thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7]'>
                            <td className='px-2 py-3'>{row.student}</td>
                            <td className='px-2 py-3'>{row.academicYear}</td>
                            <td className='px-2 py-3'>{row.vendor}</td>
                            <td className='px-2 py-3'>{row.book}</td>
                            <td className='px-2 py-3'>{row.quantity}</td>
                            <td className='px-2 py-3'>{row.unitCost}</td>
                            <td className='px-2 py-3'>{row.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function BudgetPage() {
    const { annualBudget, updateAnnualBudget } = useFinance()
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
    return (
        <div className='bg-white rounded-2xl shadow-md p-8'>
            <h2 className='text-xl font-semibold'>MFP Report</h2>
            <p className='text-sm text-[#667085] mt-2'>Template configuration pending stakeholder specification.</p>
        </div>
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

export function AssetImportPage() {
    const [preview, setPreview] = useState([])
    const [message, setMessage] = useState('')
    const download = () => {
        const csv = 'assetName,category,quantity,serialNumber\nDemo tablet,Others,2,TAB-001\n'
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'asset-import-template.csv'
        link.click()
        URL.revokeObjectURL(url)
        logActivity({ action: 'DOWNLOAD_CLICK', module: 'Asset Import', details: 'Template' })
    }
    const onFile = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(Boolean)
        const rows = lines.slice(1).map((line) => {
            const [assetName, category, quantity, serialNumber] = line.split(',')
            return { assetName, category, quantity, serialNumber, valid: Boolean(assetName && category) }
        })
        setPreview(rows)
        setMessage(`${file.name} loaded. ${rows.filter((row) => row.valid).length} valid of ${rows.length}.`)
    }
    const importRows = () => {
        const existing = ensureSeed('schoolerp-asset-management-v1', ASSETS)
        const imported = preview.filter((row) => row.valid).map((row, index) => ({
            assetId: `AST-IMP-${Date.now()}-${index}`,
            assetName: row.assetName,
            category: row.category || 'Others',
            quantity: Number(row.quantity) || 1,
            serialNumber: row.serialNumber,
            status: 'Active',
            brand: 'Imported',
            model: 'Demo',
        }))
        saveJson('schoolerp-asset-management-v1', [...imported, ...existing])
        logActivity({ action: 'CREATE', module: 'Asset Import', details: `${imported.length} demo records` })
        toast.success(`${imported.length} demo asset records imported locally.`)
    }
    return (
        <section className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
            <h2 className='text-xl font-semibold'>Initial data import</h2>
            <p className='text-sm text-[#667085]'>Browser-side CSV preview. No server upload.</p>
            <div className='flex flex-wrap gap-2'>
                <button type='button' onClick={download} className='border border-[#515DEF] text-[#515DEF] text-sm px-3 py-2 rounded-md cursor-pointer'>Download Import Template</button>
                <label className='bg-[#515DEF] text-white text-sm px-3 py-2 rounded-md cursor-pointer'>Upload File<input type='file' accept='.csv,text/csv' className='hidden' onChange={onFile} /></label>
                <button type='button' onClick={importRows} disabled={!preview.length} className='bg-[#515DEF] text-white text-sm px-3 py-2 rounded-md cursor-pointer disabled:opacity-50'>Import Demo Records</button>
            </div>
            {message && <p className='text-sm'>{message}</p>}
            {preview.length > 0 && (
                <table className='w-full text-sm'>
                    <thead><tr>{['Name', 'Category', 'Qty', 'Serial', 'Validate'].map((label) => <th key={label} className='text-left px-2 py-2'>{label}</th>)}</tr></thead>
                    <tbody>{preview.map((row) => <tr key={row.serialNumber}><td className='px-2 py-2'>{row.assetName}</td><td>{row.category}</td><td>{row.quantity}</td><td>{row.serialNumber}</td><td>{row.valid ? 'Valid' : 'Invalid'}</td></tr>)}</tbody>
                </table>
            )}
        </section>
    )
}

export function MyProfilePage({ roleLabel }) {
    return (
        <section className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {['Personal Details', 'Employment Details', 'Attendance', 'Leave Requests'].map((title) => (
                <div key={title} className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-lg font-semibold'>{title}</h2>
                    <p className='text-sm text-[#667085] mt-2'>
                        {title === 'Personal Details' && `${roleLabel} demo profile. Name is taken from the signed-in session when available.`}
                        {title === 'Employment Details' && 'Department and designation stay on the existing employee record. This page does not copy a second employee master.'}
                        {title === 'Attendance' && 'Attendance continues to come from the existing My Attendance module, including the ESSL demo sync.'}
                        {title === 'Leave Requests' && 'Leave requests continue to use the shared leave store. Coordinator can view relevant leave from the leave menu.'}
                    </p>
                </div>
            ))}
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
            seed={[{ id: 'DUTY-2026-0001', staff: 'Lakshmi P.', area: 'Academic Block A', dutyType: 'Daily Cleaning', assignedBy: 'Housekeeping Manager', date: '2026-09-23', startTime: '07:00', endTime: '11:00', priority: 'Normal', instructions: 'Classrooms', remarks: '', status: 'Assigned' }]}
            columns={[{ key: 'id', label: 'Duty ID' }, { key: 'staff', label: 'Staff' }, { key: 'area', label: 'Area' }, { key: 'dutyType', label: 'Duty' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' }]}
            fields={[
                { key: 'staff', label: 'Staff', required: true },
                { key: 'area', label: 'Area', required: true },
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
            searchKeys={['staff', 'area', 'dutyType', 'remarks']}
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
