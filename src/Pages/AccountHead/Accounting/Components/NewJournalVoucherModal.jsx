import React, { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import {
    DEFAULT_JOURNAL_VOUCHER_FORM,
    JOURNAL_LEDGER_ACCOUNTS,
    formatRupeeAmount,
    generateJournalVoucherNo,
} from '../accountingData'

const inputClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const formatDisplayDate = (value) => {
    if (!value) return ''
    const date = new Date(value)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const NewJournalVoucherModal = ({ isOpen, onClose, onSubmit }) => {
    const [form, setForm] = useState(DEFAULT_JOURNAL_VOUCHER_FORM)

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().slice(0, 10)
            setForm({
                ...DEFAULT_JOURNAL_VOUCHER_FORM,
                date: today,
                voucherNo: generateJournalVoucherNo(),
            })
        }
    }, [isOpen])

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSaveDraft = () => {
        const amount = Number(form.amount)
        if (!form.date || !form.narration.trim() || !form.debitAccount || !form.creditAccount || !amount) {
            return
        }

        const formattedAmount = formatRupeeAmount(amount)
        onSubmit({
            date: formatDisplayDate(form.date),
            dateIso: form.date,
            voucherNo: form.voucherNo || generateJournalVoucherNo(),
            description: form.narration.trim(),
            debit: `${form.debitAccount} · ${formattedAmount}`,
            credit: `${form.creditAccount} · ${formattedAmount}`,
            debitAccount: form.debitAccount,
            creditAccount: form.creditAccount,
            amount: formattedAmount,
            status: 'Draft',
            createdBy: 'Finance Manager',
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
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>New Journal Voucher</h2>
                    <button type='button' onClick={onClose} className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer' aria-label='Close modal'>
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='jv-date' className='text-sm font-medium text-[#808080]'>Date</label>
                            <input
                                id='jv-date'
                                type='date'
                                value={form.date}
                                onChange={(event) => updateField('date', event.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='jv-voucher-no' className='text-sm font-medium text-[#808080]'>Voucher Number</label>
                            <input
                                id='jv-voucher-no'
                                type='text'
                                value={form.voucherNo}
                                onChange={(event) => updateField('voucherNo', event.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='jv-narration' className='text-sm font-medium text-[#808080]'>Narration</label>
                            <textarea
                                id='jv-narration'
                                rows={2}
                                value={form.narration}
                                onChange={(event) => updateField('narration', event.target.value)}
                                placeholder='Describe the adjustment...'
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='jv-debit-account' className='text-sm font-medium text-[#808080]'>Debit Account</label>
                            <select
                                id='jv-debit-account'
                                value={form.debitAccount}
                                onChange={(event) => updateField('debitAccount', event.target.value)}
                                className={selectClass}
                            >
                                <option value=''>Select debit account...</option>
                                {JOURNAL_LEDGER_ACCOUNTS.map((account) => (
                                    <option key={account} value={account}>{account}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='jv-credit-account' className='text-sm font-medium text-[#808080]'>Credit Account</label>
                            <select
                                id='jv-credit-account'
                                value={form.creditAccount}
                                onChange={(event) => updateField('creditAccount', event.target.value)}
                                className={selectClass}
                            >
                                <option value=''>Select credit account...</option>
                                {JOURNAL_LEDGER_ACCOUNTS.map((account) => (
                                    <option key={account} value={account}>{account}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='jv-amount' className='text-sm font-medium text-[#808080]'>Amount (₹)</label>
                            <input
                                id='jv-amount'
                                type='number'
                                min='0'
                                value={form.amount}
                                onChange={(event) => updateField('amount', event.target.value)}
                                placeholder='0'
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='jv-remarks' className='text-sm font-medium text-[#808080]'>Remarks</label>
                            <textarea
                                id='jv-remarks'
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
                    <button type='button' onClick={onClose} className='text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                        Cancel
                    </button>
                    <button type='button' onClick={handleSaveDraft} className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'>
                        <Check size={16} />
                        Save as Draft
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NewJournalVoucherModal
