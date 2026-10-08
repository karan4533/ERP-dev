import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    AuditStatisticsSection,
    ChecklistSummarySection,
    ObservationSummarySection,
    ReadOnlyTextSection,
} from './Components/AuditReportSections'
import { getAuditReportById, statusBadgeColor } from './auditReportsData'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-sm font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
    </div>
)

const ViewAuditReport = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getAuditReportById(id)

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/process-auditor/reports/audit-reports')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Audit report not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/process-auditor/reports/audit-reports')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to Audit Reports
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3 mb-6'>
                    <div>
                        <p className='text-sm font-medium text-[#515DEF]'>{record.auditNumber}</p>
                        <h1 className='text-2xl font-semibold text-black mt-1'>Audit Report View</h1>
                        <p className='text-sm text-[#667085] mt-1'>{record.auditName}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusBadgeColor[record.status]}`}>
                        {record.status}
                    </span>
                </div>

                <h3 className='text-base font-semibold text-black mb-4'>Audit Summary</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    <Field label='Audit Number' value={record.auditNumber} />
                    <Field label='Audit Name' value={record.auditName} />
                    <Field label='Department' value={record.department} />
                    <Field label='Campus' value={record.campus} />
                    <Field label='Building' value={record.building} />
                    <Field label='Auditor' value={record.auditor} />
                    <Field label='Audit Date' value={record.auditDate} />
                    <Field label='Status' value={record.status} />
                </div>
            </div>

            <AuditStatisticsSection statistics={record.statistics} />
            <ChecklistSummarySection checklistSummary={record.checklistSummary} />
            <ObservationSummarySection observationSummary={record.observationSummary} />
            <ReadOnlyTextSection title='Recommendations' content={record.recommendations} />
            <ReadOnlyTextSection title='General Remarks' content={record.generalRemarks} />
        </section>
    )
}

export default ViewAuditReport
