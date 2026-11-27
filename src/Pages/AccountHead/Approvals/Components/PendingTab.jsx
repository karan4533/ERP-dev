import React, { useEffect, useMemo, useState } from 'react'
import { Check, Search, X, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    departmentBadgeColor,
} from '../approvalsData'
import {
    ApproveRejectActions,
    SummaryCards,
    TableCard,
    TablePagination,
    UserAvatar,
    tdClass,
    thClass,
} from './ApprovalsShared'
import { useFinance } from '../../financeDomain/FinanceContext'

export const ReviewRequestModal = ({ request, isOpen, onClose, onDecide }) => {
    const [remarks, setRemarks] = useState('')
    if (!isOpen || !request?.detail) return null

    const { detail } = request

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>
                        Review request — {request.id}
                    </h2>
                    <button type='button' onClick={onClose} className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer' aria-label='Close modal'>
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-0'>
                    {[
                        ['Raised by', detail.raisedByFull],
                        ['Department', detail.department],
                        ['Claim type', detail.claimType],
                        ['Vehicle', detail.vehicle],
                        ['Amount claimed', detail.amount],
                        ['Submitted on', detail.submittedOn],
                    ].map(([label, value]) => (
                        <div key={label} className='flex items-center justify-between py-2.5 border-b border-[#F2F4F7] text-sm'>
                            <span className='text-[#667085]'>{label}</span>
                            <span className='font-medium text-[#1E1E1E]'>{value}</span>
                        </div>
                    ))}
                    <div className='flex items-center justify-between py-2.5 border-b border-[#F2F4F7] text-sm'>
                        <span className='text-[#667085]'>Supporting docs</span>
                        <button type='button' className='text-[#515DEF] font-medium hover:underline cursor-pointer'>
                            {detail.document}
                        </button>
                    </div>

                    <div className='pt-4'>
                        <label className='text-sm font-medium text-[#808080]'>Remarks (optional)</label>
                        <textarea
                            rows={2}
                            value={remarks}
                            onChange={(event) => setRemarks(event.target.value)}
                            placeholder='Add a note for the record...'
                            className='w-full mt-2 text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF] resize-none'
                        />
                    </div>
                </div>

                <div className='flex justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7]'>
                    <button
                        type='button'
                        onClick={() => onDecide?.('rejected', remarks)}
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#FF5722] border border-[#FF5722] px-4 py-2 rounded-md hover:bg-[#FF5722] hover:text-white transition-colors cursor-pointer'
                    >
                        <XCircle size={16} />
                        Reject
                    </button>
                    <button
                        type='button'
                        onClick={() => onDecide?.('approved', remarks)}
                        className='inline-flex items-center gap-2 bg-[#4CAF50] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Check size={16} />
                        Approve
                    </button>
                </div>
            </div>
        </div>
    )
}

const parseAmount = (value) => {
    const digits = String(value ?? '').replace(/[^\d.]/g, '')
    return Number(digits) || 0
}

const formatInr = (amount) => {
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount)
    } catch {
        return `₹${amount}`
    }
}

