import React from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    ApprovalTimeline,
    RcaDetailsSection,
    RcaEvidencePanel,
} from './Components/RcaSections'
import { getRcaById, priorityBadgeColor, statusBadgeColor } from './rcaData'
import AuditReviewPanel from '../../../../Common/AuditReview/AuditReviewPanel'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-sm font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
    </div>
)

const ViewRca = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getRcaById(id)

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/quality-auditor/corrective-actions/root-cause-analysis')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Root cause analysis not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/quality-auditor/corrective-actions/root-cause-analysis')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to Root Cause Analysis
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3 mb-6'>
                    <div>
                        <p className='text-sm font-medium text-[#515DEF]'>{record.id}</p>
                        <h1 className='text-2xl font-semibold text-black mt-1'>{record.observationTitle}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            Observation:{' '}
                            <NavLink
                                to={`/quality-auditor/observations/view/${record.observationId}`}
                                className='text-[#515DEF] hover:underline'
                            >
                                {record.observationId}
                            </NavLink>
                            {' · '}
                            Audit: {record.auditNumber}
                        </p>
                    </div>
                    <div className='flex gap-2 flex-wrap'>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${priorityBadgeColor[record.priority]}`}>
                            {record.priority}
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusBadgeColor[record.status]}`}>
                            {record.status}
                        </span>
                    </div>
                </div>

                <h3 className='text-base font-semibold text-black mb-4'>Observation Context</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Observation ID' value={record.observationId} />
                    <Field label='Audit Number' value={record.auditNumber} />
                    <Field label='Audit Name' value={record.auditName} />
                    <Field label='Department' value={record.department} />
                    <Field label='Section' value={record.section} />
                    <Field label='Checklist Question' value={record.checklistQuestion} />
                    <Field label='Observation Title' value={record.observationTitle} />
                    <Field label='Assigned To' value={record.assignedTo} />
                    <Field label='Report To' value={record.reportTo} />
                    <Field label='Due Date' value={record.dueDate} />
                    <Field label='Submitted By' value={record.submittedBy} />
                    <Field label='Submitted On' value={`${record.submittedOn} · ${record.submittedOnTime}`} />
                </div>
            </div>

            <RcaDetailsSection rca={record.rca} />
            <RcaEvidencePanel evidence={record.evidence} />
            <ApprovalTimeline
                timeline={record.approvalTimeline}
                finalStatus={record.finalStatus}
                statusBadgeColor={statusBadgeColor}
            />
            <AuditReviewPanel recordId={record.id} kind="RCA" stream="QUALITY" originalSummary={record.rca?.rootCause || record.observationTitle} />
        </section>
    )
}

export default ViewRca
