import React, { useMemo, useState } from 'react'
import { CalendarClock, History, Smartphone } from 'lucide-react'
import { toast } from 'react-toastify'
import { useFinance } from '../../AccountHead/financeDomain/FinanceContext'
import { DEFAULT_ACADEMIC_YEAR, FEE_INSTALLMENT_STATUSES } from '../../AccountHead/financeDomain/financeConstants'
import { formatCurrency, groupInstallmentsByMonth, summarizeStudentFees } from '../../AccountHead/financeDomain/financeHelpers'
import FeeInstallmentCard from '../../AccountHead/FeesManagement/Components/FeeInstallmentCard'
import CheckoutMockModal from '../../AccountHead/FeesManagement/Components/CheckoutMockModal'
import PaymentHistoryDrawer from '../../AccountHead/FeesManagement/Components/PaymentHistoryDrawer'
import ReceiptDetailsDrawer from '../../AccountHead/FeesManagement/Components/ReceiptDetailsDrawer'
import StudentFeeSummary from '../../AccountHead/FeesManagement/Components/StudentFeeSummary'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import EntryClosureGate from '../../../Common/demoDomain/EntryClosureGate'
import { entryBlocked } from '../../../Common/demoDomain/governance'
import { filterInstallmentsByScope, filterReceiptsByScope } from './feePaymentScope'

const formatDueDate = (iso) => {
    if (!iso) return '—'
    try {
        return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return iso
    }
}

/**
 * @param {{ feeScope?: 'academic' | 'transport' | 'all' }} props
 * academic = school fees (default Academic Payment)
 * transport = Transport Fee only (Transport Payment page)
 */
const FeesPayemnt = ({ feeScope = 'academic' }) => {
    const {
        students,
        getInstallmentsForStudent,
        collectFeePayment,
        receipts,
        reprintReceipt,
        sendReceipt,
    } = useFinance()

    const { activeStudent, isParentPortal } = useActiveStudent()
    const admissionNumber = activeStudent?.admissionNumber || activeStudent?.admissionNo
    const student = useMemo(() => {
        if (!activeStudent) return null
        const byId = students.find((item) => String(item.id) === String(activeStudent.id))
        if (byId) return byId
        if (admissionNumber) {
            const byAdmission = students.find((item) => (
                item.admissionNo === admissionNumber
                || item.admissionNumber === admissionNumber
            ))
            if (byAdmission) return byAdmission
        }
        // Soft match when finance row uses a display name + class (rare offline demos).
        const name = String(activeStudent.name || '').trim().toLowerCase()
        const klass = String(activeStudent.className || '').trim().toLowerCase()
        if (!name) return null
        return students.find((item) => (
            String(item.name || '').trim().toLowerCase() === name
            && (!klass || String(item.className || '').trim().toLowerCase() === klass)
        )) || null
    }, [activeStudent, admissionNumber, students])
    const [academicYear] = useState(student?.academicYear || activeStudent?.academicYear || DEFAULT_ACADEMIC_YEAR)
    const [view, setView] = useState('pay')
    const [selectedIds, setSelectedIds] = useState([])
    const [checkoutOpen, setCheckoutOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [receipt, setReceipt] = useState(null)

    const installments = useMemo(() => {
        if (!student) return []
        return filterInstallmentsByScope(
            getInstallmentsForStudent(student.id, academicYear),
            feeScope,
        )
    }, [academicYear, feeScope, getInstallmentsForStudent, student])
    const summary = useMemo(() => summarizeStudentFees(installments), [installments])
    const grouped = groupInstallmentsByMonth(installments)
    const studentReceipts = useMemo(() => {
        const own = receipts.filter((item) => item.studentId === student?.id)
        return filterReceiptsByScope(own, feeScope)
    }, [feeScope, receipts, student?.id])
    const emptyCopy = feeScope === 'transport'
        ? 'No transport fee installments yet. After Transport Manager enrolls this student on a route, dues appear here.'
        : 'No academic fee installments yet for this student. Account Head must Define Fee Structure for this class (and import the student into finance) before dues appear here.'
    const pageHint = feeScope === 'transport'
        ? 'Transport Fee only — school/tuition fees are under Academic Payment.'
        : 'Academic fees only — transport dues are under Transport Payment.'

    const scheduleHint = useMemo(() => {
        const open = installments.filter((row) => (
            row.status !== FEE_INSTALLMENT_STATUSES.PAID
            && row.status !== FEE_INSTALLMENT_STATUSES.WAIVED
            && row.status !== FEE_INSTALLMENT_STATUSES.CANCELLED
            && (Number(row.balanceAmount) || 0) > 0
        ))
        if (!open.length) return null
        const today = new Date().toISOString().slice(0, 10)
        const sorted = [...open].sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')))
        const next = sorted.find((row) => (row.dueDate || '') >= today) || sorted[0]
        const overdue = open.filter((row) => row.dueDate && row.dueDate < today).length
        return { next, openCount: open.length, overdue }
    }, [installments])

    const allocations = selectedIds.map((id) => {
        const row = installments.find((item) => item.id === id)
        return row ? { installmentId: id, amount: row.balanceAmount } : null
    }).filter(Boolean)
    const totalAmount = allocations.reduce((sum, item) => sum + item.amount, 0)

    const payNow = async (payload) => {
        if (!student || entryBlocked('Finance', activeStudent?.name || 'Student')) return { success: false }
        const result = await collectFeePayment({
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
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085] space-y-2'>
                    <p>Fee information is not available for the selected student.</p>
                    <p className='text-xs'>
                        {isParentPortal
                            ? 'Parent fees load from the campus finance ledger for linked children. Ask Account Head to import the student and apply fee structures, then refresh this page.'
                            : 'Ask Account Head to import this student into finance and apply fee structures.'}
                    </p>
                </div>
            )}
            {view === 'pay' && student && (
                <>
                    <StudentFeeSummary summary={summary} nextDue={scheduleHint?.next} />
                    {scheduleHint && (
                        <div className='bg-white rounded-2xl shadow-md p-4 flex items-start gap-3'>
                            <div className='size-10 rounded-full bg-[#515DEF0D] text-[#515DEF] flex items-center justify-center shrink-0'>
                                <CalendarClock size={18} />
                            </div>
                            <div className='min-w-0'>
                                <p className='text-sm font-semibold text-[#1E1E1E]'>Payment schedule</p>
                                <p className='text-sm text-[#667085] mt-1'>
                                    Next: <span className='font-medium text-[#1E1E1E]'>{scheduleHint.next.installmentLabel || scheduleHint.next.feeHead}</span>
                                    {' · '}
                                    {formatCurrency(scheduleHint.next.balanceAmount || scheduleHint.next.netAmount)}
                                    {' by '}
                                    {formatDueDate(scheduleHint.next.dueDate)}
                                </p>
                                <p className='text-xs text-[#808080] mt-1'>
                                    {scheduleHint.openCount} open installment{scheduleHint.openCount === 1 ? '' : 's'}
                                    {scheduleHint.overdue ? ` · ${scheduleHint.overdue} overdue` : ''}
                                    {' · '}
                                    One Time = pay full amount once; Monthly / Quarterly / Term Wise show each part below.
                                </p>
                            </div>
                        </div>
                    )}
                    {Boolean(installments.length) && (
                        <p className='text-xs text-[#667085] px-1'>{pageHint}</p>
                    )}
                    {!installments.length && (
                        <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                            {emptyCopy}
                        </div>
                    )}
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
