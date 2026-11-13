import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getOnlineClassById, statusBadgeColor } from './onlineClassData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const ViewOnlineClass = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getOnlineClassById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/class/online-class')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Online class record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <h1 className='text-2xl font-semibold text-black'>{record.onlineClassId}</h1>
                            <span className={`px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                {record.status}
                            </span>
                        </div>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{record.subject}</span>
                            {' · '}
                            <span>Class {record.className}-{record.section}</span>
                            {' · '}
                            <span>{record.date}</span>
                        </p>
                    </div>

                    <Section title='Online Class Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Subject' value={record.subject} />
                            <Field label='Class' value={record.className} />
                            <Field label='Section' value={record.section} />
                            <Field label='Topic' value={record.topic} />
                            <Field label='Date' value={record.date} />
                            <Field label='Start Time' value={record.startTime} />
                            <Field label='End Time' value={record.endTime} />
                            <Field label='Meeting Platform' value={record.meetingPlatform} />
                            <Field label='Meeting Link' value={record.meetingLink} />
                            <Field label='Status' value={record.status} />
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewOnlineClass
