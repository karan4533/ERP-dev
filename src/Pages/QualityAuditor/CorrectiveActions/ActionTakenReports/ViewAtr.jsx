import React from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    ActionTakenDetailsSection,
    BeforeAfterEvidencePanel,
    VerificationDetailsSection,
    AtrStatusTimeline,
} from './Components/AtrSections'
import { getAtrById, statusBadgeColor } from './atrData'
import AuditReviewPanel from '../../../../Common/AuditReview/AuditReviewPanel'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-sm font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
    </div>
)

const ViewAtr = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getAtrById(id)

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/quality-auditor/corrective-actions/action-taken-reports')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Action taken report not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/quality-auditor/corrective-actions/action-taken-reports')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to Action Taken Reports
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3 mb-6'>
                    <div>
                        <p className='text-sm font-medium text-[#515DEF]'>{record.atrNumber}</p>
                        <h1 className='text-2xl font-semibold text-black mt-1'>Action Taken Report</h1>
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
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusBadgeColor[record.status]}`}>
                        {record.status}
                    </span>
                </div>

                <h3 className='text-base font-semibold text-black mb-4'>Header Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='ATR Number' value={record.atrNumber} />
                    <Field label='Observation ID' value={record.observationId} />
                    <Field label='Audit Number' value={record.auditNumber} />
                    <Field label='Department' value={record.department} />
                    <Field label='Assigned To' value={record.assignedTo} />
                    <Field label='Report To' value={record.reportTo} />
                    <Field label='Submitted By' value={record.submittedBy} />
                    <Field label='Submitted On' value={`${record.submittedOn} · ${record.submittedOnTime}`} />
                </div>
            </div>

            <ActionTakenDetailsSection actionTaken={record.actionTaken} />
            <BeforeAfterEvidencePanel evidence={record.evidence} />
            <VerificationDetailsSection verification={record.verification} />
            <AtrStatusTimeline timeline={record.statusTimeline} />
            <AuditReviewPanel recordId={record.id} kind="ATR" stream="QUALITY" originalSummary={record.actionTaken?.description || record.observationTitle} />
        </section>
    )
}

export default ViewAtr
