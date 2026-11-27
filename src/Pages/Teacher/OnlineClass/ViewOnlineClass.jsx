import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getOnlineClassById, hydrateOnlineClassesFromApi, statusBadgeColor } from './onlineClassData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

const ViewOnlineClass = ({ listPath = '/teacher/class/online-class' }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [ready, setReady] = useState(false)
    const [record, setRecord] = useState(() => getOnlineClassById(id))

    useEffect(() => {
        let cancelled = false
        hydrateOnlineClassesFromApi().finally(() => {
            if (cancelled) return
            setRecord(getOnlineClassById(id))
            setReady(true)
        })
        return () => {
            cancelled = true
        }
    }, [id])

    if (!ready) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-sm text-[#667085]'>Loading online class…</p>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(listPath)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Online class not found.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{record.onlineClassId}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{record.subject}</span>
                            {' · '}
                            <span>{record.className}-{record.section}</span>
                            {' · '}
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[record.status] || ''}`}>
                                {record.status}
                            </span>
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
