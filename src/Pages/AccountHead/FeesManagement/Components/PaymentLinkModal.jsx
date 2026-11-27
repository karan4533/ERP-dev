import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Copy, Link2, Mail, MessageCircle, X } from 'lucide-react'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const deliveryToast = (channel, result) => {
    const label = channel === 'whatsapp' ? 'WhatsApp' : 'Email'
    const status = result?.delivery?.status
    if (result?.success === false) {
        toast.error(result.message || `${label} send failed.`)
        return
    }
    if (status === 'MOCK_QUEUED') {
        toast.info(`${label} MOCK_QUEUED to local outbox — not a real delivery.`)
        return
    }
    if (status === 'NOT_CONFIGURED' || status === 'queued_stub') {
        toast.info(result?.delivery?.message || `${label} is NOT_CONFIGURED until provider credentials are connected.`)
        return
    }
    if ((status === 'sent' || status === 'SENT') && result?.delivery?.delivered) {
        toast.success(`${label} accepted by provider.`)
        return
    }
    if (status === 'FAILED' || status === 'failed') {
        toast.error(result?.delivery?.message || `${label} provider rejected the message.`)
        return
    }
    toast.info(result?.delivery?.message || `${label} status: ${status || 'unknown'}`)
}

const PaymentLinkModal = ({ isOpen, onClose, link, onSend }) => {
    const [sending, setSending] = useState(false)
    if (!isOpen || !link) return null

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(link.url)
            toast.success('Payment link copied.')
        } catch {
            toast.info(link.url)
        }
    }

    const send = async (channel) => {
        if (!onSend) {
            toast.info(`${channel === 'whatsapp' ? 'WhatsApp' : 'Email'} send is not wired yet.`)
            return
        }
        setSending(true)
        try {
            const result = await onSend({
                linkId: link.id,
                reference: link.reference,
                channel,
            })
            deliveryToast(channel, result)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />
            <div className='relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold'>Payment link</h2>
                    <button type='button' onClick={onClose} className='text-[#667085] hover:text-[#FF5722] cursor-pointer' aria-label='Close'>
                        <X size={20} />
                    </button>
                </div>
                <div className='px-6 py-5 space-y-4'>
                    <p className='text-sm text-[#667085]'>
                        Secure reference <span className='font-mono text-[#515DEF]'>{link.reference}</span> for {formatCurrency(link.amount)}.
                        Student IDs are not exposed in the link.
                    </p>
                    <div className='rounded-xl bg-[#F9F9F9] p-3 text-sm break-all'>{link.url}</div>
                    <div className='flex flex-wrap gap-2'>
                        <button type='button' onClick={copyLink} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                            <Copy size={14} /> Copy Link
                        </button>
                        <button type='button' disabled={sending} onClick={() => send('whatsapp')} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer disabled:opacity-60'>
                            <MessageCircle size={14} /> WhatsApp
                        </button>
                        <button type='button' disabled={sending} onClick={() => send('email')} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer disabled:opacity-60'>
                            <Mail size={14} /> Email
                        </button>
                    </div>
                    <p className='text-xs text-[#808080] inline-flex items-center gap-1'>
                        <Link2 size={12} /> Student/parent opens fees payment and pays via Razorpay Checkout.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default PaymentLinkModal
