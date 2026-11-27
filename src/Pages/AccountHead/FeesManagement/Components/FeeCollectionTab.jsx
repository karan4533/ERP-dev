import React, { useEffect, useState } from 'react'
import { History, Link2, Smartphone, Wallet } from 'lucide-react'
import { toast } from 'react-toastify'
import { DEFAULT_ACADEMIC_YEAR, FEE_INSTALLMENT_STATUSES } from '../../financeDomain/financeConstants'
import { formatCurrency, groupInstallmentsByMonth } from '../../financeDomain/financeHelpers'
import { useFinance } from '../../financeDomain/FinanceContext'
import StudentSearch from './StudentSearch'
import StudentFeeProfile from './StudentFeeProfile'
import StudentFeeSummary from './StudentFeeSummary'
import FeeInstallmentCard from './FeeInstallmentCard'
import FeePaymentModal from './FeePaymentModal'
import SiblingFeesDrawer from './SiblingFeesDrawer'
import PaymentHistoryDrawer from './PaymentHistoryDrawer'
import PaymentLinkModal from './PaymentLinkModal'
import ReceiptDetailsDrawer from './ReceiptDetailsDrawer'
import RazorpayCheckoutModal from './RazorpayCheckoutModal'
import EntryClosureGate from '../../../../Common/demoDomain/EntryClosureGate'
import { entryBlocked } from '../../../../Common/demoDomain/governance'

const PAID_STATUSES = [FEE_INSTALLMENT_STATUSES.PAID, FEE_INSTALLMENT_STATUSES.WAIVED]
const UNPAID_STATUSES = [
    FEE_INSTALLMENT_STATUSES.UNPAID,
    FEE_INSTALLMENT_STATUSES.PARTIALLY_PAID,
    FEE_INSTALLMENT_STATUSES.OVERDUE,
]
const RECORD_VIEWS = [
    { id: 'unpaid', label: 'Unpaid / due', statuses: UNPAID_STATUSES },
    { id: 'paid', label: 'Paid', statuses: PAID_STATUSES },
    { id: 'all', label: 'All', statuses: null },
]

