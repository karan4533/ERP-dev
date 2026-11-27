import React, { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import {
    COA_ACCOUNT_TYPES,
    COA_PARENT_ACCOUNTS,
    DEFAULT_ADD_ACCOUNT_FORM,
    formatRupeeAmount,
} from '../accountingData'

const inputClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'

export const AddAccountModal = ({ isOpen, onClose, onSubmit, parentAccounts = COA_PARENT_ACCOUNTS }) => {
    const [form, setForm] = useState(DEFAULT_ADD_ACCOUNT_FORM)

    useEffect(() => {
        if (isOpen) {
            setForm({ ...DEFAULT_ADD_ACCOUNT_FORM })
        }
    }, [isOpen])

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = () => {
        if (!form.accountCode.trim() || !form.accountName.trim()) {
            return
        }

        const openingBalance = Number(form.openingBalance) || 0
        onSubmit({
            accountCode: form.accountCode.trim(),
            accountName: form.accountName.trim(),
            parentAccount: form.parentAccount === 'None (Top-level)' ? '—' : form.parentAccount,
            accountType: form.accountType,
            status: 'Active',
            balance: formatRupeeAmount(openingBalance),
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>Add Account</h2>
                    <button type='button' onClick={onClose} className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer' aria-label='Close modal'>
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='coa-account-code' className='text-sm font-medium text-[#808080]'>Account Code</label>
                            <input
                                id='coa-account-code'
                                type='text'
                                value={form.accountCode}
                                onChange={(event) => updateField('accountCode', event.target.value)}
                                placeholder='e.g. 5130'
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='coa-account-name' className='text-sm font-medium text-[#808080]'>Account Name</label>
                            <input
                                id='coa-account-name'
                                type='text'
                                value={form.accountName}
                                onChange={(event) => updateField('accountName', event.target.value)}
                                placeholder='e.g. Office Supplies'
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='coa-parent-account' className='text-sm font-medium text-[#808080]'>Parent Account</label>
                            <select
                                id='coa-parent-account'
                                value={form.parentAccount}
                                onChange={(event) => updateField('parentAccount', event.target.value)}
                                className={selectClass}
                            >
                                {parentAccounts.map((account) => (
                                    <option key={account} value={account}>{account}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='coa-account-type' className='text-sm font-medium text-[#808080]'>Account Type</label>
                            <select
                                id='coa-account-type'
                                value={form.accountType}
                                onChange={(event) => updateField('accountType', event.target.value)}
                                className={selectClass}
                            >
                                {COA_ACCOUNT_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='coa-opening-balance' className='text-sm font-medium text-[#808080]'>Opening Balance (₹)</label>
                            <input
                                id='coa-opening-balance'
                                type='number'
                                min='0'
                                value={form.openingBalance}
                                onChange={(event) => updateField('openingBalance', event.target.value)}
                                placeholder='0'
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                <div className='flex justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7]'>
                    <button type='button' onClick={onClose} className='text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                        Cancel
                    </button>
                    <button type='button' onClick={handleSubmit} className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'>
                        <Check size={16} />
                        Save Account
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddAccountModal
