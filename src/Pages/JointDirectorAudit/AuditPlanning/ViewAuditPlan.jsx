import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardPen, Users, CalendarDays, Target, Flag } from 'lucide-react'
import {
    getAuditPlanById,
    priorityBadgeColor,
    statusBadgeColor,
    auditTypeBadgeColor,
} from './auditPlanningData'

const Section = ({ title, icon: Icon, children }) => (
    <div className='bg-white rounded-2xl shadow-sm border border-[#EEF0F6] overflow-hidden'>
        <div className='flex items-center gap-3 px-6 py-4 border-b border-[#EEF0F6] bg-linear-to-r from-[#F8F9FF] to-white'>
            <div className='p-2.5 rounded-xl bg-[#515DEF]/10'>
                <Icon className='w-5 h-5 text-[#515DEF]' />
            </div>
            <h2 className='text-lg font-semibold text-[#0C1E5B]'>{title}</h2>
        </div>
        <div className='p-6'>{children}</div>
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const ViewAuditPlan = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const plan = getAuditPlanById(id)

    if (!plan) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director-audit/audit-planning')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Audit plan not found or could not be loaded.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director-audit/audit-planning')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <button
                    type='button'
                    onClick={() => navigate(`/joint-director-audit/audit-planning/edit/${plan.id}`)}
                    className='bg-[#515DEF] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer'
                >
                    Edit Audit Plan
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <div className='flex flex-wrap items-center gap-2 mb-2'>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${auditTypeBadgeColor[plan.auditType]}`}>
                                {plan.auditType}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${priorityBadgeColor[plan.priority]}`}>
                                {plan.priority}
                            </span>
                        </div>
                        <h1 className='text-2xl font-semibold text-black'>{plan.title}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            Audit ID: <span className='font-medium text-[#1E1E1E]'>{plan.id}</span>
                            {' · '}
                            {plan.department}
                        </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap self-start ${statusBadgeColor[plan.status]}`}>
                        {plan.status}
                    </span>
                </div>
            </div>

            <Section title='Audit Information' icon={ClipboardPen}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Audit ID' value={plan.id} />
                    <Field label='Audit Title' value={plan.title} />
                    <Field label='Audit Type' value={plan.auditType} />
                    <Field label='Department' value={plan.department} />
                </div>
            </Section>

            <Section title='Assignment' icon={Users}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Assigned Auditor' value={plan.assignedAuditor} />
                    <div className='lg:col-span-2'>
                        <Field label='Audit Team' value={plan.auditTeam} />
                    </div>
                </div>
            </Section>

            <Section title='Schedule' icon={CalendarDays}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Planned Date' value={plan.plannedDate} />
                    <Field label='Expected Completion Date' value={plan.expectedCompletionDate} />
                    <Field label='Scheduled Date' value={plan.scheduledDate} />
                </div>
            </Section>

            <Section title='Scope' icon={Target}>
                <div className='grid grid-cols-1 gap-6'>
                    <Field label='Audit Scope' value={plan.auditScope} />
                    <Field label='Objectives' value={plan.objectives} />
                    <Field label='Checklist Reference' value={plan.checklistReference} />
                </div>
            </Section>

            <Section title='Priority' icon={Flag}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Priority Level' value={plan.priority} />
                    <Field label='Status' value={plan.status} />
                </div>
            </Section>
        </section>
    )
}

export default ViewAuditPlan
