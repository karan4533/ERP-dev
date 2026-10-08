import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ObservationForm from '../../Observations/Components/ObservationForm'
import ObservationTimeline from '../../Observations/Components/ObservationTimeline'
import { getObservationById, priorityBadgeColor, statusBadgeColor } from '../../Observations/observationsData'
import { getRcaByObservationId, statusBadgeColor as rcaStatusBadgeColor } from '../../CorrectiveActions/RootCauseAnalysis/rcaData'
import { RcaDetailsSection, RcaEvidencePanel, ApprovalTimeline } from '../../CorrectiveActions/RootCauseAnalysis/Components/RcaSections'
import { getAtrByObservationId, statusBadgeColor as atrStatusBadgeColor } from '../../CorrectiveActions/ActionTakenReports/atrData'
import {
    ActionTakenDetailsSection,
    BeforeAfterEvidencePanel,
    VerificationDetailsSection,
} from '../../CorrectiveActions/ActionTakenReports/Components/AtrSections'

const SECTIONS = ['Observation', 'RCA', 'ATR', 'Timeline']

const EmptySection = ({ message }) => (
    <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085] text-sm'>
        {message}
    </div>
)

const ViewObservationReport = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [activeSection, setActiveSection] = useState('Observation')
    const record = getObservationById(id)
    const rca = record ? getRcaByObservationId(record.observationId) : null
    const atr = record ? getAtrByObservationId(record.observationId) : null

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/quality-auditor/reports/observation-reports')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Observation report not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/quality-auditor/reports/observation-reports')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to Observation Reports
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                        <p className='text-sm font-medium text-[#515DEF]'>{record.observationId}</p>
                        <h1 className='text-2xl font-semibold text-black mt-1'>Observation Report View</h1>
                        <p className='text-sm text-[#667085] mt-1'>{record.title}</p>
                        <p className='text-sm text-[#667085]'>Audit: {record.auditReference} · {record.department}</p>
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
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#EDEEF5]'>
                    {[
                        ['Assigned To', record.assignTo || record.responsiblePerson],
                        ['Report To', record.reportTo || '—'],
                        ['Created On', `${record.createdDate} · ${record.createdTime}`],
                        ['Due Date', record.dueDate],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <p className='text-xs font-medium text-[#808080]'>{label}</p>
                            <p className='text-sm text-[#1E1E1E] mt-0.5'>{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className='flex flex-wrap gap-2'>
                {SECTIONS.map((section) => (
                    <button
                        key={section}
                        type='button'
                        onClick={() => setActiveSection(section)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            activeSection === section
                                ? 'bg-[#515DEF] text-white'
                                : 'bg-white text-[#667085] border border-[#D9D9D9] hover:border-[#515DEF]'
                        }`}
                    >
                        {section}
                    </button>
                ))}
            </div>

            {activeSection === 'Observation' && (
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h3 className='text-base font-semibold text-black mb-4'>Observation Details</h3>
                    <ObservationForm form={record} readOnly />
                </div>
            )}

            {activeSection === 'RCA' && (
                rca ? (
                    <div className='space-y-6'>
                        <div className='bg-white rounded-2xl shadow-md p-4'>
                            <div className='flex flex-wrap items-center justify-between gap-2 mb-4'>
                                <h3 className='text-base font-semibold text-black'>Root Cause Analysis</h3>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${rcaStatusBadgeColor[rca.status]}`}>
                                    {rca.status}
                                </span>
                            </div>
                            <p className='text-sm text-[#667085]'>
                                Submitted by {rca.submittedBy} on {rca.submittedOn} · {rca.submittedOnTime}
                            </p>
                        </div>
                        <RcaDetailsSection rca={rca.rca} />
                        <RcaEvidencePanel evidence={rca.evidence} />
                        <ApprovalTimeline
                            timeline={rca.approvalTimeline}
                            finalStatus={rca.finalStatus}
                            statusBadgeColor={rcaStatusBadgeColor}
                        />
                    </div>
                ) : (
                    <EmptySection message='No root cause analysis submitted for this observation yet.' />
                )
            )}

            {activeSection === 'ATR' && (
                atr ? (
                    <div className='space-y-6'>
                        <div className='bg-white rounded-2xl shadow-md p-4'>
                            <div className='flex flex-wrap items-center justify-between gap-2 mb-4'>
                                <h3 className='text-base font-semibold text-black'>Action Taken Report — {atr.atrNumber}</h3>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${atrStatusBadgeColor[atr.status]}`}>
                                    {atr.status}
                                </span>
                            </div>
                            <p className='text-sm text-[#667085]'>
                                Submitted by {atr.submittedBy} on {atr.submittedOn} · {atr.submittedOnTime}
                            </p>
                        </div>
                        <ActionTakenDetailsSection actionTaken={atr.actionTaken} />
                        <BeforeAfterEvidencePanel evidence={atr.evidence} />
                        <VerificationDetailsSection verification={atr.verification} />
                    </div>
                ) : (
                    <EmptySection message='No action taken report submitted for this observation yet.' />
                )
            )}

            {activeSection === 'Timeline' && (
                <ObservationTimeline timeline={record.timeline} />
            )}
        </section>
    )
}

export default ViewObservationReport
