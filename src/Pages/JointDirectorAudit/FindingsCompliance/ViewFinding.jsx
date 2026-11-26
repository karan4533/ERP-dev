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
import { IntegrationNotice, StatusBadge } from '../../../Common/ui'
import { getFindingLifecycle } from '../../../Common/AuditGovernance/auditGovernanceState'
import {
    getFindingById,
    severityBadgeColor,
    statusBadgeColor,
    complianceBadgeColor,
} from './findingsComplianceData'

const Section = ({ title, icon, children }) => (
    <div className='bg-white rounded-2xl shadow-sm border border-[#EEF0F6] overflow-hidden'>
        <div className='flex items-center gap-3 px-6 py-4 border-b border-[#EEF0F6] bg-linear-to-r from-[#F8F9FF] to-white'>
            <div className='p-2.5 rounded-xl bg-[#515DEF]/10'>
                {React.createElement(icon, { className: 'w-5 h-5 text-[#515DEF]', 'aria-hidden': true })}
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
    const lifecycle = finding ? getFindingLifecycle(finding) : []

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

            <IntegrationNotice
                state='demo'
                title='Governance record preview'
                description='The record below exposes the intended finding lifecycle. Evidence binaries, auditee RCA/CAPA submissions, immutable timestamps, reviewer signatures and closure approval must come from backend services.'
            />

            <div className='rounded-2xl border border-[var(--erp-line)] bg-white p-4 shadow-sm' aria-label='Finding lifecycle'>
                <p className='text-xs font-semibold uppercase tracking-[0.14em] text-[var(--erp-muted)]'>Finding lifecycle</p>
                <ol className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5'>
                    {lifecycle.map((item, index) => (
                        <li key={item.stage} className='rounded-xl border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
                            <span className='text-xs font-semibold text-[var(--erp-muted)]'>{index + 1}. {item.stage}</span>
                            <StatusBadge status={item.status} className='mt-2 w-fit' />
                        </li>
                    ))}
                </ol>
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

            <Section title='Root Cause Analysis (RCA)' icon={ShieldCheck}>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                    <Field label='RCA Status' value={finding.rcaStatus} />
                    <div className='sm:col-span-2'><Field label='Root Cause' value={finding.rootCause} /></div>
                </div>
            </Section>

            <Section title='Corrective & Preventive Action (CAPA)' icon={Wrench}>
                <div className='grid grid-cols-1 gap-6'>
                    <Field label='CAPA Status' value={finding.capaStatus} />
                    <Field label='Required Corrective Action' value={finding.correctiveAction} />
                    <Field label='Action Taken' value={finding.actionTaken} />
                </div>
            </Section>

            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <Section title='Independent Verification' icon={ShieldCheck}>
                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                        <Field label='Verification Status' value={finding.verificationStatus} />
                        <Field label='Verified By' value={finding.verifiedBy} />
                        <Field label='Verified On' value={finding.verifiedOn || 'Not verified'} />
                    </div>
                </Section>
                <Section title='Closure Authority' icon={CheckCircle2}>
                    <div className='grid grid-cols-1 gap-6'>
                        <Field label='Closure Status' value={finding.closureStatus} />
                        <Field label='Authority' value={finding.closureAuthority} />
                        <Field label='Closure Notes' value={finding.closureNotes} />
                    </div>
                </Section>
            </div>
        </section>
    )
}

export default ViewFinding
