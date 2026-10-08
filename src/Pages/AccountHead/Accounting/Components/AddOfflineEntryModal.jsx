import React, { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import {
    DAY_BOOK_ENTRY_PAYMENT_METHODS,
    DAY_BOOK_ENTRY_TRANSACTION_TYPES,
    DAY_BOOK_LEDGER_ACCOUNTS,
    DEFAULT_OFFLINE_ENTRY_FORM,
    formatRupeeAmount,
    generateOfflineVoucherNo,
} from '../accountingData'
import EntryClosureGate from '../../../../Common/demoDomain/EntryClosureGate'
import { entryBlocked } from '../../../../Common/demoDomain/governance'

const inputClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const formatDisplayDate = (value) => {
    if (!value) return ''
    const date = new Date(value)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const AddOfflineEntryModal = ({ isOpen, onClose, onSubmit }) => {
    const [form, setForm] = useState(DEFAULT_OFFLINE_ENTRY_FORM)

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().slice(0, 10)
            setForm({
                ...DEFAULT_OFFLINE_ENTRY_FORM,
                date: today,
                voucherNo: generateOfflineVoucherNo(),
            })
        }
    }, [isOpen])

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = () => {
        const amount = Number(form.amount)
        if (entryBlocked('Finance', 'Account Head')) return
        if (!form.date || !form.ledgerAccount || !amount || !form.description.trim()) {
            return
        }

        const isIncome = form.transactionType === 'Income'
        onSubmit({
            date: formatDisplayDate(form.date),
            voucherNo: form.voucherNo || generateOfflineVoucherNo(),
            transactionType: form.transactionType,
            ledgerHead: form.ledgerAccount,
            description: form.description.trim(),
            paymentMethod: form.paymentMethod,
            debit: isIncome ? formatRupeeAmount(amount) : '—',
            credit: isIncome ? '—' : formatRupeeAmount(amount),
            enteredBy: 'Finance Manager',
            status: 'Draft',
            department: 'General',
            remarks: form.remarks.trim(),
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>Add Offline Entry</h2>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close modal'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5'>
                    <EntryClosureGate moduleName='Finance' actor='Account Head' />
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='offline-entry-date' className='text-sm font-medium text-[#808080]'>Date</label>
                            <input
                                id='offline-entry-date'
                                type='date'
                                value={form.date}
                                onChange={(event) => updateField('date', event.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='offline-entry-voucher' className='text-sm font-medium text-[#808080]'>Voucher Number</label>
                            <input
                                id='offline-entry-voucher'
                                type='text'
                                value={form.voucherNo}
                                onChange={(event) => updateField('voucherNo', event.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='offline-entry-ledger' className='text-sm font-medium text-[#808080]'>Ledger Account</label>
                            <select
                                id='offline-entry-ledger'
                                value={form.ledgerAccount}
                                onChange={(event) => updateField('ledgerAccount', event.target.value)}
                                className={selectClass}
                            >
                                <option value=''>Select ledger account...</option>
                                {DAY_BOOK_LEDGER_ACCOUNTS.map((account) => (
                                    <option key={account} value={account}>{account}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='offline-entry-type' className='text-sm font-medium text-[#808080]'>Transaction Type</label>
                            <select
                                id='offline-entry-type'
                                value={form.transactionType}
                                onChange={(event) => updateField('transactionType', event.target.value)}
                                className={selectClass}
                            >
                                {DAY_BOOK_ENTRY_TRANSACTION_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='offline-entry-method' className='text-sm font-medium text-[#808080]'>Payment Method</label>
                            <select
                                id='offline-entry-method'
                                value={form.paymentMethod}
                                onChange={(event) => updateField('paymentMethod', event.target.value)}
                                className={selectClass}
                            >
                                {DAY_BOOK_ENTRY_PAYMENT_METHODS.map((method) => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='offline-entry-amount' className='text-sm font-medium text-[#808080]'>Amount (₹)</label>
                            <input
                                id='offline-entry-amount'
                                type='number'
                                min='0'
                                value={form.amount}
                                onChange={(event) => updateField('amount', event.target.value)}
                                placeholder='0'
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='offline-entry-description' className='text-sm font-medium text-[#808080]'>Description</label>
                            <textarea
                                id='offline-entry-description'
                                rows={2}
                                value={form.description}
                                onChange={(event) => updateField('description', event.target.value)}
                                placeholder='Describe the offline transaction...'
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='offline-entry-remarks' className='text-sm font-medium text-[#808080]'>Remarks</label>
                            <textarea
                                id='offline-entry-remarks'
                                rows={2}
                                value={form.remarks}
                                onChange={(event) => updateField('remarks', event.target.value)}
                                placeholder='Optional internal notes...'
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                    </div>
                </div>

                <div className='flex justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSubmit}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Check size={16} />
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddOfflineEntryModal
