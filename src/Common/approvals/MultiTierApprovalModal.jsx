import React, { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck, X, FileText } from 'lucide-react'
import ApprovalHistoryTimeline from './ApprovalHistoryTimeline'
import { getCurrentTierInfo } from './approvalEngine'

export default function MultiTierApprovalModal({
    isOpen,
    onClose,
    workflowType,
    entity,
    onConfirmDecision,
    currentUserRole,
    currentUserName
}) {
    const [decision, setDecision] = useState('Approved')
    const [remarks, setRemarks] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    if (!isOpen || !entity) return null

    const tierInfo = getCurrentTierInfo(workflowType, entity.status || entity.approvalStatus)
    const isDeclineWorkflow = workflowType === 'AUDIT_RCA_ATR'
    const isDSRWorkflow = workflowType === 'EMPLOYEE_DAILY_ACTIVITY'

    const approveLabel = isDeclineWorkflow ? 'Accept ATR' : isDSRWorkflow ? 'Sign-Off Activity' : 'Approve'
    const rejectLabel = isDeclineWorkflow ? 'Decline ATR' : isDSRWorkflow ? 'Request Revision' : 'Reject'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')

        if (decision !== 'Approved' && !remarks.trim()) {
            setErrorMsg('A detailed remark/rationale is strictly required when declining or requesting revision.')
            return
        }

        try {
            setIsSubmitting(true)
            await onConfirmDecision({
                decision,
                remarks: remarks.trim(),
                actor: currentUserName,
                actorRole: currentUserRole
            })
            onClose()
        } catch (err) {
            setErrorMsg(err.message || 'Failed to record decision.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn font-inter'>
            <div className='relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden'>
                {/* Header */}
                <div className='flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80'>
                    <div className='flex items-center gap-3'>
                        <div className='flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs'>
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 className='text-base font-bold text-slate-800'>
                                {tierInfo ? `Tier ${tierInfo.tierNumber}: ${tierInfo.name}` : 'Review & Authorization'}
                            </h2>
                            <p className='text-xs text-slate-500'>
                                Ref ID: <span className='font-mono font-semibold text-slate-700'>{entity.id}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition'
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className='p-6 space-y-5'>
                    {errorMsg && (
                        <div className='flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700'>
                            <AlertCircle size={16} className='shrink-0' />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Entity Details Card */}
                    <div className='rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2'>
                        <div className='flex items-center justify-between text-xs text-slate-500'>
                            <span>Title / Subject:</span>
                            <span className='font-semibold text-slate-700'>{entity.title || entity.eventName || entity.activityTitle || entity.subject || 'Record'}</span>
                        </div>
                        {entity.submittedBy && (
                            <div className='flex items-center justify-between text-xs text-slate-500'>
                                <span>Submitted By:</span>
                                <span className='font-medium text-slate-700'>{entity.submittedBy || entity.employeeName}</span>
                            </div>
                        )}
                        <div className='flex items-center justify-between text-xs text-slate-500'>
                            <span>Current Workflow Stage:</span>
                            <span className='inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200'>
                                {entity.status || entity.approvalStatus}
                            </span>
                        </div>
                    </div>

                    {/* Decision Selector */}
                    <div>
                        <label className='block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2'>
                            Select Formal Decision
                        </label>
                        <div className='grid grid-cols-2 gap-3'>
                            <button
                                type='button'
                                onClick={() => setDecision('Approved')}
                                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                                    decision === 'Approved'
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <CheckCircle2 size={18} className='text-emerald-600' />
                                <span>{approveLabel}</span>
                            </button>
                            <button
                                type='button'
                                onClick={() => setDecision(isDeclineWorkflow ? 'Declined' : isDSRWorkflow ? 'Needs Revision' : 'Rejected')}
                                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                                    decision !== 'Approved'
                                        ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <XCircle size={18} className='text-rose-600' />
                                <span>{rejectLabel}</span>
                            </button>
                        </div>
                    </div>

                    {/* Remarks Input */}
                    <div>
                        <label className='block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1'>
                            Remarks / Review Observations {decision !== 'Approved' && <span className='text-rose-600'>* (Mandatory)</span>}
                        </label>
                        <textarea
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder={decision === 'Approved' ? 'Enter sign-off comments or compliance endorsements...' : 'State specific grounds or remediation requirements...'}
                            className='w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition'
                        />
                    </div>

                    {/* Existing History */}
                    {entity.approvalHistory && entity.approvalHistory.length > 0 && (
                        <div className='pt-2'>
                            <ApprovalHistoryTimeline history={entity.approvalHistory} title='Prior Tier Decisions' />
                        </div>
                    )}

                    {/* Modal Footer Actions */}
                    <div className='flex items-center justify-end gap-3 pt-3 border-t border-slate-100'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 ${
                                decision === 'Approved'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                        >
                            {isSubmitting ? 'Recording...' : 'Commit Authorization'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