const FeeCollectionTab = () => {
    const {
        students,
        getStudentById,
        getInstallmentsForStudent,
        getSiblings,
        getStudentSummary,
        collectFeePayment,
        generatePaymentLink,
        confirmGatewayPayment,
        receipts,
        reprintReceipt,
        sendReceipt,
        sendPaymentLink,
        bankAccounts,
        posTerminals,
        waiveFine,
        refreshFinanceStudentRoster,
    } = useFinance()

    const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_YEAR)
    const [student, setStudent] = useState(null)

    // Keep class/section/roll in sync after Principal/Coordinator Section Assignment.
    useEffect(() => {
        if (typeof refreshFinanceStudentRoster !== 'function') return undefined
        let cancelled = false
        refreshFinanceStudentRoster().then(() => {
            if (cancelled) return
        }).catch(() => {})
        return () => {
            cancelled = true
        }
    }, [refreshFinanceStudentRoster])

    useEffect(() => {
        if (!student?.id) return
        const latest = getStudentById(student.id)
        if (latest && (
            latest.className !== student.className
            || latest.section !== student.section
            || latest.rollNo !== student.rollNo
        )) {
            setStudent(latest)
        }
    }, [students, student, getStudentById])
    const [selectedIds, setSelectedIds] = useState([])
    const [partials, setPartials] = useState({})
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [checkoutOpen, setCheckoutOpen] = useState(false)
    const [siblingsOpen, setSiblingsOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [link, setLink] = useState(null)
    const [receipt, setReceipt] = useState(null)
    const [siblingSelection, setSiblingSelection] = useState([])
    const [activeStudentId, setActiveStudentId] = useState(null)
    const [waiverReason, setWaiverReason] = useState('')
    const [recordView, setRecordView] = useState('unpaid')
    const [linkLoading, setLinkLoading] = useState(false)

    const activeStudent = student || getStudentById(activeStudentId)
    const installments = activeStudent
        ? getInstallmentsForStudent(activeStudent.id, academicYear)
        : []
    const summary = activeStudent ? getStudentSummary(activeStudent.id, academicYear) : null
    const siblings = activeStudent ? getSiblings(activeStudent.id) : []
    const viewCounts = Object.fromEntries(RECORD_VIEWS.map((view) => [
        view.id,
        view.statuses ? installments.filter((row) => view.statuses.includes(row.status)).length : installments.length,
    ]))
    const activeView = RECORD_VIEWS.find((view) => view.id === recordView) || RECORD_VIEWS[0]
    const visibleInstallments = activeView.statuses
        ? installments.filter((row) => activeView.statuses.includes(row.status))
        : installments
    const grouped = groupInstallmentsByMonth(visibleInstallments)

    const siblingSummaries = {}
    siblings.forEach((item) => {
        siblingSummaries[item.id] = getStudentSummary(item.id, academicYear)
    })

    const allocations = selectedIds.map((id) => {
        const row = installments.find((item) => item.id === id)
        if (!row) return null
        const amount = Number(partials[id] ?? row.balanceAmount)
        return { installmentId: id, amount }
    }).filter(Boolean)

    const totalAmount = allocations.reduce((sum, item) => sum + item.amount, 0)
    const lateFee = selectedIds.reduce((sum, id) => {
        const row = installments.find((item) => item.id === id)
        return sum + (row?.fineAmount || 0)
    }, 0)

    const studentReceipts = receipts.filter((item) => item.studentId === activeStudent?.id)

    const selectStudent = (next) => {
        setStudent(next)
        setActiveStudentId(next?.id ?? null)
        setSelectedIds([])
        setPartials({})
    }

    const toggleInstallment = (row) => {
        if (!row.payable) return
        setSelectedIds((prev) => (
            prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
        ))
        setPartials((prev) => ({ ...prev, [row.id]: row.balanceAmount }))
    }

    const confirmPayment = (payload) => {
        if (entryBlocked('Finance', 'Account Head')) return { success: false }
        return collectFeePayment({
        studentId: activeStudent.id,
        allocations,
        ...payload,
        collectedBy: payload.details?.receivedBy || 'Finance Head',
        })
    }

    const handleCollectResult = async (payload) => {
        const result = await confirmPayment(payload)
        if (result?.success) {
            setSelectedIds([])
            setPartials({})
            if (result.receipt) setReceipt(result.receipt)
        }
        return result
    }

    const handleWaive = (installmentId) => {
        if (entryBlocked('Finance', 'Account Head')) return
        const result = waiveFine({ installmentId, reason: waiverReason })
        if (!result.success) toast.error(result.message)
        else {
            toast.success('Fine waived.')
            setWaiverReason('')
        }
    }

    return (
        <div className='space-y-6'>
            <EntryClosureGate moduleName='Finance' actor='Account Head' />
            <StudentSearch
                students={students}
                academicYear={academicYear}
                onAcademicYearChange={setAcademicYear}
                selectedStudent={activeStudent}
                onSelectStudent={selectStudent}
            />

            {!activeStudent && (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Search a student to open the collection schedule.
                </div>
            )}

            {activeStudent && (
                <>
                    <StudentFeeProfile
                        student={activeStudent}
                        siblings={siblings}
                        onViewSiblings={() => { setSiblingSelection([]); setSiblingsOpen(true) }}
                    />
                    <StudentFeeSummary summary={summary} />

                    <div className='flex flex-wrap gap-2'>
                        <button type='button' onClick={() => setHistoryOpen(true)} className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md cursor-pointer'>
                            <History size={16} /> Payment History
                        </button>
                        <button
                            type='button'
                            disabled={linkLoading}
                            onClick={async () => {
                                if (!totalAmount) {
                                    toast.error('Select payable instalments before generating a link.')
                                    return
                                }
                                setLinkLoading(true)
                                try {
                                    const created = await generatePaymentLink({
                                        studentId: activeStudent.id,
                                        amount: totalAmount,
                                        installmentIds: selectedIds,
                                    })
                                    if (created?.providerOrderId || created?.url) setLink(created)
                                    else toast.error('Could not generate a payment link.')
                                } catch (error) {
                                    toast.error(error?.message || 'Could not generate a payment link.')
                                } finally {
                                    setLinkLoading(false)
                                }
                            }}
                            className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md cursor-pointer disabled:opacity-50'
                        >
                            <Link2 size={16} /> {linkLoading ? 'Generating…' : 'Generate Payment Link'}
                        </button>
                        <button
                            type='button'
                            onClick={() => {
                                if (!totalAmount) {
                                    toast.error('Select payable instalments first.')
                                    return
                                }
                                setCheckoutOpen(true)
                            }}
                            className='inline-flex items-center gap-2 text-sm border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md cursor-pointer'
                        >
                            <Smartphone size={16} /> Pay with Razorpay
                        </button>
                    </div>

                    <div className='flex flex-wrap items-center gap-2' role='tablist' aria-label='Fee records'>
                        {RECORD_VIEWS.map((view) => (
                            <button
                                key={view.id}
                                type='button'
                                role='tab'
                                aria-selected={recordView === view.id}
                                onClick={() => setRecordView(view.id)}
                                className={`text-sm px-4 py-1.5 rounded-full border cursor-pointer ${recordView === view.id ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'bg-white text-[#515DEF] border-[#515DEF]'}`}
                            >
                                {view.label} ({viewCounts[view.id]})
                            </button>
                        ))}
                    </div>

                    {grouped.length === 0 && (
                        <div className='bg-white rounded-2xl shadow-md p-6 text-center text-sm text-[#667085]'>
                            {recordView === 'paid'
                                ? 'No paid instalments for this academic year yet.'
                                : recordView === 'unpaid'
                                    ? 'No unpaid instalments. Everything for this academic year is settled.'
                                    : 'No fee instalments for this academic year.'}
                        </div>
                    )}

                    {grouped.map((group) => (
                        <div key={group.label} className='space-y-3'>
                            <h3 className='text-base font-semibold text-[#1E1E1E]'>{group.label}</h3>
                            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                                {group.items.map((item) => (
                                    <div key={item.id} className='space-y-2'>
                                        <FeeInstallmentCard
                                            installment={item}
                                            selected={selectedIds.includes(item.id)}
                                            onToggle={toggleInstallment}
                                            partialAmount={partials[item.id]}
                                            onPartialAmountChange={(id, value) => setPartials((prev) => ({ ...prev, [id]: Number(value) }))}
                                            allowPartial
                                        />
                                        {item.fineAmount > 0 && item.status !== FEE_INSTALLMENT_STATUSES.PAID && (
                                            <div className='flex gap-2'>
                                                <input
                                                    value={waiverReason}
                                                    onChange={(event) => setWaiverReason(event.target.value)}
                                                    placeholder='Fine waiver reason'
                                                    className='flex-1 text-sm border border-[#D9D9D9] rounded-md px-3 py-2'
                                                />
                                                <button type='button' onClick={() => handleWaive(item.id)} className='text-sm text-[#515DEF] border border-[#515DEF] px-3 py-2 rounded-md cursor-pointer'>
                                                    Waive fine
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className='sticky bottom-3 bg-white rounded-2xl shadow-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                        <div className='text-sm text-[#667085] space-y-0.5'>
                            <p>Selected net {formatCurrency(Math.max(0, totalAmount - lateFee))} · Late fee {formatCurrency(lateFee)}</p>
                            <p className='text-lg font-semibold text-[#1E1E1E]'>Total Amount {formatCurrency(totalAmount)}</p>
                        </div>
                        <button
                            type='button'
                            disabled={!totalAmount}
                            onClick={() => setPaymentOpen(true)}
                            className='inline-flex items-center justify-center gap-2 bg-[#515DEF] text-white px-5 py-2.5 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <Wallet size={16} /> Pay / Collect
                        </button>
                    </div>
                </>
            )}

            {paymentOpen && (
            <FeePaymentModal
                onClose={() => setPaymentOpen(false)}
                student={activeStudent}
                allocations={allocations}
                totalAmount={totalAmount}
                lateFee={lateFee}
                onConfirm={handleCollectResult}
                bankAccounts={bankAccounts}
                posTerminals={posTerminals}
            />
            )}
            <RazorpayCheckoutModal
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                amount={totalAmount}
                student={activeStudent}
                createIntent={async () => {
                    if (entryBlocked('Finance', 'Account Head')) {
                        throw new Error('Finance entry is blocked.')
                    }
                    return generatePaymentLink({
                        studentId: activeStudent.id,
                        amount: totalAmount,
                        installmentIds: selectedIds,
                    })
                }}
                confirmPayment={(payload) => confirmGatewayPayment(payload)}
                onPaid={(result) => {
                    setSelectedIds([])
                    setPartials({})
                    if (result?.receipt) setReceipt(result.receipt)
                }}
            />
            <SiblingFeesDrawer
                isOpen={siblingsOpen}
                onClose={() => setSiblingsOpen(false)}
                currentStudent={activeStudent}
                siblings={siblings}
                summaries={siblingSummaries}
                selectedIds={siblingSelection}
                onToggle={(id) => setSiblingSelection((prev) => (
                    prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                ))}
                onApply={() => {
                    if (!siblingSelection.length) {
                        toast.info('No sibling selected. Sibling dues are never auto-charged.')
                        setSiblingsOpen(false)
                        return
                    }
                    const next = getStudentById(siblingSelection[0])
                    selectStudent(next)
                    setSiblingsOpen(false)
                    toast.info(`Switched to ${next.name}. Select instalments manually.`)
                }}
            />
            <PaymentHistoryDrawer
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                receipts={studentReceipts}
                onViewReceipt={(row) => { setReceipt(row); setHistoryOpen(false) }}
                onSendWhatsApp={sendReceipt}
            />
            <PaymentLinkModal
                isOpen={Boolean(link)}
                onClose={() => setLink(null)}
                link={link}
                onSend={sendPaymentLink}
            />
            <ReceiptDetailsDrawer
                isOpen={Boolean(receipt)}
                onClose={() => setReceipt(null)}
                receipt={receipt}
                student={activeStudent}
                onReprint={reprintReceipt}
                onSend={sendReceipt}
                onPrint={() => window.print()}
            />
        </div>
    )
}

export default FeeCollectionTab
