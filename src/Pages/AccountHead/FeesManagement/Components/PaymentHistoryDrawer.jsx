import React, { useState } from 'react'
import { Eye, MessageCircle, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { paymentModeLabel } from '../../financeDomain/financeConstants'
import { formatCurrency, formatDisplayDate } from '../../financeDomain/financeHelpers'

const PaymentHistoryDrawer = ({ isOpen, onClose, receipts, onViewReceipt, onSendWhatsApp }) => {
    const [sendingId, setSendingId] = useState('')
    if (!isOpen) return null

    const sendWhatsApp = async (row) => {
        if (!onSendWhatsApp) {
            toast.info('WhatsApp send is not available here.')
            return
        }
        setSendingId(row.id)
        try {
            const result = await onSendWhatsApp({ receiptId: row.id, channel: 'whatsapp' })
            const status = result?.delivery?.status
            if (result?.success === false) {
                toast.error(result.message || 'WhatsApp send failed.')
            } else if (status === 'MOCK_QUEUED') {
                toast.info('WhatsApp MOCK_QUEUED to local outbox — not a real WhatsApp delivery.')
            } else if (status === 'NOT_CONFIGURED' || status === 'queued_stub') {
                toast.info(result?.delivery?.message || 'WhatsApp is NOT_CONFIGURED until API credentials are connected.')
            } else if ((status === 'sent' || status === 'SENT') && result?.delivery?.delivered) {
                toast.success(`WhatsApp receipt sent for ${row.receiptNo}.`)
            } else if (status === 'FAILED' || status === 'failed') {
                toast.error(result?.delivery?.message || 'WhatsApp provider rejected the message.')
            } else {
                toast.info(result?.delivery?.message || `WhatsApp status: ${status || 'unknown'}`)
            }
        } finally {
            setSendingId('')
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex justify-end'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />
            <div className='relative z-10 w-full max-w-xl h-full bg-white shadow-xl p-5 overflow-y-auto'>
                <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-[#1E1E1E]'>Payment history</h3>
                    <button type='button' onClick={onClose} className='text-[#667085] hover:text-[#FF5722] cursor-pointer' aria-label='Close'>
                        <X size={20} />
                    </button>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left min-w-[720px]'>
                        <thead className='text-xs bg-[#EDEEF5]'>
                            <tr>
                                <th className='px-2 py-3'>Date</th>
                                <th className='px-2 py-3'>Receipt No.</th>
                                <th className='px-2 py-3'>Fee Head</th>
                                <th className='px-2 py-3'>Amount</th>
                                <th className='px-2 py-3'>Mode</th>
                                <th className='px-2 py-3'>Status</th>
                                <th className='px-2 py-3'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-6 text-center text-[#667085]'>No payments yet.</td>
                                </tr>
                            ) : receipts.map((row) => (
                                <tr key={row.id} className='border-b border-[#F2F4F7]'>
                                    <td className='px-2 py-3'>{formatDisplayDate(row.paymentDate)}</td>
                                    <td className='px-2 py-3 font-mono text-xs text-[#515DEF]'>{row.receiptNo}</td>
                                    <td className='px-2 py-3'>{(row.feeHeads || []).join(', ')}</td>
                                    <td className='px-2 py-3 font-medium'>{formatCurrency(row.amountPaid)}</td>
                                    <td className='px-2 py-3'>{paymentModeLabel(row.paymentMode)}</td>
                                    <td className='px-2 py-3'>{row.status}</td>
                                    <td className='px-2 py-3'>
                                        <div className='flex items-center gap-2'>
                                            <button type='button' onClick={() => onViewReceipt(row)} className='text-[#515DEF] cursor-pointer' aria-label='View receipt'>
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                type='button'
                                                disabled={sendingId === row.id}
                                                onClick={() => sendWhatsApp(row)}
                                                className='text-[#25D366] cursor-pointer disabled:opacity-50'
                                                aria-label='Send receipt on WhatsApp'
                                                title='Send receipt on WhatsApp'
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default PaymentHistoryDrawer
