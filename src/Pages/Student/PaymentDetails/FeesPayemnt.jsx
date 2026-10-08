import React, { useState } from 'react'
import { History, Smartphone } from 'lucide-react'
import { toast } from 'react-toastify'
import { useFinance } from '../../AccountHead/financeDomain/FinanceContext'
import { DEFAULT_ACADEMIC_YEAR } from '../../AccountHead/financeDomain/financeConstants'
import { formatCurrency, groupInstallmentsByMonth } from '../../AccountHead/financeDomain/financeHelpers'
import FeeInstallmentCard from '../../AccountHead/FeesManagement/Components/FeeInstallmentCard'
import CheckoutMockModal from '../../AccountHead/FeesManagement/Components/CheckoutMockModal'
import PaymentHistoryDrawer from '../../AccountHead/FeesManagement/Components/PaymentHistoryDrawer'
import ReceiptDetailsDrawer from '../../AccountHead/FeesManagement/Components/ReceiptDetailsDrawer'
import StudentFeeSummary from '../../AccountHead/FeesManagement/Components/StudentFeeSummary'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import EntryClosureGate from '../../../Common/demoDomain/EntryClosureGate'
import { entryBlocked } from '../../../Common/demoDomain/governance'

const FeesPayemnt = () => {
    const {
        students,
        getInstallmentsForStudent,
        getStudentSummary,
        collectFeePayment,
        receipts,
        reprintReceipt,
        sendReceipt,
    } = useFinance()

    const { activeStudent } = useActiveStudent()
    const admissionNumber = activeStudent?.admissionNumber || activeStudent?.admissionNo
    const student = students.find((item) => (
        item.id === activeStudent?.id
        || item.admissionNo === admissionNumber
        || item.admissionNumber === admissionNumber
    )) || null
    const [academicYear] = useState(student?.academicYear || DEFAULT_ACADEMIC_YEAR)
    const [view, setView] = useState('pay')
    const [selectedIds, setSelectedIds] = useState([])
    const [checkoutOpen, setCheckoutOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [receipt, setReceipt] = useState(null)

    const installments = student ? getInstallmentsForStudent(student.id, academicYear) : []
    const summary = student ? getStudentSummary(student.id, academicYear) : null
    const grouped = groupInstallmentsByMonth(installments)
    const studentReceipts = receipts.filter((item) => item.studentId === student?.id)

    const allocations = selectedIds.map((id) => {
        const row = installments.find((item) => item.id === id)
        return row ? { installmentId: id, amount: row.balanceAmount } : null
    }).filter(Boolean)
    const totalAmount = allocations.reduce((sum, item) => sum + item.amount, 0)

    const payNow = (payload) => {
        if (!student || entryBlocked('Finance', activeStudent?.name || 'Student')) return { success: false }
        const result = collectFeePayment({
            studentId: student.id,
            allocations,
            ...payload,
            collectedBy: student.name,
        })
        if (result?.success) {
            setSelectedIds([])
            if (result.receipt) setReceipt(result.receipt)
        } else {
            toast.error(result?.errors?.[0] || 'Payment failed.')
        }
        return result
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex gap-6 border-b border-[#F2F4F7]'>
                    {['pay', 'history'].map((tab) => (
                        <button
                            key={tab}
                            type='button'
                            onClick={() => setView(tab)}
                            className={`pb-3 text-sm font-medium cursor-pointer ${view === tab ? 'text-[#515DEF] border-b-2 border-[#515DEF]' : 'text-[#808080]'}`}
                        >
                            {tab === 'pay' ? 'Make Payment' : 'Transaction History'}
                        </button>
                    ))}
                </div>
                <div className='mt-4'>
                    <select value={academicYear} readOnly className='w-full max-w-xs text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'>
                        <option>{academicYear}</option>
                    </select>
                </div>
            </div>

            <EntryClosureGate moduleName='Finance' actor={activeStudent?.name || 'Student'} />
            {!student && (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Fee information is not available for the selected student.
                </div>
            )}
            {view === 'pay' && student && (
                <>
                    <StudentFeeSummary summary={summary} />
                    {grouped.map((group) => (
                        <div key={group.label} className='space-y-3'>
                            <h3 className='text-base font-semibold'>{group.label}</h3>
                            {group.items.map((item) => (
                                <FeeInstallmentCard
                                    key={item.id}
                                    installment={item}
                                    selected={selectedIds.includes(item.id)}
                                    onToggle={(row) => {
                                        if (!row.payable) return
                                        setSelectedIds((prev) => prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id])
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                    <div className='bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3'>
                        <p className='font-semibold'>Total Amount {formatCurrency(totalAmount)}</p>
                        <div className='flex gap-2'>
                            <button type='button' onClick={() => setHistoryOpen(true)} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                                <History size={14} /> History
                            </button>
                            <button
                                type='button'
                                disabled={!totalAmount}
                                onClick={() => setCheckoutOpen(true)}
                                className='inline-flex items-center gap-2 bg-[#FF9800] text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-50'
                            >
                                <Smartphone size={16} /> Pay Now
                            </button>
                        </div>
                    </div>
                </>
            )}

            {view === 'history' && student && (
                <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
                    {studentReceipts.length === 0 && <p className='text-sm text-[#667085]'>No transactions yet.</p>}
                    {studentReceipts.map((item) => (
                        <button key={item.id} type='button' onClick={() => setReceipt(item)} className='w-full text-left border border-[#EDEEF5] rounded-xl p-3 cursor-pointer'>
                            <p className='font-medium'>{item.receiptNo}</p>
                            <p className='text-sm text-[#667085]'>{formatCurrency(item.amountPaid)} · {item.paymentMode}</p>
                        </button>
                    ))}
                </div>
            )}

            <CheckoutMockModal
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                amount={totalAmount}
                student={student}
                onSuccess={payNow}
            />
            <PaymentHistoryDrawer
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                receipts={studentReceipts}
                onViewReceipt={(row) => { setReceipt(row); setHistoryOpen(false) }}
            />
            <ReceiptDetailsDrawer
                isOpen={Boolean(receipt)}
                onClose={() => setReceipt(null)}
                receipt={receipt}
                student={student}
                onReprint={reprintReceipt}
                onSend={sendReceipt}
                onPrint={() => window.print()}
            />
        </section>
    )
}

export default FeesPayemnt
