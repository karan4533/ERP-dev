import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    LOG_TYPES,
    ROUTE_BASE,
    getActivityLogById,
    getViewFields,
    statusBadgeColor,
} from './activityLogsData'

const Field = ({ label, value, badge }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        {badge ? (
            <span className={`inline-flex self-start px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[value] ?? statusBadgeColor.Pending}`}>
                {value || '—'}
            </span>
        ) : (
            <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
        )}
    </div>
)

const ViewActivityLog = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getActivityLogById(id)
    const config = record ? LOG_TYPES[record.logType] : null

    if (!record || !config) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(`${ROUTE_BASE}/login-history`)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to logs
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Activity log not found.</div>
            </section>
        )
    }

    const fields = getViewFields(record)

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(config.route)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to {config.label}
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-[#515DEF]'>{config.label}</p>
                <h1 className='text-2xl font-semibold text-black mt-2'>Activity Log Details</h1>
                <p className='text-sm text-[#667085] mt-1'>{record.timestamp}</p>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black mb-6'>Log information</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {fields.map((field) => (
                        <Field key={field.label} label={field.label} value={field.value} badge={field.badge} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ViewActivityLog
