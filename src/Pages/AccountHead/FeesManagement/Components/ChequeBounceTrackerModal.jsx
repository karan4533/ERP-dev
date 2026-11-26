import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, Plus, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const INITIAL_BOUNCED = [
    {
        id: 'BNC-2026-0041',
        studentName: 'Aarav Patel',
        admissionNo: 'QMIS-2024-0412',
        className: 'Class 9-A',
        chequeNo: '482109',
        bankName: 'HDFC Bank, Anna Nagar',
        amount: 32000,
        bounceDate: '2026-10-18',
        reason: 'Insufficient Funds',
        penalty: 500,
        totalRecoverable: 32500,
        status: 'Penalty Levied',
    },
    {
        id: 'BNC-2026-0039',
        studentName: 'Sanjay Krishnan',
        admissionNo: 'QMIS-2023-0188',
        className: 'Class 6-B',
        chequeNo: '119042',
        bankName: 'State Bank of India',
        amount: 24500,
        bounceDate: '2026-10-12',
        reason: 'Signature Mismatch',
        penalty: 500,
        totalRecoverable: 25000,
        status: 'Represented & Cleared',
    },
    {
        id: 'BNC-2026-0035',
        studentName: 'Meera Nambiar',
        admissionNo: 'QMIS-2025-0810',
        className: 'Class 4-A',
        chequeNo: '772183',
        bankName: 'Axis Bank, Madurai',
        amount: 28000,
        bounceDate: '2026-10-05',
        reason: 'Refer to Drawer',
        penalty: 500,
        totalRecoverable: 28500,
        status: 'Paid in Cash',
    },
]