const PendingTab = () => {
    const { approvals, decideApproval, syncTransportOpsIntoFinance } = useFinance()
    const [reviewRequest, setReviewRequest] = useState(null)
    const [busyId, setBusyId] = useState('')

    useEffect(() => {
        syncTransportOpsIntoFinance?.().catch(() => {})
        // Mount-only: sync is throttled inside FinanceContext.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional once on open
    }, [])

    const pending = useMemo(
        () => (approvals || []).filter((row) => !row.status || String(row.status).toLowerCase() === 'pending'),
        [approvals],
    )

    const runDecision = async (approvalId, decision, remarks = '') => {
        setBusyId(approvalId)
        try {
            const result = await decideApproval({ approvalId, decision, remarks })
            if (result?.success === false) {
                toast.error(result.message || 'Could not update approval.')
                return
            }
            toast.success(decision === 'approved' ? 'Request approved.' : 'Request rejected.')
        } catch (err) {
            toast.error(err?.message || 'Could not update approval.')
        } finally {
            setBusyId('')
        }
    }
    const summaryCards = useMemo(() => {
        const rows = approvals || []
        const pendingRows = rows.filter((row) => !row.status || row.status === 'Pending')
        const approvedRows = rows.filter((row) => String(row.status || '').toLowerCase() === 'approved')
        const rejectedRows = rows.filter((row) => String(row.status || '').toLowerCase() === 'rejected')
        const pendingValue = pendingRows.reduce((sum, row) => sum + parseAmount(row.amount), 0)
        const approvedValue = approvedRows.reduce((sum, row) => sum + parseAmount(row.amount), 0)
        const rejectedValue = rejectedRows.reduce((sum, row) => sum + parseAmount(row.amount), 0)
        return [
            {
                label: 'Pending Approvals',
                value: String(pendingRows.length),
                sub: `${formatInr(pendingValue)} total value`,
                subTone: 'danger',
                iconTone: 'danger',
            },
            {
                label: 'Approved (campus snapshot)',
                value: String(approvedRows.length),
                sub: `${formatInr(approvedValue)} disbursed`,
                subTone: 'success',
                iconTone: 'success',
            },
            {
                label: 'Rejected (campus snapshot)',
                value: String(rejectedRows.length),
                sub: `${formatInr(rejectedValue)} value`,
                iconTone: 'warning',
            },
            {
                label: 'Live finance SoT',
                value: 'API',
                sub: 'Live approvals only — demo APR-11xx samples are stripped',
                iconTone: 'success',
            },
        ]
    }, [approvals])

    return (
        <div className='space-y-6'>
            <SummaryCards cards={summaryCards} />

            <TableCard
                title='Pending approval requests'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <div className='relative min-w-[160px]'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input type='text' placeholder='Search request / staff...' className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2' />
                        </div>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'>
                            <option>All Departments</option>
                            <option>Transport</option>
                            <option>Academics</option>
                            <option>Admin</option>
                            <option>Facilities</option>
                        </select>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'>
                            <option>All Types</option>
                            <option>Expense Claim</option>
                            <option>Concession / Waiver</option>
                            <option>Damage Repair</option>
                            <option>Procurement</option>
                        </select>
                    </div>
                )}
                footer={<TablePagination summary={`${pending.length} pending`} />}
            >
                <table className='w-full text-sm text-left mt-4'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Request ID</th>
                            <th className={thClass}>Raised By</th>
                            <th className={thClass}>Department</th>
                            <th className={thClass}>Type</th>
                            <th className={thClass}>Amount</th>
                            <th className={thClass}>Raised On</th>
                            <th className={`${thClass} rounded-e-lg`}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pending.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg font-mono text-xs text-[#1E1E1E]`}>{row.id}</td>
                                <td className={tdClass}>
                                    <UserAvatar initials={row.initials} name={row.raisedBy} />
                                </td>
                                <td className={tdClass}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${departmentBadgeColor[row.department]}`}>
                                        {row.department}
                                    </span>
                                </td>
                                <td className={tdClass}>{row.type}</td>
                                <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount}</td>
                                <td className={tdClass}>{row.raisedOn}</td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <ApproveRejectActions
                                        disabled={busyId === row.id}
                                        onReview={row.detail ? () => setReviewRequest(row) : undefined}
                                        onApprove={() => runDecision(row.id, 'approved')}
                                        onReject={() => runDecision(row.id, 'rejected')}
                                    />
                                </td>
                            </tr>
                        ))}
                        {!pending.length && (
                            <tr>
                                <td colSpan={7} className={`${tdClass} text-center py-8 text-[#667085]`}>
                                    No pending approvals. Transport claims sync from TM / Principal when available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </TableCard>

            <ReviewRequestModal
                request={reviewRequest}
                isOpen={Boolean(reviewRequest)}
                onClose={() => setReviewRequest(null)}
                onDecide={async (decision, remarks) => {
                    if (!reviewRequest) return
                    await runDecision(reviewRequest.id, decision, remarks)
                    setReviewRequest(null)
                }}
            />
        </div>
    )
}

export default PendingTab
