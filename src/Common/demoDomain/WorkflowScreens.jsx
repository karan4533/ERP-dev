import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import RegisterPage from './RegisterPage'
import { StatusBadge } from './statusBadge'
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

export function ProcurementBoard({ department, requestedBy }) {
    const [rows, setRows] = useState(() => getProcurementRequests())
    const [orders] = useState(() => getPurchaseOrders())
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [minor, setMinor] = useState(true)
    const approver = getApprovers().find((item) => item.department === department)

    const refresh = () => setRows(getProcurementRequests())

    const create = (event) => {
        event.preventDefault()
        if (!title.trim()) {
            toast.error('Request title is required.')
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

    const visible = rows.filter((row) => row.department === department || department === 'All')

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Purchase workflow</h2>
                <p className='text-sm text-[#667085] mt-1'>Shared request for {department}. Primary approver: {approver?.primaryApprover || 'Department Head'}.</p>
                <p className='text-xs text-[#808080] mt-2'>{PROCUREMENT_STATUSES.join(' → ')}</p>
                <button type='button' onClick={downloadQuotationTemplate} className='mt-3 text-sm text-[#515DEF] underline cursor-pointer'>Download comparative quotation template</button>
                <form onSubmit={create} className='grid grid-cols-1 md:grid-cols-4 gap-3 mt-4'>
                    <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder='Request title' className='border border-[#D9D9D9] rounded-md px-2 py-2 text-sm' />
                    <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder='Amount' type='number' className='border border-[#D9D9D9] rounded-md px-2 py-2 text-sm' />
                    <label className='text-sm flex items-center gap-2'>
                        <input type='checkbox' checked={minor} onChange={(event) => setMinor(event.target.checked)} />
                        Minor purchase
                    </label>
                    <button type='submit' className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer'>Create request</button>
                </form>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['Request', 'Title', 'Amount', 'Status', 'PO', 'Action'].map((label) => (
                                <th key={label} className='px-2 py-3 text-[#0C1E5B] uppercase'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.title}</td>
                                <td className='px-2 py-3'>{row.amount}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.status} /></td>
                                <td className='px-2 py-3'>{row.poNumber || '—'}</td>
                                <td className='px-2 py-3'>
                                    <button type='button' onClick={() => { advanceProcurement(row.id, requestedBy); refresh(); toast.success('Workflow advanced.') }} className='text-[#515DEF] text-xs cursor-pointer'>Advance</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <h3 className='text-base font-semibold mt-6 mb-2'>Purchase orders</h3>
                <ul className='text-sm text-[#667085] space-y-1'>
                    {orders.map((order) => <li key={order.id}>{order.id} · {order.requestId} · {order.status} · ₹{order.amount}</li>)}
                </ul>
            </div>
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
