import React, { useMemo, useState } from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import ApprovalHistoryTimeline from '../../approvals/ApprovalHistoryTimeline'
import { ConfirmAction, IntegrationNotice, PageHeader } from '../../ui'
import { useAuth } from '../../../context/AuthContext'
import AttachmentChip from './AttachmentChip'
import LessonPlanTemplateView from './LessonPlanTemplateView'
import MarkAsDoneConfirmModal from './MarkAsDoneConfirmModal'
import StatusBadge from './StatusBadge'
import {
    getApprovedLessonPlansBySubmitter,
    getLessonPlanApprovalHistory,
    getLessonPlans,
    getLessonPlansBySubmitter,
    markLessonPlanAsDone,
    TEACHER_NAME,
    updateLessonPlanStatus,
} from '../lessonPlanApprovalData'

const getRoutePrefix = (pathname) => {
    if (pathname.startsWith('/coordinator')) return '/coordinator'
    if (pathname.startsWith('/director')) return '/director'
    return '/teacher'
}

const getVariant = (pathname) => {
    if (pathname.includes('/my-lesson-plan/group')) return 'mark-as-done'
    if (pathname.startsWith('/director')) return 'director-approval'
    return 'submissions'
}

const LessonPlanGroupDetail = () => {
    const { teacherName, subject } = useParams()
    const location = useLocation()
    const { name, email } = useAuth()
    const routePrefix = getRoutePrefix(location.pathname)
    const variant = getVariant(location.pathname)

    const decodedTeacher = decodeURIComponent(teacherName ?? '')
    const decodedSubject = decodeURIComponent(subject ?? '')

    const selectScopedPlans = (sourcePlans) => sourcePlans.filter(
        (plan) => plan.submitterName === decodedTeacher && plan.subject === decodedSubject
    )
    const loadScopedPlans = () => {
        if (variant === 'mark-as-done') return selectScopedPlans(getApprovedLessonPlansBySubmitter(decodedTeacher))
        if (variant === 'director-approval') return selectScopedPlans(getLessonPlans())
        return selectScopedPlans(getLessonPlansBySubmitter(TEACHER_NAME))
    }

    const [plans, setPlans] = useState(loadScopedPlans)
    const [expandedPlanId, setExpandedPlanId] = useState(null)
    const [confirmPlan, setConfirmPlan] = useState(null)
    const [decision, setDecision] = useState(null)
    const [decisionRemarks, setDecisionRemarks] = useState('')

    const listBackPath =
        variant === 'mark-as-done'
            ? `${routePrefix}/lesson-plan/my-lesson-plan`
            : `${routePrefix}/lesson-plan-approval`

    const pageTitle =
        variant === 'mark-as-done'
            ? 'My Lesson Plan'
            : variant === 'director-approval'
              ? 'Lesson Plan Review'
              : 'Lesson Plans'

    const sortedPlans = useMemo(
        () =>
            [...plans].sort((a, b) => {
                if (a.fromDate && b.fromDate) return a.fromDate.localeCompare(b.fromDate)
                return a.id.localeCompare(b.id)
            }),
        [plans]
    )

    const openDecision = (plan, type) => {
        setDecision({ plan, type })
        setDecisionRemarks('')
    }

    const closeDecision = () => {
        setDecision(null)
        setDecisionRemarks('')
    }

    const handleDecision = () => {
        if (!decision) return
        if (decision.type === 'reject' && !decisionRemarks.trim()) return
        const updated = updateLessonPlanStatus(decision.plan.id, decision.type === 'approve' ? 'Approved' : 'Rejected', {
            actor: name || email || 'Director',
            actorRole: 'Director',
            remarks: decisionRemarks.trim(),
        })
        setPlans(selectScopedPlans(updated))
        closeDecision()
    }

    const handleMarkAsDoneClick = (plan) => {
        if (plan.markAsDone) return
        setConfirmPlan(plan)
    }

    const handleConfirmMarkAsDone = (remarks) => {
        if (!confirmPlan) return
        const updated = markLessonPlanAsDone(confirmPlan.id, remarks)
        setPlans(selectScopedPlans(updated))
        setConfirmPlan(null)
    }

    const togglePlanDetails = (planId) => {
        setExpandedPlanId((current) => (current === planId ? null : planId))
    }

    if (!decodedTeacher || !decodedSubject) {
        return (
            <section className='space-y-6'>
                <p className='text-[#667085]'>Invalid lesson plan group.</p>
                <NavLink to={listBackPath} className='text-[#515DEF] hover:underline'>
                    Back to list
                </NavLink>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <NavLink
                to={listBackPath}
                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors'
            >
                <ArrowLeft size={16} />
                Back
            </NavLink>

            <PageHeader
                title={pageTitle}
                description={`${decodedTeacher} · ${decodedSubject}`}
                context={`${sortedPlans.length} lesson plan${sortedPlans.length === 1 ? '' : 's'} in this group`}
            />

            {variant === 'director-approval' ? (
                <IntegrationNotice
                    state='demo'
                    title='Local lesson-plan approval queue'
                    description='Decision history is stored in this browser. Production requires immutable academic API events, reviewer permissions, notifications and versioned lesson-plan content.'
                />
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
                <h2 className='text-xl font-medium text-black'>Lesson Plans</h2>

                {sortedPlans.length === 0 ? (
                    <p className='text-center text-[#667085] py-8'>No lesson plans found in this group.</p>
                ) : (
                    sortedPlans.map((plan, index) => {
                        const isExpanded = expandedPlanId === plan.id
                        const planTitle = plan.title?.trim() || `Lesson Plan ${index + 1}`

                        return (
                            <div
                                key={plan.id}
                                className='border border-[#E8ECFF] rounded-xl p-4 hover:border-[#515DEF]/40 transition-colors'
                            >
                                <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                                    <div className='flex-1 min-w-0 space-y-2'>
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <h3 className='text-lg font-semibold text-[#1E1E1E]'>{planTitle}</h3>
                                            <span className='text-xs text-[#808080]'>{plan.id}</span>
                                        </div>
                                        <p className='text-sm text-[#667085]'>
                                            From: <span className='text-[#1E1E1E]'>{plan.fromDate ?? '—'}</span>
                                            {' → '}
                                            To: <span className='text-[#1E1E1E]'>{plan.toDate ?? '—'}</span>
                                        </p>
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <StatusBadge status={plan.approvalStatus} type='approval' />
                                            {(variant === 'director-approval' || variant === 'mark-as-done') ? (
                                                <StatusBadge status={plan.trackStatus} type='track' />
                                            ) : null}
                                            {variant === 'mark-as-done' && plan.markAsDone ? (
                                                <StatusBadge status='Done' type='done' />
                                            ) : null}
                                        </div>
                                        {!isExpanded ? (
                                            <p className='text-sm text-[#667085] line-clamp-2'>{plan.description}</p>
                                        ) : null}
                                    </div>

                                    <div className='flex flex-wrap items-center gap-3 shrink-0'>
                                        {variant === 'director-approval' && plan.approvalStatus === 'Pending' ? (
                                            <>
                                                <button
                                                    type='button'
                                                    onClick={() => openDecision(plan, 'approve')}
                                                    className='bg-[#4CAF50] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => openDecision(plan, 'reject')}
                                                    className='bg-white text-[#FF0000] text-sm px-4 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all cursor-pointer'
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : null}

                                        <button
                                            type='button'
                                            onClick={() => togglePlanDetails(plan.id)}
                                            className='inline-flex items-center gap-1 text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'
                                        >
                                            {isExpanded ? 'Hide' : 'View'}
                                            <ChevronRight size={16} className={isExpanded ? 'rotate-90' : ''} />
                                        </button>

                                        {variant === 'mark-as-done' ? (
                                            <label className={`inline-flex items-center gap-2 ${plan.markAsDone ? 'cursor-default' : 'cursor-pointer'}`}>
                                                <input
                                                    type='checkbox'
                                                    checked={Boolean(plan.markAsDone)}
                                                    disabled={Boolean(plan.markAsDone)}
                                                    onChange={() => handleMarkAsDoneClick(plan)}
                                                    className='size-4 accent-[#515DEF] cursor-pointer disabled:cursor-default'
                                                />
                                                <span className='text-sm text-[#1E1E1E]'>
                                                    {plan.markAsDone ? 'Done' : 'Mark as Done'}
                                                </span>
                                            </label>
                                        ) : null}
                                    </div>
                                </div>

                                {isExpanded ? (
                                    <div className='mt-4 pt-4 border-t border-[#f2f4f7] space-y-3'>
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                                            <p><span className='text-[#808080]'>Submitted At:</span> <span className='text-[#1E1E1E]'>{plan.submittedAt}</span></p>
                                            <p className='flex flex-col gap-1'>
                                                <span className='text-[#808080]'>Attachment:</span>
                                                {plan.attachment ? <AttachmentChip filename={plan.attachment} /> : <span>None</span>}
                                            </p>
                                            {plan.completionRemarks ? (
                                                <p className='md:col-span-2'><span className='text-[#808080]'>Completion Remarks:</span> <span className='text-[#1E1E1E]'>{plan.completionRemarks}</span></p>
                                            ) : null}
                                        </div>
                                        <LessonPlanTemplateView plan={plan} />
                                        {variant === 'director-approval' ? <ApprovalHistoryTimeline history={getLessonPlanApprovalHistory(plan)} /> : null}
                                    </div>
                                ) : null}
                            </div>
                        )
                    })
                )}
            </div>

            <MarkAsDoneConfirmModal
                open={Boolean(confirmPlan)}
                plan={confirmPlan}
                onCancel={() => setConfirmPlan(null)}
                onConfirm={handleConfirmMarkAsDone}
            />

            <ConfirmAction
                open={Boolean(decision)}
                onClose={closeDecision}
                onConfirm={handleDecision}
                title={decision?.type === 'approve' ? 'Approve this lesson plan?' : 'Reject this lesson plan?'}
                description={decision?.type === 'approve' ? 'The plan will move into the approved teaching workflow.' : 'The plan will return to the author for revision.'}
                confirmLabel={decision?.type === 'approve' ? 'Approve plan' : 'Confirm rejection'}
                tone={decision?.type === 'reject' ? 'danger' : 'primary'}
                confirmDisabled={decision?.type === 'reject' && !decisionRemarks.trim()}
            >
                <label htmlFor='lesson-decision-remarks' className='block font-semibold text-[var(--erp-ink)]'>
                    {decision?.type === 'reject' ? 'Rejection rationale (required)' : 'Decision remarks (optional)'}
                </label>
                <textarea
                    id='lesson-decision-remarks'
                    value={decisionRemarks}
                    onChange={(event) => setDecisionRemarks(event.target.value)}
                    rows={3}
                    required={decision?.type === 'reject'}
                    placeholder={decision?.type === 'reject' ? 'Explain what the author must revise…' : 'Add an optional review note…'}
                    className='mt-2 w-full rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 text-sm text-[var(--erp-ink)]'
                />
                {decision?.type === 'reject' && !decisionRemarks.trim() ? <p className='mt-1 text-xs text-[var(--erp-red)]'>A rejection rationale is required.</p> : null}
            </ConfirmAction>
        </section>
    )
}

export default LessonPlanGroupDetail
