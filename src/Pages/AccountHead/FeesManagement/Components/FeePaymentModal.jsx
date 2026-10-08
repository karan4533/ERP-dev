import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { IndianRupee, X } from 'lucide-react'
import { PAYMENT_MODE_OPTIONS, PAYMENT_MODES } from '../../financeDomain/financeConstants'
import { formatCurrency, toIsoDate } from '../../financeDomain/financeHelpers'
import PaymentModeFields from './PaymentModeFields'

const buildDetails = (student) => {
    const today = toIsoDate(new Date())
    return {
        receivedBy: 'Finance Head',
        paymentDate: today,
        transactionDate: today,
        receivedDate: today,
        narration: student ? `Fee collection — ${student.name}` : '',
    }
}

const FeePaymentModal = ({
    onClose,
    student,
    allocations,
    totalAmount,
    lateFee,
    onConfirm,
    bankAccounts,
    posTerminals,
}) => {
    const [mode, setMode] = useState(PAYMENT_MODES.CASH)
    const [details, setDetails] = useState(() => buildDetails(student))
    const [submitting, setSubmitting] = useState(false)
    const payableLabel = formatCurrency(totalAmount)

    const handleSubmit = async () => {
        if (submitting) return
        setSubmitting(true)
        const result = onConfirm({
            paymentMode: mode,
            details: {
                ...details,
                transactionDate: details.transactionDate || details.paymentDate,
            },
            paymentDate: details.paymentDate || details.transactionDate,
            narration: details.narration,
        })
        if (!result?.success) {
            toast.error(result?.errors?.[0] || result?.message || 'Unable to collect payment.')
            setSubmitting(false)
            return
        }
        if (result.held) {
            toast.info(`Cheque recorded as ${result.transaction?.chequeDetails?.status}. Fee will update after clearance.`)
        } else {
            toast.success(`Collected ${payableLabel}. Receipt ${result.receipt?.receiptNo}`)
        }
        onClose()
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />
            <div className='relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <div>
                        <h2 className='text-lg font-semibold text-[#1E1E1E]'>Collect Fee</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>{student?.name} · {payableLabel}</p>
                    </div>
                    <button type='button' onClick={onClose} className='text-[#667085] hover:text-[#FF5722] cursor-pointer' aria-label='Close'>
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-5'>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                        <div className='rounded-xl bg-[#F9F9F9] p-3'>
                            <p className='text-xs text-[#808080]'>Selected net</p>
                            <p className='font-semibold text-[#1E1E1E]'>{formatCurrency(totalAmount - lateFee)}</p>
                        </div>
                        <div className='rounded-xl bg-[#F9F9F9] p-3'>
                            <p className='text-xs text-[#808080]'>Late fee</p>
                            <p className='font-semibold text-[#FF5722]'>{formatCurrency(lateFee)}</p>
                        </div>
                        <div className='rounded-xl bg-[#515DEF0D] p-3 col-span-2'>
                            <p className='text-xs text-[#808080]'>Total collecting</p>
                            <p className='text-lg font-semibold text-[#515DEF]'>{payableLabel}</p>
                        </div>
                    </div>

                    <div>
                        <p className='text-sm font-medium text-[#808080] mb-2'>Payment mode</p>
                        <div className='flex flex-wrap gap-2'>
                            {PAYMENT_MODE_OPTIONS.map((item) => (
                                <button
                                    key={item.id}
                                    type='button'
                                    onClick={() => setMode(item.id)}
                                    className={`px-3 py-1.5 rounded-md text-sm border cursor-pointer ${
                                        mode === item.id
                                            ? 'bg-[#515DEF] text-white border-[#515DEF]'
                                            : 'bg-white text-[#667085] border-[#D9D9D9]'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <PaymentModeFields
                        mode={mode}
                        values={details}
                        onChange={setDetails}
                        bankAccounts={bankAccounts}
                        posTerminals={posTerminals}
                    />

                    <div className='text-sm text-[#667085]'>
                        {allocations.length} instalment{allocations.length === 1 ? '' : 's'} selected
                    </div>
                </div>

                <div className='flex justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7]'>
                    <button type='button' onClick={onClose} className='text-sm px-4 py-2 rounded-md border border-[#D9D9D9] cursor-pointer'>
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={submitting}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer disabled:opacity-60'
                    >
                        <IndianRupee size={16} />
                        {submitting ? 'Processing...' : 'Confirm Collection'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default FeePaymentModal
