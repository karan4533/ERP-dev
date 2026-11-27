import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarClock, History, Smartphone } from 'lucide-react'
import { toast } from 'react-toastify'
import { useFinance } from '../../AccountHead/financeDomain/FinanceContext'
import { DEFAULT_ACADEMIC_YEAR, FEE_INSTALLMENT_STATUSES } from '../../AccountHead/financeDomain/financeConstants'
import { formatCurrency, groupInstallmentsByMonth, summarizeStudentFees } from '../../AccountHead/financeDomain/financeHelpers'
import FeeInstallmentCard from '../../AccountHead/FeesManagement/Components/FeeInstallmentCard'
import RazorpayCheckoutModal from '../../AccountHead/FeesManagement/Components/RazorpayCheckoutModal'
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
        generatePaymentLink,
        confirmGatewayPayment,
        syncPendingGatewayPayment,
        dismissStaleGatewayLinks,
        paymentLinks,
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
    const [checkoutAmount, setCheckoutAmount] = useState(0)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [receipt, setReceipt] = useState(null)
    const checkoutRef = useRef(null)

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

    const payableInstallments = useMemo(
        () => installments.filter((row) => row.payable && (Number(row.balanceAmount) || 0) > 0),
        [installments],
    )

    // Drop selections that are no longer payable (e.g. settled rows left checked).
    useEffect(() => {
        const allowed = new Set(payableInstallments.map((row) => row.id))
        setSelectedIds((prev) => {
            const next = prev.filter((id) => allowed.has(id))
            return next.length === prev.length ? prev : next
        })
    }, [payableInstallments])

    const scheduleHint = useMemo(() => {
        const open = payableInstallments
        if (!open.length) return null
        const today = new Date().toISOString().slice(0, 10)
        const sorted = [...open].sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')))
        const next = sorted.find((row) => (row.dueDate || '') >= today) || sorted[0]
        const overdue = open.filter((row) => row.dueDate && row.dueDate < today).length
        return { next, openCount: open.length, overdue }
    }, [payableInstallments])

    const allocations = selectedIds.map((id) => {
        const row = installments.find((item) => item.id === id)
        const amount = Number(row?.balanceAmount) || 0
        if (!row || amount <= 0) return null
        return { installmentId: id, amount }
    }).filter(Boolean)
    const totalAmount = allocations.reduce((sum, item) => sum + item.amount, 0)

    const openCheckout = () => {
        if (!student || entryBlocked('Finance', activeStudent?.name || 'Student')) return
        let ids = [...selectedIds]
        let rows = allocations
        let amount = totalAmount
        // If nothing payable is selected, select all open dues so Pay Now uses the balance.
        if (amount <= 0) {
            if (!payableInstallments.length) {
                toast.error('No outstanding balance to pay.')
                return
            }
            ids = payableInstallments.map((row) => row.id)
            rows = payableInstallments.map((row) => ({
                installmentId: row.id,
                amount: Number(row.balanceAmount) || 0,
            }))
            amount = rows.reduce((sum, item) => sum + item.amount, 0)
            setSelectedIds(ids)
            toast.info('Selected outstanding instalments for payment.')
        }
        if (amount < 1) {
            toast.error('Select an unpaid instalment with a balance (₹1 or more).')
            return
        }
        checkoutRef.current = {
            studentId: student.id,
            amount,
            installmentIds: ids,
        }
        setCheckoutAmount(amount)
        setCheckoutOpen(true)
    }

    const createGatewayIntent = async () => {
        if (!student || entryBlocked('Finance', activeStudent?.name || 'Student')) {
            throw new Error('Payment is blocked for this student.')
        }
        const snap = checkoutRef.current
        const amount = Number(snap?.amount) || 0
        const installmentIds = snap?.installmentIds || []
        if (amount < 1 || !installmentIds.length) {
            throw new Error('Select an unpaid instalment with a balance before paying.')
        }
        return generatePaymentLink({
            studentId: snap.studentId || student.id,
            amount,
            installmentIds,
        })
    }

    const confirmGateway = async (payload) => confirmGatewayPayment(payload)

    const handleGatewayPaid = (result) => {
        checkoutRef.current = null
        setCheckoutAmount(0)
        setSelectedIds([])
        if (result?.receipt) setReceipt(result.receipt)
    }

    const pendingGatewayLink = useMemo(() => {
        if (!student) return null
        // Nothing to sync-post if this student has no outstanding balance.
        if ((Number(summary?.outstanding) || 0) <= 0) return null
        return (paymentLinks || []).find((link) => {
            if (String(link.studentId) !== String(student.id)) return false
            if (String(link.gateway || '').toLowerCase() !== 'razorpay') return false
            const status = String(link.status || '').toUpperCase()
            if (status === 'PAID' || status === 'ABANDONED' || status === 'FAILED') return false
            if (!link.providerOrderId) return false
            const ids = link.installmentIds || []
            if (!ids.length) return false
            // Hide when every linked instalment is already settled.
            const stillDue = ids.some((id) => {
                const row = installments.find((item) => item.id === id)
                return row && (Number(row.balanceAmount) || 0) > 0
            })
            return stillDue
        }) || null
    }, [installments, paymentLinks, student, summary?.outstanding])

    const syncPendingPayment = async () => {
        if (!student) return
        const result = await syncPendingGatewayPayment(student.id)
        dismissStaleGatewayLinks(student.id)
        if (result?.success) {
            if (result.reason === 'abandoned_stale' || result.skipped) {
                toast.info('Cleared stale payment banner.')
            } else {
                toast.success(
                    `Payment synced${result.receipt?.receiptNo ? `. Receipt ${result.receipt.receiptNo}` : ''}.`,
                )
            }
            if (result.receipt) setReceipt(result.receipt)
            setSelectedIds([])
        } else {
            dismissStaleGatewayLinks(student.id)
            toast.error(result?.errors?.[0] || 'Could not sync payment.')
        }
    }

    // Auto-clear stale OPEN Razorpay links (paid dues or captured orders) so the banner goes away.
    useEffect(() => {
        if (!student?.id) return undefined
        const openLinks = (paymentLinks || []).filter((link) => (
            String(link.studentId) === String(student.id)
            && String(link.gateway || '').toLowerCase() === 'razorpay'
            && !['PAID', 'ABANDONED', 'FAILED'].includes(String(link.status || '').toUpperCase())
            && link.providerOrderId
        ))
        if (!openLinks.length) return undefined
        let cancelled = false
        ;(async () => {
            const result = await syncPendingGatewayPayment(student.id)
            if (cancelled) return
            dismissStaleGatewayLinks(student.id)
            if (result?.success && result.receipt) {
                setReceipt(result.receipt)
                toast.success(
                    `Payment synced${result.receipt?.receiptNo ? `. Receipt ${result.receipt.receiptNo}` : ''}.`,
                )
                window.setTimeout(() => window.location.reload(), 400)
            }
        })().catch(() => {
            if (!cancelled) dismissStaleGatewayLinks(student.id)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student?.id, paymentLinks?.length])

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
                    {pendingGatewayLink && (
                        <div className='bg-[#FFF8E1] border border-[#FF980033] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                            <p className='text-sm text-[#E65100]'>
                                Razorpay may have succeeded, but this page did not refresh. Sync to post the receipt.
                            </p>
                            <button
                                type='button'
                                onClick={syncPendingPayment}
                                className='inline-flex items-center justify-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'
                            >
                                Sync paid receipt
                            </button>
                        </div>
                    )}
                    <div className='bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3'>
                        <p className='font-semibold'>Total Amount {formatCurrency(totalAmount)}</p>
                        <div className='flex gap-2'>
                            <button type='button' onClick={() => setHistoryOpen(true)} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                                <History size={14} /> History
                            </button>
                            <button
                                type='button'
                                disabled={!payableInstallments.length}
                                onClick={openCheckout}
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

            <RazorpayCheckoutModal
                isOpen={checkoutOpen}
                onClose={() => {
                    setCheckoutOpen(false)
                    setCheckoutAmount(0)
                    checkoutRef.current = null
                }}
                amount={checkoutAmount || totalAmount}
                student={student}
                createIntent={createGatewayIntent}
                confirmPayment={confirmGateway}
                onPaid={handleGatewayPaid}
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
