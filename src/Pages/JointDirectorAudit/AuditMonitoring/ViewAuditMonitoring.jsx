import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardPen, TrendingUp, CalendarDays, MessageSquare } from 'lucide-react'
import { getAuditMonitoringById, statusBadgeColor, progressBarColor } from './auditMonitoringData'

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

const ViewAuditMonitoring = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const audit = getAuditMonitoringById(id)

    if (!audit) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director-audit/audit-monitoring')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Audit monitoring record not found or could not be loaded.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/joint-director-audit/audit-monitoring')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <p className='text-sm text-[#667085]'>
                            Audit ID: <span className='font-medium text-[#1E1E1E]'>{audit.id}</span>
                        </p>
                        <h1 className='text-2xl font-semibold text-black mt-1'>{audit.title}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{audit.department} · {audit.auditor}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap self-start ${statusBadgeColor[audit.status]}`}>
                        {audit.status}
                    </span>
                </div>
                <div className='mt-4'>
                    <div className='flex justify-between text-sm mb-1.5'>
                        <span className='text-[#808080]'>Overall progress</span>
                        <span className='font-semibold text-[#1E1E1E]'>{audit.progress}%</span>
                    </div>
                    <div className='h-2.5 bg-[#EDEEF5] rounded-full overflow-hidden'>
                        <div
                            className={`h-full rounded-full transition-all ${progressBarColor(audit.progress)}`}
                            style={{ width: `${audit.progress}%` }}
                        />
                    </div>
                </div>
            </div>

            <Section title='Audit Information' icon={ClipboardPen}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Audit Name' value={audit.title} />
                    <Field label='Department' value={audit.department} />
                    <Field label='Auditor' value={audit.auditor} />
                </div>
            </Section>

            <Section title='Progress' icon={TrendingUp}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Audit Completion %</span>
                        <div className='flex items-center gap-3 mt-1'>
                            <div className='flex-1 h-2 bg-[#EDEEF5] rounded-full overflow-hidden max-w-[160px]'>
                                <div
                                    className={`h-full rounded-full ${progressBarColor(audit.completionPercent)}`}
                                    style={{ width: `${audit.completionPercent}%` }}
                                />
                            </div>
                            <span className='text-lg font-semibold text-[#1E1E1E]'>{audit.completionPercent}%</span>
                        </div>
                    </div>
                    <Field label='Findings Count' value={audit.findingsCount} />
                    <Field label='Compliance Score' value={`${audit.complianceScore}%`} />
                </div>
            </Section>

            <Section title='Timeline' icon={CalendarDays}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Started Date' value={audit.startedDate} />
                    <Field label='Due Date' value={audit.dueDate} />
                </div>
            </Section>

            <Section title='Notes' icon={MessageSquare}>
                <div className='grid grid-cols-1 gap-6'>
                    <Field label='Auditor Comments' value={audit.auditorComments} />
                    <Field label='Escalations' value={audit.escalations} />
                </div>
            </Section>
        </section>
    )
}

export default ViewAuditMonitoring
