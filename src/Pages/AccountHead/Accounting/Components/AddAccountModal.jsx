import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import {
    COA_ACCOUNT_TYPES,
    COA_PARENT_ACCOUNTS,
    DEFAULT_ADD_ACCOUNT_FORM,
    formatRupeeAmount,
} from '../accountingData'
import Dialog from '../../../../Common/ui/Dialog'
import FormField from '../../../../Common/ui/FormField'

const inputClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'

export const AddAccountModal = ({ isOpen, onClose, onSubmit, parentAccounts = COA_PARENT_ACCOUNTS }) => {
    const [form, setForm] = useState(DEFAULT_ADD_ACCOUNT_FORM)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (isOpen) {
            setForm({ ...DEFAULT_ADD_ACCOUNT_FORM })
            setErrors({})
        }
    }, [isOpen])

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    const handleSubmit = () => {
        if (!form.accountCode.trim() || !form.accountName.trim()) {
            setErrors({
                ...(!form.accountCode.trim() && { accountCode: 'Enter a unique account code.' }),
                ...(!form.accountName.trim() && { accountName: 'Enter an account name.' }),
            })
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

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            title='Add account'
            description='Create a chart-of-accounts record. Required fields are marked.'
            size='lg'
            footer={(
                <>
                    <button type='button' onClick={onClose} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-ink)]'>Cancel</button>
                    <button type='button' onClick={handleSubmit} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                        <Check aria-hidden='true' size={16} /> Save account
                    </button>
                </>
            )}
        >
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <FormField id='coa-account-code' label='Account code' error={errors.accountCode} required>
                            <input
                                type='text'
                                value={form.accountCode}
                                onChange={(event) => updateField('accountCode', event.target.value)}
                                placeholder='e.g. 5130'
                                className={inputClass}
                            />
                        </FormField>
                        <FormField id='coa-account-name' label='Account name' error={errors.accountName} required>
                            <input
                                type='text'
                                value={form.accountName}
                                onChange={(event) => updateField('accountName', event.target.value)}
                                placeholder='e.g. Office Supplies'
                                className={inputClass}
                            />
                        </FormField>
                        <FormField id='coa-parent-account' label='Parent account'>
                            <select
                                value={form.parentAccount}
                                onChange={(event) => updateField('parentAccount', event.target.value)}
                                className={selectClass}
                            >
                                {parentAccounts.map((account) => (
                                    <option key={account} value={account}>{account}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField id='coa-account-type' label='Account type'>
                            <select
                                value={form.accountType}
                                onChange={(event) => updateField('accountType', event.target.value)}
                                className={selectClass}
                            >
                                {COA_ACCOUNT_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField id='coa-opening-balance' label='Opening balance (₹)' className='sm:col-span-2'>
                            <input
                                type='number'
                                min='0'
                                value={form.openingBalance}
                                onChange={(event) => updateField('openingBalance', event.target.value)}
                                placeholder='0'
                                className={inputClass}
                            />
                        </FormField>
            </div>
        </Dialog>
    )
}

export default AddAccountModal
