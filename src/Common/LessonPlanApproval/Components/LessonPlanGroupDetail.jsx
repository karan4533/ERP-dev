import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import AttachmentChip from './AttachmentChip'
import LessonPlanTemplateView from './LessonPlanTemplateView'
import MarkAsDoneConfirmModal from './MarkAsDoneConfirmModal'
import StatusBadge from './StatusBadge'
import {
    getApprovedLessonPlansBySubmitter,
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
    const routePrefix = getRoutePrefix(location.pathname)
    const variant = getVariant(location.pathname)

    const decodedTeacher = decodeURIComponent(teacherName ?? '')
    const decodedSubject = decodeURIComponent(subject ?? '')

    const [plans, setPlans] = useState([])
    const [expandedPlanId, setExpandedPlanId] = useState(null)
    const [confirmPlan, setConfirmPlan] = useState(null)

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

    const loadPlans = () => {
        let sourcePlans = []
        if (variant === 'mark-as-done') {
            sourcePlans = getApprovedLessonPlansBySubmitter(decodedTeacher)
        } else if (variant === 'director-approval') {
            sourcePlans = getLessonPlans()
        } else {
            sourcePlans = getLessonPlansBySubmitter(TEACHER_NAME)
        }

        setPlans(
            sourcePlans.filter(
                (plan) => plan.submitterName === decodedTeacher && plan.subject === decodedSubject
            )
        )
    }

    useEffect(() => {
        loadPlans()
    }, [decodedTeacher, decodedSubject, location.key, variant])

    const sortedPlans = useMemo(
        () =>
            [...plans].sort((a, b) => {
                if (a.fromDate && b.fromDate) return a.fromDate.localeCompare(b.fromDate)
                return a.id.localeCompare(b.id)
            }),
        [plans]
    )

    const refreshPlans = () => {
        loadPlans()
    }

    const handleApprove = (id) => {
        updateLessonPlanStatus(id, 'Approved')
        refreshPlans()
    }

    const handleReject = (id) => {
        updateLessonPlanStatus(id, 'Rejected')
        refreshPlans()
    }

    const handleMarkAsDoneClick = (plan) => {
        if (plan.markAsDone) return
        setConfirmPlan(plan)
    }

    const handleConfirmMarkAsDone = (remarks) => {
        if (!confirmPlan) return
        markLessonPlanAsDone(confirmPlan.id, remarks)
        setConfirmPlan(null)
        refreshPlans()
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

            <div className='bg-white rounded-2xl shadow-md p-5'>
                <p className='text-sm font-semibold uppercase tracking-wide text-[#515DEF]'>{pageTitle}</p>
                <h1 className='text-2xl font-semibold text-[#313131] mt-2'>
                    {decodedTeacher} · {decodedSubject}
                </h1>
                <p className='text-base text-[#667085] mt-2'>
                    {sortedPlans.length} lesson plan{sortedPlans.length === 1 ? '' : 's'} in this group
                </p>
            </div>

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
                                                    onClick={() => handleApprove(plan.id)}
                                                    className='bg-[#4CAF50] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => handleReject(plan.id)}
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
        </section>
    )
}

export default LessonPlanGroupDetail
