import React from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import EscalationForm from './Components/EscalationForm'
import { getEscalationById, priorityBadgeColor, statusBadgeColor } from './escalationsData'

const ViewEscalation = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getEscalationById(id)

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/process-auditor/corrective-actions/escalations')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Escalation not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/process-auditor/corrective-actions/escalations')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to Escalations
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3 mb-6'>
                    <div>
                        <p className='text-sm font-medium text-[#515DEF]'>{record.escalationId}</p>
                        <h1 className='text-2xl font-semibold text-black mt-1'>{record.observationTitle}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            Observation:{' '}
                            <NavLink
                                to={`/process-auditor/observations/view/${record.observationId}`}
                                className='text-[#515DEF] hover:underline'
                            >
                                {record.observationId}
                            </NavLink>
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
                <EscalationForm form={record} readOnly />
            </div>
        </section>
    )
}

export default ViewEscalation
