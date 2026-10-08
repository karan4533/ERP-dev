import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getAuditById, priorityBadgeColor, statusBadgeColor } from './myAuditsData'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
    </div>
)

const ViewMyAudit = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getAuditById(id)

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/process-auditor/audit-management/my-audits')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Audit record not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/process-auditor/audit-management/my-audits')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{record.auditName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{record.auditId}</p>
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
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black mb-6'>Audit Details</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Audit ID' value={record.auditId} />
                    <Field label='Audit Name' value={record.auditName} />
                    <Field label='Audit Type' value={record.auditType} />
                    <Field label='Department' value={record.department} />
                    <Field label='Location' value={record.location} />
                    <Field label='Scheduled Date' value={record.scheduledDate} />
                    <Field label='Due Date' value={record.dueDate} />
                    <Field label='Priority' value={record.priority} />
                    <Field label='Status' value={record.status} />
                    <Field label='Created By' value={record.assignedBy} />
                    <Field label='Frequency' value={record.frequency} />
                </div>
            </div>
        </section>
    )
}

export default ViewMyAudit
