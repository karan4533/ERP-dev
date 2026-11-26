import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { CreditCard, Smartphone } from 'lucide-react'
import { PAYMENT_MODES } from '../../financeDomain/financeConstants'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import IntegrationNotice from '../../../../Common/ui/IntegrationNotice'
import Dialog from '../../../../Common/ui/Dialog'

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
        <Dialog open={isOpen} onClose={onClose} title='Checkout' description={`${formatCurrency(amount)}.00 · Pay School Trust`} size='sm'>
                <div className='space-y-3'>
                    <IntegrationNotice
                        state='demo'
                        title='Simulated checkout'
                        description='No payment gateway is contacted and no money is transferred.'
                    />
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
        </Dialog>
    )
}

export default CheckoutMockModal
