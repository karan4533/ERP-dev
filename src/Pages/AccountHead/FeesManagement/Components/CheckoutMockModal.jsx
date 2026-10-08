import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { CreditCard, Smartphone, X } from 'lucide-react'
import { PAYMENT_MODES } from '../../financeDomain/financeConstants'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const CheckoutMockModal = ({ isOpen, onClose, amount, student, onSuccess, onFail }) => {
    const [busy, setBusy] = useState(false)
    if (!isOpen) return null

    const pay = (mode) => {
        setBusy(true)
        window.setTimeout(() => {
            const ok = Math.random() > 0.08
            if (!ok) {
                toast.error('Mock gateway declined the payment. Try again.')
                onFail?.()
                setBusy(false)
                return
            }
            onSuccess({
                paymentMode: mode,
                details: {
                    transactionReference: `RZP-${Date.now().toString().slice(-8)}`,
                    paymentDate: new Date().toISOString().slice(0, 10),
                    narration: `Online ${mode === PAYMENT_MODES.UPI ? 'UPI' : 'Card'} checkout — ${student?.name ?? ''}`,
                },
            })
            toast.success('Payment successful.')
            setBusy(false)
            onClose()
        }, 900)
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />
            <div className='relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden'>
                <div className='bg-[#1B73E8] text-white px-6 py-8 text-center'>
                    <p className='text-xs tracking-wide opacity-80'>PAY SCHOOL TRUST</p>
                    <p className='text-3xl font-semibold mt-2'>{formatCurrency(amount)}.00</p>
                </div>
                <div className='p-5 space-y-3'>
                    <div className='flex items-center justify-between'>
                        <h3 className='font-semibold text-[#1E1E1E]'>Checkout</h3>
                        <button type='button' onClick={onClose} className='text-[#667085] cursor-pointer' aria-label='Close'>
                            <X size={18} />
                        </button>
                    </div>
                    <button
                        type='button'
                        disabled={busy}
                        onClick={() => pay(PAYMENT_MODES.CARD_ONLINE)}
                        className='w-full flex items-center gap-3 border border-[#EDEEF5] rounded-xl px-4 py-3 text-left cursor-pointer hover:border-[#515DEF] disabled:opacity-60'
                    >
                        <CreditCard className='text-[#515DEF]' size={20} />
                        <span>Card</span>
                    </button>
                    <button
                        type='button'
                        disabled={busy}
                        onClick={() => pay(PAYMENT_MODES.UPI)}
                        className='w-full flex items-center gap-3 border border-[#EDEEF5] rounded-xl px-4 py-3 text-left cursor-pointer hover:border-[#515DEF] disabled:opacity-60'
                    >
                        <Smartphone className='text-[#515DEF]' size={20} />
                        <span>UPI</span>
                    </button>
                    {busy && <p className='text-xs text-[#808080] text-center'>Contacting mock gateway...</p>}
                </div>
            </div>
        </div>
    )
}

export default CheckoutMockModal
