import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { canUseAcademicsApi } from '../../../services/academicsApi'
import { getExtraClassById, hydrateExtraClassesFromApi } from './extraClassData'

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

const ViewExtraClass = ({ listPath = '/teacher/class/extra-class' }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [record, setRecord] = useState(() => getExtraClassById(id))
    const [loading, setLoading] = useState(() => canUseAcademicsApi())
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            if (canUseAcademicsApi()) {
                setLoading(true)
                const ok = await hydrateExtraClassesFromApi({ force: true })
                if (!cancelled && !ok) setLoadError('Could not load extended classes from the campus API.')
            }
            if (!cancelled) {
                setRecord(getExtraClassById(id))
                setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [id])

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {loading ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Loading extended class…
                </div>
            ) : !record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    {loadError || 'Extended class record not found or could not be loaded.'}
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{record.extraClassId}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{record.subject}</span>
                            {' · '}
                            <span>Class {record.classSection}</span>
                            {' · '}
                            <span>{record.date}</span>
                        </p>
                    </div>

                    <Section title='Extended Class Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Subject' value={record.subject} />
                            <Field label='Class' value={record.className} />
                            <Field label='Section' value={record.section} />
                            <Field label='Topic' value={record.topic} />
                            <Field label='Date' value={record.date} />
                            <Field label='Start Time' value={record.startTime} />
                            <Field label='End Time' value={record.endTime} />
                            <Field label='Venue' value={record.venue} />
                            <Field label='Reason' value={record.reason} />
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewExtraClass
