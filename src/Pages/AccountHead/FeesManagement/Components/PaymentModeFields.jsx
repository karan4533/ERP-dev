import React from 'react'
import { PAYMENT_MODES } from '../../financeDomain/financeConstants'

const fieldClass = 'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const Field = ({ label, required, children }) => (
    <div className='flex flex-col gap-y-1.5'>
        <label className='text-sm font-medium text-[#808080]'>
            {label}{required && <span className='text-[#FF5722]'> *</span>}
        </label>
        {children}
    </div>
)

const PaymentModeFields = ({ mode, values, onChange, bankAccounts, posTerminals }) => {
    const update = (field, value) => onChange({ ...values, [field]: value })

    if (mode === PAYMENT_MODES.CASH) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field label='Received By' required>
                    <input value={values.receivedBy || ''} onChange={(event) => update('receivedBy', event.target.value)} className={fieldClass} />
                </Field>
                <Field label='Payment Date' required>
                    <input type='date' value={values.paymentDate || ''} onChange={(event) => update('paymentDate', event.target.value)} className={fieldClass} />
                </Field>
                <div className='md:col-span-2'>
                    <Field label='Narration'>
                        <textarea rows={2} value={values.narration || ''} onChange={(event) => update('narration', event.target.value)} className={fieldClass} />
                    </Field>
                </div>
            </div>
        )
    }

    if (mode === PAYMENT_MODES.BANK_TRANSFER) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field label='Bank Account' required>
                    <select value={values.bankAccountId || ''} onChange={(event) => update('bankAccountId', event.target.value)} className={fieldClass}>
                        <option value=''>Select account</option>
                        {bankAccounts.filter((item) => item.enabled).map((item) => (
                            <option key={item.id} value={item.id}>{item.name} · {item.accountNumber}</option>
                        ))}
                    </select>
                </Field>
                <Field label='Transaction Reference' required>
                    <input value={values.transactionReference || ''} onChange={(event) => update('transactionReference', event.target.value)} className={fieldClass} />
                </Field>
                <Field label='Transaction Date' required>
                    <input type='date' value={values.transactionDate || ''} onChange={(event) => update('transactionDate', event.target.value)} className={fieldClass} />
                </Field>
                <div className='md:col-span-2'>
                    <Field label='Narration'>
                        <textarea rows={2} value={values.narration || ''} onChange={(event) => update('narration', event.target.value)} className={fieldClass} />
                    </Field>
                </div>
            </div>
        )
    }

    if (mode === PAYMENT_MODES.CHEQUE) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field label='Cheque Number' required>
                    <input value={values.chequeNo || ''} onChange={(event) => update('chequeNo', event.target.value)} className={fieldClass} />
                </Field>
                <Field label='Bank' required>
                    <input value={values.bank || ''} onChange={(event) => update('bank', event.target.value)} className={fieldClass} />
                </Field>
                <Field label='Branch'>
                    <input value={values.branch || ''} onChange={(event) => update('branch', event.target.value)} className={fieldClass} />
                </Field>
                <Field label='Cheque Date' required>
                    <input type='date' value={values.chequeDate || ''} onChange={(event) => update('chequeDate', event.target.value)} className={fieldClass} />
                </Field>
                <Field label='Received Date' required>
                    <input type='date' value={values.receivedDate || ''} onChange={(event) => update('receivedDate', event.target.value)} className={fieldClass} />
                </Field>
                <div className='md:col-span-2'>
                    <Field label='Narration'>
                        <textarea rows={2} value={values.narration || ''} onChange={(event) => update('narration', event.target.value)} className={fieldClass} />
                    </Field>
                </div>
            </div>
        )
    }

    if (mode === PAYMENT_MODES.CARD_POS) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field label='POS Terminal' required>
                    <select value={values.terminalId || ''} onChange={(event) => update('terminalId', event.target.value)} className={fieldClass}>
                        <option value=''>Select terminal</option>
                        {posTerminals.filter((item) => item.enabled).map((item) => (
                            <option key={item.id} value={item.terminalId}>{item.name} · {item.terminalId}</option>
                        ))}
                    </select>
                </Field>
                <Field label='Transaction / RRN' required>
                    <input value={values.transactionReference || ''} onChange={(event) => update('transactionReference', event.target.value)} className={fieldClass} />
                </Field>
                <Field label='Card Type'>
                    <select value={values.cardType || 'Debit'} onChange={(event) => update('cardType', event.target.value)} className={fieldClass}>
                        <option>Debit</option>
                        <option>Credit</option>
                    </select>
                </Field>
                <Field label='Transaction Date' required>
                    <input type='date' value={values.transactionDate || ''} onChange={(event) => update('transactionDate', event.target.value)} className={fieldClass} />
                </Field>
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Field label='Transaction Reference' required>
                <input value={values.transactionReference || ''} onChange={(event) => update('transactionReference', event.target.value)} className={fieldClass} />
            </Field>
            <Field label='Payment Date' required>
                <input type='date' value={values.paymentDate || values.transactionDate || ''} onChange={(event) => update('paymentDate', event.target.value)} className={fieldClass} />
            </Field>
            <div className='md:col-span-2'>
                <Field label='Narration'>
                    <textarea rows={2} value={values.narration || ''} onChange={(event) => update('narration', event.target.value)} className={fieldClass} />
                </Field>
            </div>
        </div>
    )
}

export default PaymentModeFields
