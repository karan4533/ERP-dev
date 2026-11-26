import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Download, Mail, MessageCircle, Printer, RotateCcw } from 'lucide-react'
import { paymentModeLabel } from '../../financeDomain/financeConstants'
import { formatCurrency, formatDisplayDate } from '../../financeDomain/financeHelpers'
import IntegrationNotice from '../../../../Common/ui/IntegrationNotice'
import Drawer from '../../../../Common/ui/Drawer'

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
    onPrint,
}) => {
    const [reason, setReason] = useState('')
    if (!isOpen || !receipt) return null

    const reprint = () => {
        const result = onReprint({ receiptId: receipt.id, reason })
        if (result?.success) toast.success(`Reprinted ${result.receiptNo}. Original number preserved.`)
    }

    return (
        <Drawer open={isOpen} onClose={onClose} title={`Receipt ${receipt.receiptNo}`} description='Payment record and delivery actions'>
                <IntegrationNotice
                    state='disconnected'
                    title='Delivery unavailable'
                    description='Dedicated browser printing is available. PDF download, email and WhatsApp delivery require connected document and messaging services.'
                    className='mb-4'
                />
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
                    <button type='button' disabled title='PDF download requires the connected document service.' className='inline-flex items-center justify-center gap-2 rounded-md border border-[var(--erp-line-strong)] px-3 py-2 text-sm text-[var(--erp-muted)] opacity-60'>
                        <Download size={14} /> PDF unavailable
                    </button>
                    <button type='button' onClick={reprint} className='inline-flex items-center justify-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                        <RotateCcw size={14} /> Reprint
                    </button>
                    <button type='button' disabled title='Email delivery requires the connected messaging service.' className='inline-flex items-center justify-center gap-2 rounded-md border border-[var(--erp-line-strong)] px-3 py-2 text-sm text-[var(--erp-muted)] opacity-60'>
                        <Mail size={14} /> Email unavailable
                    </button>
                    <button type='button' disabled title='WhatsApp delivery requires the connected messaging service.' className='col-span-2 inline-flex items-center justify-center gap-2 rounded-md border border-[var(--erp-line-strong)] px-3 py-2 text-sm text-[var(--erp-muted)] opacity-60'>
                        <MessageCircle size={14} /> WhatsApp unavailable
                    </button>
                </div>
        </Drawer>
    )
}

export default ReceiptDetailsDrawer
