import React, { useEffect, useState, useMemo } from 'react'
import {
    ShieldCheck,
    Plus,
    Calendar,
    AlertTriangle,
    RotateCw,
    Building2,
    Search,
    RefreshCw,
    Receipt,
    Archive,
    CheckCircle2,
    X,
    FileText
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const PERMIT_TYPES = [
    'ALL',
    'Fire Safety Certificate & NOC',
    'Building Structural Stability Certificate (Form A, B, C)',
    'Public Health & Sanitary Certificate (IS 10500)',
    'Pollution Control Board Consent (Air & Water)',
    'Land Use & DTCP Building Plan Approval',
    'Lift / Elevator Fitness License (CEA)',
    'School Bus Fitness & State Transport Permit',
]

const ProPermits = () => {
    const [permits, setPermits] = useState([])
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [renewingPermit, setRenewingPermit] = useState(null)
    const [renewalRemarks, setRenewalRemarks] = useState('')
    const [renewalReceipt, setRenewalReceipt] = useState('')
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // New permit form
    const [form, setForm] = useState({
        permitType: 'Fire Safety Certificate & NOC',
        permitNumber: '',
        issuingAuthority: 'Fire & Rescue Services Department',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        renewalNoticeDays: 60,
        feePaymentReceipt: '',
        physicalFileRef: 'FILE-2026-006',
        status: 'Valid',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await proService.getPermits()
            if (res.success && Array.isArray(res.data)) {
                setPermits(res.data)
            }
        } catch (err) {
            console.error('Failed to load permits:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredPermits = useMemo(() => {
        return permits.filter((item) => {
            const matchesType = typeFilter === 'ALL' || item.permitType === typeFilter
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                item.permitNumber?.toLowerCase().includes(q) ||
                item.permitType?.toLowerCase().includes(q) ||
                item.issuingAuthority?.toLowerCase().includes(q)

            return matchesType && matchesStatus && matchesSearch
        })
    }, [permits, typeFilter, statusFilter, searchQuery])

    const handleCreatePermit = async (e) => {
        e.preventDefault()
        if (!form.permitType || !form.permitNumber || !form.issuingAuthority || !form.expiryDate) {
            alert('Please complete all required fields.')
            return
        }

        try {
            const res = await proService.createPermit(form)
            if (res.success) {
                setPermits((prev) => [res.data, ...prev])
                setShowRegisterModal(false)
                setFeedbackMessage(`Permit ${res.data.permitNumber} registered successfully.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    permitType: 'Fire Safety Certificate & NOC',
                    permitNumber: '',
                    issuingAuthority: 'Fire & Rescue Services Department',
                    issueDate: new Date().toISOString().split('T')[0],
                    expiryDate: '',
                    renewalNoticeDays: 60,
                    feePaymentReceipt: '',
                    physicalFileRef: 'FILE-2026-006',
                    status: 'Valid',
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to create permit'}`)
            }
        } catch (err) {
            console.error('Failed to register permit:', err)
            alert('Registration failed.')
        }
    }

    const handleInitiateRenewal = async (e) => {
        e.preventDefault()
        if (!renewingPermit) return

        try {
            const res = await proService.renewPermit(renewingPermit.id, {
                remarks: renewalRemarks,
                renewalFeeReceipt: renewalReceipt,
            })
            if (res.success) {
                setPermits((prev) =>
                    prev.map((p) =>
                        p.id === renewingPermit.id
                            ? { ...p, status: 'Renewal In-Progress', renewalFeeReceipt: renewalReceipt }
                            : p
                    )
                )
                setFeedbackMessage(`Renewal workflow initiated for ${renewingPermit.permitNumber}.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setRenewingPermit(null)
                setRenewalRemarks('')
                setRenewalReceipt('')
            }
        } catch (err) {
            console.error('Failed to renew permit:', err)
            alert('Renewal initiation failed.')
        }
    }

    const columns = [
        {
            key: 'permitType',
            label: 'Permit & License Type',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-semibold text-slate-900 text-xs'>{row.permitType}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>{row.issuingAuthority}</div>
                </div>
            ),
        },
        {
            key: 'permitNumber',
            label: 'Permit / Reg Number',
            required: true,
            render: (row) => <span className='font-mono font-bold text-xs text-slate-800'>{row.permitNumber}</span>,
        },
        {
            key: 'validity',
            label: 'Validity & Expiry',
            required: true,
            render: (row) => {
                const today = new Date()
                const exp = new Date(row.expiryDate)
                const isExpired = exp < today
                const isDueSoon = exp > today && (exp - today) / (1000 * 60 * 60 * 24) <= (row.renewalNoticeDays || 60)

                return (
                    <div>
                        <div className='flex items-center gap-1.5 font-mono text-xs'>
                            <Calendar className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : isDueSoon ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={isExpired ? 'text-rose-700 font-bold' : isDueSoon ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                                {row.expiryDate}
                            </span>
                        </div>
                        <span className='text-[10px] text-slate-400'>
                            Issue: {row.issueDate} ({row.renewalNoticeDays || 60}d notice)
                        </span>
                    </div>
                )
            },
        },
        {
            key: 'physicalFileRef',
            label: 'File Room Archive',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1 font-mono text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-fit'>
                    <Archive className='w-3 h-3 text-teal-600' />
                    {row.physicalFileRef || 'Pending'}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            required: true,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: 'Renewal Actions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-2'>
                    {row.status !== 'Renewal In-Progress' ? (
                        <button
                            type='button'
                            onClick={() => {
                                setRenewingPermit(row)
                                setRenewalReceipt(row.feePaymentReceipt || '')
                            }}
                            className='inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-xs'
                        >
                            <RotateCw className='w-3 h-3' />
                            Initiate Renewal
                        </button>
                    ) : (
                        <span className='text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200'>
                            In Renewal Pipeline
                        </span>
                    )}
                </div>
            ),
        },
    ]

    return (
        <section className='space-y-6 p-1'>
            {/* Header */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <ShieldCheck className='w-4 h-4' />
                            Statutory Licensing &amp; NOC Tracker
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Statutory Permits &amp; NOC Compliance
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Rigorous management of Fire NOC, Structural Stability, Sanitary Health certificates, Pollution consent, and transport fitness licenses.
                        </p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <button
                            type='button'
                            onClick={loadData}
                            className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowRegisterModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Register Permit / NOC
                        </button>
                    </div>
                </div>

                {feedbackMessage && (
                    <div className='mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 flex items-center gap-2'>
                        <CheckCircle2 className='w-4 h-4 text-teal-600' />
                        {feedbackMessage}
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex flex-wrap items-center gap-3'>
                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-slate-500'>Permit Type:</span>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            {PERMIT_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t === 'ALL' ? 'All Permit Categories' : t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-slate-500'>Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            <option value='ALL'>All Validity States</option>
                            <option value='Valid'>Valid</option>
                            <option value='Renewal Due'>Renewal Due</option>
                            <option value='Renewal In-Progress'>Renewal In-Progress</option>
                            <option value='Expired'>Expired</option>
                        </select>
                    </div>
                </div>

                <div className='relative w-full md:w-64'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search permit number or body...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Permits Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Statutory Permits &amp; NOC Registers ({filteredPermits.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredPermits}
                        emptyMessage='No permits found matching the filters.'
                    />
                </div>
            </div>

            {/* Initiate Renewal Modal */}
            {renewingPermit && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Initiate Permit Renewal Workflow</h3>
                                <p className='text-xs text-slate-500 font-mono mt-0.5'>{renewingPermit.permitNumber}</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setRenewingPermit(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleInitiateRenewal} className='mt-4 space-y-4'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs'>
                                <div className='font-bold text-slate-900'>{renewingPermit.permitType}</div>
                                <div className='text-slate-500 mt-1'>Issuing Body: {renewingPermit.issuingAuthority}</div>
                                <div className='text-rose-700 font-mono mt-0.5 font-bold'>Current Expiry: {renewingPermit.expiryDate}</div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>
                                    Finance Requisition / Challan Ref
                                </label>
                                <input
                                    type='text'
                                    value={renewalReceipt}
                                    onChange={(e) => setRenewalReceipt(e.target.value)}
                                    placeholder='e.g. CHAL-FIRE-2026-08'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Renewal Notes &amp; Action Plan</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={renewalRemarks}
                                    onChange={(e) => setRenewalRemarks(e.target.value)}
                                    placeholder='Specify application filing status, fee payment requisition, or scheduled inspection...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setRenewingPermit(null)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Confirm Renewal Initiation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Register New Permit Modal */}
            {showRegisterModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Register New Statutory Permit / NOC</h3>
                            <button
                                type='button'
                                onClick={() => setShowRegisterModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePermit} className='mt-4 space-y-4'>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Permit Type *</label>
                                <select
                                    value={form.permitType}
                                    onChange={(e) => setForm({ ...form, permitType: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                >
                                    {PERMIT_TYPES.filter((t) => t !== 'ALL').map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Permit / License No. *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.permitNumber}
                                        onChange={(e) => setForm({ ...form, permitNumber: e.target.value })}
                                        placeholder='e.g. NOC/FIRE/MDU/2026/891'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Issuing Authority *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.issuingAuthority}
                                        onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })}
                                        placeholder='e.g. Tamil Nadu Fire & Rescue'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Issue Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.issueDate}
                                        onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Expiry Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.expiryDate}
                                        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Renewal Notice Window (Days)</label>
                                    <input
                                        type='number'
                                        value={form.renewalNoticeDays}
                                        onChange={(e) => setForm({ ...form, renewalNoticeDays: Number(e.target.value) })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>File Room Physical Ref</label>
                                    <input
                                        type='text'
                                        value={form.physicalFileRef}
                                        onChange={(e) => setForm({ ...form, physicalFileRef: e.target.value })}
                                        placeholder='FILE-2026-006'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowRegisterModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Save Permit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default ProPermits
