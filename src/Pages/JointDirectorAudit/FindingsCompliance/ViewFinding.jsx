import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    FileWarning,
    User,
    ShieldCheck,
    Wrench,
    CheckCircle2,
} from 'lucide-react'
import {
    getFindingById,
    severityBadgeColor,
    statusBadgeColor,
    complianceBadgeColor,
} from './findingsComplianceData'

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

const ViewFinding = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const finding = getFindingById(id)

    if (!finding) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director-audit/findings-compliance')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Finding not found or could not be loaded.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/joint-director-audit/findings-compliance')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                    <div>
                        <p className='text-sm text-[#667085]'>
                            Finding ID: <span className='font-medium text-[#1E1E1E]'>{finding.id}</span>
                            {' · '}
                            Audit: <span className='font-medium text-[#1E1E1E]'>{finding.auditId}</span>
                        </p>
                        <h1 className='text-2xl font-semibold text-black mt-1'>{finding.title}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{finding.department} · {finding.auditTitle}</p>
                    </div>
                    <div className='flex flex-wrap gap-2 self-start'>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${severityBadgeColor[finding.severity]}`}>
                            {finding.severity}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[finding.status]}`}>
                            {finding.status}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${complianceBadgeColor[finding.complianceStatus]}`}>
                            {finding.complianceStatus}
                        </span>
                    </div>
                </div>
            </div>

            <Section title='Finding Details' icon={FileWarning}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Finding ID' value={finding.id} />
                    <Field label='Audit ID' value={finding.auditId} />
                    <Field label='Department' value={finding.department} />
                    <Field label='Finding Title' value={finding.title} />
                    <Field label='Severity' value={finding.severity} />
                    <Field label='Status' value={finding.status} />
                    <Field label='Compliance Status' value={finding.complianceStatus} />
                    <div className='lg:col-span-3'>
                        <Field label='Observation' value={finding.observation} />
                    </div>
                </div>
            </Section>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Section title='Ownership & Timeline' icon={User}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                        <Field label='Responsible Person' value={finding.responsiblePerson} />
                        <Field label='Raised Date' value={finding.raisedDate} />
                        <Field label='Due Date' value={finding.dueDate} />
                        <Field label='Related Audit' value={finding.auditTitle} />
                    </div>
                </Section>

                <Section title='Compliance' icon={ShieldCheck}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                        <Field label='Compliance Status' value={finding.complianceStatus} />
                        <Field label='Finding Status' value={finding.status} />
                    </div>
                </Section>
            </div>

            <Section title='Corrective Action' icon={Wrench}>
                <div className='grid grid-cols-1 gap-6'>
                    <Field label='Required Corrective Action' value={finding.correctiveAction} />
                    <Field label='Action Taken' value={finding.actionTaken} />
                </div>
            </Section>

            <Section title='Closure' icon={CheckCircle2}>
                <Field label='Closure Notes' value={finding.closureNotes} />
            </Section>
        </section>
    )
}

export default ViewFinding
