import React from 'react'
import { Eye, X } from 'lucide-react'
import { paymentModeLabel } from '../../financeDomain/financeConstants'
import { formatCurrency, formatDisplayDate } from '../../financeDomain/financeHelpers'

const PaymentHistoryDrawer = ({ isOpen, onClose, receipts, onViewReceipt }) => {
    if (!isOpen) return null

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
                    <table className='w-full text-sm text-left min-w-[640px]'>
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
                                        <button type='button' onClick={() => onViewReceipt(row)} className='text-[#515DEF] cursor-pointer'>
                                            <Eye size={16} />
                                        </button>
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
