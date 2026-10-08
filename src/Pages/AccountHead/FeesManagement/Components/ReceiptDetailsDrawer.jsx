import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { logWhatsAppDelivery } from '../../../../Common/demoDomain/financeExtras'
import { Download, Mail, MessageCircle, Printer, RotateCcw, X } from 'lucide-react'
import { paymentModeLabel } from '../../financeDomain/financeConstants'
import { formatCurrency, formatDisplayDate } from '../../financeDomain/financeHelpers'

const Field = ({ label, value }) => (
    <div className='flex items-center justify-between py-2 border-b border-[#F2F4F7] text-sm'>
        <span className='text-[#667085]'>{label}</span>
        <span className='font-medium text-[#1E1E1E] text-right'>{value || '—'}</span>
    </div>
)

const ReceiptDetailsDrawer = ({
    isOpen,
    onClose,
    receipt,
    student,
    onReprint,
    onSend,
    onPrint,
}) => {
    const [reason, setReason] = useState('')
    if (!isOpen || !receipt) return null

    const reprint = () => {
        const result = onReprint({ receiptId: receipt.id, reason })
        if (result?.success) toast.success(`Reprinted ${result.receiptNo}. Original number preserved.`)
    }

    return (
        <div className='fixed inset-0 z-50 flex justify-end'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />
            <div className='relative z-10 w-full max-w-md h-full bg-white shadow-xl p-5 overflow-y-auto'>
                <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold'>Receipt {receipt.receiptNo}</h3>
                    <button type='button' onClick={onClose} className='text-[#667085] hover:text-[#FF5722] cursor-pointer' aria-label='Close'>
                        <X size={20} />
                    </button>
                </div>
                <Field label='Student' value={student?.name} />
                <Field label='Admission No.' value={student?.admissionNo || receipt.admissionNo} />
                <Field label='Academic Year' value={receipt.academicYear} />
                <Field label='Class' value={receipt.className} />
                <Field label='Payment Date' value={formatDisplayDate(receipt.paymentDate)} />
                <Field label='Fee Heads' value={(receipt.feeHeads || []).join(', ')} />
                <Field label='Gross Fee' value={formatCurrency(receipt.grossFee)} />
                <Field label='Concession' value={formatCurrency(receipt.concession)} />
                <Field label='Fine' value={formatCurrency(receipt.fine)} />
                <Field label='Amount Paid' value={formatCurrency(receipt.amountPaid)} />
                <Field label='Payment Mode' value={paymentModeLabel(receipt.paymentMode)} />
                <Field label='Transaction Reference' value={receipt.transactionReference} />
                <Field label='Balance' value={formatCurrency(receipt.balance)} />
                <Field label='Collected By' value={receipt.collectedBy} />
                <Field label='Reprints' value={String(receipt.reprintCount || 0)} />

                <textarea
                    rows={2}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder='Reprint reason (optional)'
                    className='mt-4 w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2'
                />

                <div className='grid grid-cols-2 gap-2 mt-4'>
                    <button type='button' onClick={() => onPrint?.(receipt)} className='inline-flex items-center justify-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                        <Printer size={14} /> Print
                    </button>
                    <button type='button' onClick={() => toast.info('PDF download is mocked until a report service is connected.')} className='inline-flex items-center justify-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                        <Download size={14} /> Download
                    </button>
                    <button type='button' onClick={reprint} className='inline-flex items-center justify-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                        <RotateCcw size={14} /> Reprint
                    </button>
                    <button type='button' onClick={() => { onSend({ receiptId: receipt.id, channel: 'email' }); toast.success('Mock email sent.') }} className='inline-flex items-center justify-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                        <Mail size={14} /> Email
                    </button>
                    <button type='button' onClick={() => { onSend({ receiptId: receipt.id, channel: 'whatsapp' }); logWhatsAppDelivery(receipt.id); toast.success('Demo WhatsApp delivery recorded.') }} className='col-span-2 inline-flex items-center justify-center gap-2 text-sm bg-[#515DEF] text-white px-3 py-2 rounded-md cursor-pointer'>
                        <MessageCircle size={14} /> Send to WhatsApp
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReceiptDetailsDrawer
