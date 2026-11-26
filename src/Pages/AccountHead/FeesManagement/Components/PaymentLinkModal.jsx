import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Copy, Link2, Mail, MessageCircle } from 'lucide-react'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import IntegrationNotice from '../../../../Common/ui/IntegrationNotice'
import Dialog from '../../../../Common/ui/Dialog'

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

    const send = (channel) => {
        setSending(true)
        onSend?.(channel, link)
        toast.success(`Mock ${channel === 'whatsapp' ? 'WhatsApp' : 'email'} sent with ${link.reference}.`)
        setSending(false)
    }

    return (
        <Dialog open={isOpen} onClose={onClose} title='Payment link' description={`Secure reference ${link.reference}`} size='md'>
                <div className='space-y-4'>
                    <IntegrationNotice
                        state='demo'
                        title='Delivery channels are simulated'
                        description='Copy works locally, but Email and WhatsApp do not contact a delivery provider.'
                    />
                    <p className='text-sm text-[#667085]'>
                        Secure reference <span className='font-mono text-[#515DEF]'>{link.reference}</span> for {formatCurrency(link.amount)}.
                        Student IDs are not exposed in the link.
                    </p>
                    <div className='rounded-xl bg-[#F9F9F9] p-3 text-sm break-all'>{link.url}</div>
                    <div className='flex flex-wrap gap-2'>
                        <button type='button' onClick={copyLink} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                            <Copy size={14} /> Copy Link
                        </button>
                        <button type='button' disabled={sending} onClick={() => send('whatsapp')} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                            <MessageCircle size={14} /> WhatsApp
                        </button>
                        <button type='button' disabled={sending} onClick={() => send('email')} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                            <Mail size={14} /> Email
                        </button>
                    </div>
                    <p className='text-xs text-[#808080] inline-flex items-center gap-1'>
                        <Link2 size={12} /> Gateway checkout is mocked until a payment API is connected.
                    </p>
                </div>
        </Dialog>
    )
}

export default PaymentLinkModal
