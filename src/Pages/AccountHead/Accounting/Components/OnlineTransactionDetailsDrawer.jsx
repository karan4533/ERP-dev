import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { onlineBookStatusBadgeColor } from '../accountingData'

const SectionLabel = ({ children }) => (
    <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide mb-2'>{children}</p>
)

const DetailRow = ({ label, value }) => (
    <div className='flex justify-between gap-4 py-2 border-b border-[#F2F4F7] last:border-b-0 text-sm'>
        <span className='text-[#667085] shrink-0'>{label}</span>
        <span className='text-[#1E1E1E] font-medium text-right'>{value}</span>
    </div>
)

const TRANSITION_MS = 300

const OnlineTransactionDetailsDrawer = ({ isOpen, onClose, transaction }) => {
    const [mounted, setMounted] = useState(false)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (isOpen && transaction) {
            setMounted(true)
            const frame = requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true))
            })
            return () => cancelAnimationFrame(frame)
        }

        setVisible(false)
        const timer = window.setTimeout(() => setMounted(false), TRANSITION_MS)
        return () => window.clearTimeout(timer)
    }, [isOpen, transaction])

    useEffect(() => {
        if (!mounted) return undefined

        const handleEscape = (event) => {
            if (event.key === 'Escape') onClose()
        }

        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleEscape)
        }
    }, [mounted, onClose])

    if (!mounted || !transaction) return null

    const { detail } = transaction

    return (
        <div className='fixed inset-0 z-[100] flex justify-end'>
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
                aria-hidden='true'
            />

            <aside
                className={`relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className='flex items-center justify-between px-5 py-4 border-b border-[#F2F4F7] shrink-0'>
                    <div>
                        <h2 className='text-lg font-semibold text-[#1E1E1E]'>Transaction Details</h2>
                        <p className='text-xs text-[#667085] mt-0.5 font-mono'>{transaction.transactionId}</p>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close transaction details'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto px-5 py-5 space-y-6'>
                    <div className='flex items-center justify-between gap-3'>
                        <div>
                            <p className='text-base font-semibold text-[#1E1E1E]'>{transaction.party}</p>
                            <p className='text-sm text-[#667085] mt-0.5'>{transaction.dateTime}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${onlineBookStatusBadgeColor[transaction.status]}`}>
                            {transaction.status}
                        </span>
                    </div>

                    <div>
                        <SectionLabel>Gateway Response</SectionLabel>
                        <p className='text-sm text-[#1E1E1E] bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-2.5 font-mono text-xs'>
                            {detail.gatewayResponse}
                        </p>
                    </div>

                    <div>
                        <SectionLabel>Reference Number</SectionLabel>
                        <p className='text-sm font-semibold text-[#515DEF] font-mono'>{detail.referenceNumber}</p>
                    </div>

                    <div>
                        <SectionLabel>Payment Details</SectionLabel>
                        <div className='bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-1'>
                            <DetailRow label='Order ID' value={detail.paymentDetails.orderId} />
                            <DetailRow label='Fee Head / Purpose' value={detail.paymentDetails.feeHead} />
                            <DetailRow label='Paid By' value={detail.paymentDetails.paidBy} />
                            <DetailRow label='Gateway' value={transaction.paymentGateway} />
                            <DetailRow label='Method' value={transaction.paymentMethod} />
                            <DetailRow label='Amount' value={transaction.amount} />
                            <DetailRow label='Settlement Date' value={detail.paymentDetails.settlementDate} />
                            <DetailRow label='Bank Reference' value={transaction.bankReference} />
                        </div>
                    </div>

                    <div>
                        <SectionLabel>Refund History</SectionLabel>
                        {detail.refundHistory.length === 0 ? (
                            <p className='text-sm text-[#667085] bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-3'>
                                No refunds recorded for this transaction.
                            </p>
                        ) : (
                            <div className='space-y-2'>
                                {detail.refundHistory.map((refund) => (
                                    <div
                                        key={`${refund.date}-${refund.amount}`}
                                        className='bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-3 text-sm'
                                    >
                                        <div className='flex justify-between gap-2'>
                                            <span className='font-medium text-[#1E1E1E]'>{refund.amount}</span>
                                            <span className='text-[#4CAF50] font-semibold text-xs'>{refund.status}</span>
                                        </div>
                                        <p className='text-[#667085] mt-1'>{refund.date} · {refund.reason}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <SectionLabel>Remarks</SectionLabel>
                        <p className='text-sm text-[#667085]'>{detail.remarks}</p>
                    </div>
                </div>

                <div className='px-5 py-4 border-t border-[#F2F4F7] shrink-0'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='w-full text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        Close
                    </button>
                </div>
            </aside>
        </div>
    )
}

export default OnlineTransactionDetailsDrawer
