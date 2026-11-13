import React, { useState } from 'react'
import { AlertTriangle, Fuel, Gauge, Plus, Wrench, X, Zap } from 'lucide-react'
import { toast } from 'react-toastify'
import { DataTable, StatusBadge } from '../../../Common/ui'

const INITIAL_WORK_ORDERS = [
    {
        id: 'WO-2026-0819',
        serviceType: 'Electrical (EB)',
        block: 'Academic Block A — 2nd Floor',
        reportedBy: 'Senior Coordinator',
        technician: 'K. Murugan (Campus Electrician)',
        issue: 'Main distribution board circuit breaker tripping intermittently during peak load',
        cost: '₹1,850',
        priority: 'High',
        status: 'Work In Progress',
        reportedDate: '2026-10-21',
    },
    {
        id: 'WO-2026-0814',
        serviceType: 'Civil & Plumbing',
        block: 'Cafeteria & Dining Hall',
        reportedBy: 'Café Manager',
        technician: 'S. Ramanathan (Plumber)',
        issue: 'Dishwashing area drainage pipe joint leakage repaired and resealed',
        cost: '₹650',
        priority: 'Medium',
        status: 'Completed',
        reportedDate: '2026-10-18',
    },
    {
        id: 'WO-2026-0802',
        serviceType: 'DG GenSet & Backup',
        block: 'Power Substation & Generator Yard',
        reportedBy: 'Operations Assistant',
        technician: 'Cummins India AMC Engineer',
        issue: 'Quarterly preventative service, oil filter replacement, and radiator coolant top-up',
        cost: '₹14,200',
        priority: 'Preventive',
        status: 'Completed',
        reportedDate: '2026-10-12',
    },
    {
        id: 'WO-2026-0798',
        serviceType: 'Air Conditioning AMC',
        block: 'Primary Computer Lab & Server Room',
        reportedBy: 'IT Support Manager',
        technician: 'Blue Star Service Partner',
        issue: 'Inverter split AC gas recharge and cooling coil cleaning completed',
        cost: '₹3,400',
        priority: 'Medium',
        status: 'Completed',
        reportedDate: '2026-10-09',
    },
]

const INITIAL_GENSET_LOGS = [
    {
        id: 'GEN-2026-104',
        date: '2026-10-20',
        runningHours: '2.5 hrs',
        fuelAdded: '35 Litres',
        powerCutReason: 'TANGEDCO Scheduled Substation Maintenance',
        operator: 'K. Murugan',
    },
    {
        id: 'GEN-2026-101',
        date: '2026-10-14',
        runningHours: '1.2 hrs',
        fuelAdded: '15 Litres',
        powerCutReason: 'Local Transformer Line Tripping',
        operator: 'K. Murugan',
    },
]