const ChequeBounceTrackerModal = ({ isOpen, onClose }) => {
    const [bouncedList, setBouncedList] = useState(INITIAL_BOUNCED)
    const [isAdding, setIsAdding] = useState(false)
    const [form, setForm] = useState({
        studentName: '',
        admissionNo: '',
        className: 'Class 10-A',
        chequeNo: '',
        bankName: '',
        amount: '',
        bounceDate: new Date().toISOString().slice(0, 10),
        reason: 'Insufficient Funds',
        penalty: 500,
    })

    const handleSave = (e) => {
        e.preventDefault()
        if (!form.studentName.trim() || !form.chequeNo.trim() || !(Number(form.amount) > 0)) {
            toast.error('Student Name, Cheque Number, and positive amount are required.')
            return
        }

        const amount = Number(form.amount)
        const penalty = Number(form.penalty) || 500
        const newRecord = {
            id: `BNC-2026-${String(bouncedList.length + 1).padStart(4, '0')}`,
            ...form,
            amount,
            penalty,
            totalRecoverable: amount + penalty,
            status: 'Penalty Levied',
        }

        setBouncedList([newRecord, ...bouncedList])
        setIsAdding(false)
        setForm({
            studentName: '',
            admissionNo: '',
            className: 'Class 10-A',
            chequeNo: '',
            bankName: '',
            amount: '',
            bounceDate: new Date().toISOString().slice(0, 10),
            reason: 'Insufficient Funds',
            penalty: 500,
        })
        toast.success(`Cheque bounce registered. ₹${penalty} bank return penalty levied on student ledger.`)
    }

    if (!isOpen) return null

    return (
        <div
            className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'
            role='dialog'
            aria-modal='true'
            aria-labelledby='bounce-tracker-title'
        >
            <div className='w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col'>
                <div className='flex items-center justify-between border-b border-[var(--erp-line)] pb-4'>
                    <div className='flex items-center gap-2.5'>
                        <span className='rounded-lg bg-red-100 p-2 text-red-600'>
                            <AlertCircle size={22} />
                        </span>
                        <div>
                            <h2 id='bounce-tracker-title' className='text-xl font-bold text-[var(--erp-ink)]'>
                                Parent Cheque Bounce &amp; Return Penalty Ledger
                            </h2>
                            <p className='text-xs text-[var(--erp-muted)]'>
                                Log dishonored fee cheques, automatically levy standard bank penalty (₹500), and track settlement status.
                            </p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-lg p-1.5 text-[var(--erp-muted)] hover:bg-[var(--erp-canvas)]'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='overflow-y-auto space-y-4 py-4'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-bold uppercase tracking-wider text-[var(--erp-slate)]'>
                            Active Dishonored Cheques ({bouncedList.length})
                        </span>
                        {!isAdding && (
                            <button
                                type='button'
                                onClick={() => setIsAdding(true)}
                                className='inline-flex items-center gap-1 rounded-lg bg-[var(--erp-indigo)] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-[var(--erp-indigo-dark)]'
                            >
                                <Plus size={15} /> Log Bounced Cheque
                            </button>
                        )}
                    </div>

                    {isAdding && (
                        <form onSubmit={handleSave} className='rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-3'>
                            <h3 className='text-xs font-bold text-red-900 uppercase'>Enter Dishonored Cheque Particulars</h3>
                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Student Name *</label>
                                    <input
                                        required
                                        className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] bg-white px-2.5 py-1.5'
                                        value={form.studentName}
                                        onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                                        placeholder='Student Full Name'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Admission Number</label>
                                    <input
                                        className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] bg-white px-2.5 py-1.5'
                                        value={form.admissionNo}
                                        onChange={(e) => setForm({ ...form, admissionNo: e.target.value })}
                                        placeholder='e.g. QMIS-2024-0991'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Cheque Number *</label>
                                    <input
                                        required
                                        className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] bg-white px-2.5 py-1.5'
                                        value={form.chequeNo}
                                        onChange={(e) => setForm({ ...form, chequeNo: e.target.value })}
                                        placeholder='e.g. 582103'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Drawn Bank Name</label>
                                    <input
                                        className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] bg-white px-2.5 py-1.5'
                                        value={form.bankName}
                                        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                                        placeholder='e.g. Canara Bank, West Veli St'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Cheque Face Amount (₹) *</label>
                                    <input
                                        type='number'
                                        required
                                        min='1'
                                        className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] bg-white px-2.5 py-1.5'
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        placeholder='e.g. 35000'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Bank Return Reason *</label>
                                    <select
                                        className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] bg-white px-2.5 py-1.5'
                                        value={form.reason}
                                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    >
                                        <option>Insufficient Funds</option>
                                        <option>Signature Mismatch</option>
                                        <option>Refer to Drawer</option>
                                        <option>Account Blocked / Frozen</option>
                                        <option>Payment Stopped by Drawer</option>
                                    </select>
                                </div>
                            </div>
                            <div className='flex items-center justify-between pt-2 border-t border-red-200'>
                                <span className='text-xs font-medium text-red-700'>
                                    Standard Bank Bounce Penalty applied: <strong>₹500</strong>
                                </span>
                                <div className='flex gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => setIsAdding(false)}
                                        className='text-xs px-3 py-1.5 rounded-lg border border-slate-300'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        className='text-xs px-4 py-1.5 rounded-lg bg-red-600 text-white font-semibold'
                                    >
                                        Levy Penalty &amp; Save
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    <div className='rounded-xl border border-[var(--erp-line)] overflow-hidden shadow-xs'>
                        <table className='w-full text-xs text-left'>
                            <thead className='bg-[var(--erp-canvas)] text-[var(--erp-slate)] uppercase tracking-wider font-semibold border-b border-[var(--erp-line)]'>
                                <tr>
                                    <th className='px-3 py-3'>Ref ID</th>
                                    <th className='px-3 py-3'>Student / Admission</th>
                                    <th className='px-3 py-3'>Cheque Details</th>
                                    <th className='px-3 py-3'>Bounce Reason</th>
                                    <th className='px-3 py-3'>Face Amount</th>
                                    <th className='px-3 py-3 text-red-600'>Penalty</th>
                                    <th className='px-3 py-3'>Total Due</th>
                                    <th className='px-3 py-3'>Status</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-[var(--erp-line)]'>
                                {bouncedList.map((item) => (
                                    <tr key={item.id} className='hover:bg-slate-50/50'>
                                        <td className='px-3 py-2.5 font-bold text-[var(--erp-ink)]'>{item.id}</td>
                                        <td className='px-3 py-2.5'>
                                            <span className='font-semibold block text-[var(--erp-ink)]'>{item.studentName}</span>
                                            <span className='text-[11px] text-[var(--erp-muted)]'>{item.admissionNo || item.className}</span>
                                        </td>
                                        <td className='px-3 py-2.5'>
                                            <span className='font-mono font-medium block'>#{item.chequeNo}</span>
                                            <span className='text-[11px] text-[var(--erp-muted)]'>{item.bankName}</span>
                                        </td>
                                        <td className='px-3 py-2.5'>
                                            <span className='inline-flex items-center gap-1 text-red-700 font-semibold bg-red-50 border border-red-200 rounded px-2 py-0.5 text-[10px]'>
                                                <AlertTriangle size={11} /> {item.reason}
                                            </span>
                                        </td>
                                        <td className='px-3 py-2.5 font-medium'>{formatCurrency(item.amount)}</td>
                                        <td className='px-3 py-2.5 font-bold text-red-600'>+{formatCurrency(item.penalty)}</td>
                                        <td className='px-3 py-2.5 font-bold text-[var(--erp-ink)]'>{formatCurrency(item.totalRecoverable)}</td>
                                        <td className='px-3 py-2.5'>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                item.status.includes('Cleared') || item.status.includes('Paid')
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className='flex items-center justify-end border-t border-[var(--erp-line)] pt-4 mt-auto'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-lg bg-[var(--erp-slate)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--erp-ink)]'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChequeBounceTrackerModal

