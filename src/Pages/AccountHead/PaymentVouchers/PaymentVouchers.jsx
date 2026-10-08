import { useState } from 'react'
import { useFinance } from '../financeDomain/FinanceContext'
import { formatCurrency } from '../financeDomain/financeHelpers'

export default function PaymentVouchers() {
    const { transactions, students, recordVoucherAction } = useFinance()
    const [selectedId, setSelectedId] = useState(null)
    const selected = transactions.find((item) => item.id === selectedId) || null
    const student = students.find((item) => item.id === selected?.studentId)

    const download = (transaction) => {
        recordVoucherAction(transaction.id, 'Download')
        const text = [
            `Voucher No: ${transaction.voucherNo || '—'}`,
            `Transaction Reference: ${transaction.transactionNo || transaction.id}`,
            `Date: ${transaction.transactionDate || ''}`,
            `Payee: ${student?.name || transaction.vendorId || '—'}`,
            `Category: ${transaction.category || transaction.sourceModule || ''}`,
            `Payment Mode: ${transaction.paymentMode || ''}`,
            `Amount: ${transaction.amount}`,
            `Narration: ${transaction.narration || ''}`,
            `Prepared By: ${transaction.preparedBy || transaction.createdBy || 'Finance Head'}`,
            `Status: ${transaction.voucherStatus || 'Issued'}`,
        ].join('\n')
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${transaction.voucherNo || transaction.id}.txt`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>Payment vouchers</h2>
                <p className='text-sm text-[#667085] mt-1'>Each voucher uses an existing finance transaction. No second transaction is created.</p>
            </div>
            {transactions.length === 0 && (
                <div className='bg-white rounded-2xl shadow-md p-6 text-sm text-[#667085]'>No finance transactions yet. Collect a fee to generate a voucher from that transaction.</div>
            )}
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>{['Voucher', 'Transaction', 'Date', 'Amount', 'Status', 'Action'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {transactions.map((item) => (
                            <tr key={item.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{item.voucherNo || '—'}</td>
                                <td className='px-2 py-3'>{item.transactionNo || item.id}</td>
                                <td className='px-2 py-3'>{item.transactionDate}</td>
                                <td className='px-2 py-3'>{formatCurrency(item.amount)}</td>
                                <td className='px-2 py-3'>{item.voucherStatus || item.status || 'Issued'}</td>
                                <td className='px-2 py-3'>
                                    <button type='button' onClick={() => { recordVoucherAction(item.id, 'View'); setSelectedId(item.id) }} className='text-[#515DEF] cursor-pointer'>View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selected && (
                <div className='bg-white rounded-2xl shadow-md p-4 text-sm space-y-1'>
                    <h3 className='text-lg font-semibold mb-2'>Voucher {selected.voucherNo || selected.id}</h3>
                    <p>Transaction reference: {selected.transactionNo || selected.id}</p>
                    <p>Date: {selected.transactionDate}</p>
                    <p>Payee / student: {student?.name || '—'}</p>
                    <p>Category: {selected.category || selected.sourceModule}</p>
                    <p>Payment mode: {selected.paymentMode}</p>
                    <p>Amount: {formatCurrency(selected.amount)}</p>
                    <p>Narration: {selected.narration || '—'}</p>
                    <p>Prepared by: {selected.preparedBy || selected.createdBy || 'Finance Head'}</p>
                    <p>Status: {selected.voucherStatus || 'Issued'}</p>
                    <div className='flex gap-2 pt-3'>
                        <button type='button' onClick={() => { recordVoucherAction(selected.id, 'Print'); window.print() }} className='bg-[#515DEF] text-white px-4 py-2 rounded-md cursor-pointer'>Print</button>
                        <button type='button' onClick={() => download(selected)} className='border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md cursor-pointer'>Download</button>
                    </div>
                </div>
            )}
        </section>
    )
}