const CampusMaintenance = () => {
    const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS)
    const [genLogs, setGenLogs] = useState(INITIAL_GENSET_LOGS)
    const [activeTab, setActiveTab] = useState('workorders')
    const [isOrderModal, setIsOrderModal] = useState(false)
    const [isGenModal, setIsGenModal] = useState(false)

    const [orderForm, setOrderForm] = useState({
        serviceType: 'Electrical (EB)',
        block: '',
        reportedBy: 'Joint Director Office',
        technician: 'K. Murugan (Campus Electrician)',
        issue: '',
        priority: 'Medium',
    })

    const [genForm, setGenForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        runningHours: '',
        fuelAdded: '',
        powerCutReason: 'TANGEDCO Grid Power Interruption',
        operator: 'K. Murugan (Substation Operator)',
    })

    const handleCreateOrder = (e) => {
        e.preventDefault()
        if (!orderForm.block.trim() || !orderForm.issue.trim()) {
            toast.error('Location block and issue description are required.')
            return
        }

        const newOrder = {
            id: `WO-2026-${String(workOrders.length + 820).padStart(4, '0')}`,
            ...orderForm,
            cost: '—',
            status: 'Reported',
            reportedDate: new Date().toISOString().slice(0, 10),
        }

        setWorkOrders([newOrder, ...workOrders])
        setIsOrderModal(false)
        setOrderForm({
            serviceType: 'Electrical (EB)',
            block: '',
            reportedBy: 'Joint Director Office',
            technician: 'K. Murugan (Campus Electrician)',
            issue: '',
            priority: 'Medium',
        })
        toast.success(`Maintenance work order ${newOrder.id} dispatched to technician.`)
    }

    const handleCreateGenLog = (e) => {
        e.preventDefault()
        if (!genForm.runningHours.trim() || !genForm.fuelAdded.trim()) {
            toast.error('Running hours and fuel quantity are required.')
            return
        }

        const newLog = {
            id: `GEN-2026-${String(genLogs.length + 105).padStart(3, '0')}`,
            ...genForm,
        }

        setGenLogs([newLog, ...genLogs])
        setIsGenModal(false)
        setGenForm({
            date: new Date().toISOString().slice(0, 10),
            runningHours: '',
            fuelAdded: '',
            powerCutReason: 'TANGEDCO Grid Power Interruption',
            operator: 'K. Murugan (Substation Operator)',
        })
        toast.success('Diesel generator running entry logged in power logbook.')
    }

    const orderColumns = [
        { key: 'id', label: 'Order ID', required: true, render: (row) => <span className='font-mono font-bold'>{row.id}</span> },
        {
            key: 'serviceType',
            label: 'Service Domain & Location',
            required: true,
            render: (row) => (
                <div>
                    <p className='font-semibold text-[var(--erp-ink)]'>{row.serviceType}</p>
                    <p className='text-xs text-[var(--erp-muted)]'>{row.block}</p>
                </div>
            ),
        },
        { key: 'issue', label: 'Problem / Work Particulars', render: (row) => <span className='text-xs font-medium text-slate-700 block max-w-sm'>{row.issue}</span> },
        { key: 'technician', label: 'Assigned Tech / AMC', render: (row) => <span className='text-xs text-slate-600'>{row.technician}</span> },
        { key: 'cost', label: 'Spares / Cost', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.cost}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    const genColumns = [
        { key: 'id', label: 'Log ID', required: true, render: (row) => <span className='font-mono font-bold'>{row.id}</span> },
        { key: 'date', label: 'Date', render: (row) => row.date },
        { key: 'runningHours', label: 'Running Duration', render: (row) => <span className='font-semibold text-[var(--erp-indigo)]'>{row.runningHours}</span> },
        { key: 'fuelAdded', label: 'Diesel Consumed / Added', render: (row) => <span className='font-semibold text-amber-700'>{row.fuelAdded}</span> },
        { key: 'powerCutReason', label: 'Grid Outage Reason', render: (row) => <span className='text-xs text-slate-600'>{row.powerCutReason}</span> },
        { key: 'operator', label: 'Substation Incharge', render: (row) => <span className='text-xs text-slate-700'>{row.operator}</span> },
    ]

    return (
        <section className='space-y-5'>
            <div className='flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-md'>
                <div>
                    <div className='flex items-center gap-2'>
                        <span className='rounded-lg bg-amber-100 p-2 text-amber-800'>
                            <Wrench size={22} />
                        </span>
                        <h1 className='text-xl font-bold text-[var(--erp-ink)]'>
                            Campus Maintenance &amp; Power Infrastructure
                        </h1>
                    </div>
                    <p className='text-xs text-[var(--erp-muted)] mt-1'>
                        Electrical (EB), civil repairs, plumbing, HVAC AMC contractors, and DG generator diesel logbook.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    {activeTab === 'workorders' ? (
                        <button
                            type='button'
                            onClick={() => setIsOrderModal(true)}
                            className='inline-flex items-center gap-1.5 rounded-lg bg-[var(--erp-indigo)] px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-[var(--erp-indigo-dark)]'
                        >
                            <Plus size={16} /> Dispatch Work Order
                        </button>
                    ) : (
                        <button
                            type='button'
                            onClick={() => setIsGenModal(true)}
                            className='inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-amber-700'
                        >
                            <Fuel size={16} /> Log DG Generator Run
                        </button>
                    )}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md overflow-hidden'>
                <div className='flex border-b border-[var(--erp-line)] px-5 pt-3 gap-5'>
                    <button
                        type='button'
                        onClick={() => setActiveTab('workorders')}
                        className={`pb-3 text-sm font-semibold border-b-2 cursor-pointer ${
                            activeTab === 'workorders'
                                ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                                : 'border-transparent text-[var(--erp-slate)]'
                        }`}
                    >
                        Maintenance Work Orders &amp; AMC
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab('genset')}
                        className={`pb-3 text-sm font-semibold border-b-2 cursor-pointer ${
                            activeTab === 'genset'
                                ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                                : 'border-transparent text-[var(--erp-slate)]'
                        }`}
                    >
                        Diesel Generator (DG) &amp; EB Power Log
                    </button>
                </div>

                <div className='p-4'>
                    {activeTab === 'workorders' ? (
                        <DataTable
                            caption='Maintenance work orders'
                            rows={workOrders}
                            columns={orderColumns}
                            rowKey='id'
                        />
                    ) : (
                        <DataTable
                            caption='Generator running logs'
                            rows={genLogs}
                            columns={genColumns}
                            rowKey='id'
                        />
                    )}
                </div>
            </div>

            {/* Work Order Modal */}
            {isOrderModal && (
                <div className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <h3 className='text-base font-bold text-[var(--erp-ink)]'>Dispatch Maintenance Work Order</h3>
                            <button onClick={() => setIsOrderModal(false)} className='p-1 text-slate-400 hover:bg-slate-100 rounded-lg'>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrder} className='mt-4 space-y-3'>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Service Domain *</label>
                                <select
                                    className='w-full text-xs rounded-lg border px-3 py-2 bg-white'
                                    value={orderForm.serviceType}
                                    onChange={(e) => setOrderForm({ ...orderForm, serviceType: e.target.value })}
                                >
                                    <option>Electrical (EB)</option>
                                    <option>Civil &amp; Carpentry</option>
                                    <option>Plumbing &amp; RO Systems</option>
                                    <option>DG GenSet &amp; Backup</option>
                                    <option>Air Conditioning AMC</option>
                                </select>
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Location / Block *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='e.g. Block B, 1st Floor Boys Washroom'
                                    value={orderForm.block}
                                    onChange={(e) => setOrderForm({ ...orderForm, block: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Assigned Technician / Contractor</label>
                                <input
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    value={orderForm.technician}
                                    onChange={(e) => setOrderForm({ ...orderForm, technician: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Work Order Description *</label>
                                <textarea
                                    required
                                    rows={3}
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='Specify breakdown details, faulty components...'
                                    value={orderForm.issue}
                                    onChange={(e) => setOrderForm({ ...orderForm, issue: e.target.value })}
                                />
                            </div>
                            <div className='flex justify-end gap-2 border-t pt-3'>
                                <button type='button' onClick={() => setIsOrderModal(false)} className='rounded-lg border px-3 py-1.5 text-xs'>Cancel</button>
                                <button type='submit' className='rounded-lg bg-[var(--erp-indigo)] px-4 py-1.5 text-xs font-semibold text-white'>Dispatch Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* GenSet Modal */}
            {isGenModal && (
                <div className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <h3 className='text-base font-bold text-[var(--erp-ink)]'>Log Diesel Generator Run</h3>
                            <button onClick={() => setIsGenModal(false)} className='p-1 text-slate-400 hover:bg-slate-100 rounded-lg'>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateGenLog} className='mt-4 space-y-3'>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Date *</label>
                                <input
                                    type='date'
                                    required
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    value={genForm.date}
                                    onChange={(e) => setGenForm({ ...genForm, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Running Hours (e.g. 2.5 hrs) *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='e.g. 2.5 hrs'
                                    value={genForm.runningHours}
                                    onChange={(e) => setGenForm({ ...genForm, runningHours: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Diesel Fuel Added (Litres) *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='e.g. 30 Litres'
                                    value={genForm.fuelAdded}
                                    onChange={(e) => setGenForm({ ...genForm, fuelAdded: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Grid Outage / Run Reason</label>
                                <input
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    value={genForm.powerCutReason}
                                    onChange={(e) => setGenForm({ ...genForm, powerCutReason: e.target.value })}
                                />
                            </div>
                            <div className='flex justify-end gap-2 border-t pt-3'>
                                <button type='button' onClick={() => setIsGenModal(false)} className='rounded-lg border px-3 py-1.5 text-xs'>Cancel</button>
                                <button type='submit' className='rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white'>Save Power Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default CampusMaintenance
