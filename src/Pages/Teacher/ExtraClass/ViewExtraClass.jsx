import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Check } from 'lucide-react'
import { getExtraClassById, updateExtraClassStatus } from './extraClassData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap break-words'>
            {value || '—'}
        </span>
    </div>
)

const ViewExtraClass = ({ listPath = null }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const resolvedListPath = listPath || (
        location.pathname.startsWith('/principal')
            ? '/principal/class/extra-class'
            : location.pathname.startsWith('/coordinator')
                ? '/coordinator/class/extra-class'
                : '/teacher/class/extra-class'
    )

    const [record, setRecord] = useState(() => getExtraClassById(id))
    const [isConducting, setIsConducting] = useState(false)
    const [notes, setNotes] = useState('')

    const handleConduct = (e) => {
        e.preventDefault()
        if (!record) return
        updateExtraClassStatus(record.id, 'Received & Conducted', notes)
        setRecord(getExtraClassById(id))
        setIsConducting(false)
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(resolvedListPath)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>

                {record && record.status !== 'Received & Conducted' && !isConducting && (
                    <button
                        type='button'
                        onClick={() => setIsConducting(true)}
                        className='inline-flex items-center gap-2 text-sm bg-emerald-600 text-white rounded-md px-4 py-2 hover:bg-emerald-700 transition-colors cursor-pointer font-semibold shadow-xs'
                    >
                        <CheckCircle2 size={16} />
                        Receive & Conduct Class
                    </button>
                )}
            </div>

            {isConducting && (
                <div className='bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3'>
                    <h3 className='text-sm font-bold text-emerald-900 flex items-center gap-2'>
                        <CheckCircle2 size={18} className='text-emerald-600' />
                        Confirm Class Delivery & Record Session Notes
                    </h3>
                    <form onSubmit={handleConduct} className='space-y-3'>
                        <textarea
                            rows={3}
                            required
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder='Enter session summary, attendance highlights, topics covered...'
                            className='w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white focus:outline-emerald-600'
                        />
                        <div className='flex justify-end gap-2'>
                            <button
                                type='button'
                                onClick={() => setIsConducting(false)}
                                className='px-4 py-1.5 text-xs text-slate-600 hover:bg-white rounded-lg'
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                className='px-4 py-1.5 text-xs bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700'
                            >
                                Save & Mark Conducted
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Extended class record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div>
                            <h1 className='text-2xl font-semibold text-black'>{record.extraClassId}</h1>
                            <p className='text-sm text-[#667085] mt-1'>
                                <span className='font-medium text-[#1E1E1E]'>{record.subject}</span>
                                {' · '}
                                <span>Class {record.classSection}</span>
                                {' · '}
                                <span>{record.date}</span>
                            </p>
                        </div>
                        <div>
                            {record.status === 'Received & Conducted' ? (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300'>
                                    <Check size={14} />
                                    Received &amp; Conducted
                                </span>
                            ) : (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300'>
                                    <Clock size={14} />
                                    Scheduled
                                </span>
                            )}
                        </div>
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
                            <Field label='Status' value={record.status || 'Scheduled'} />
                            <div className='sm:col-span-2 lg:col-span-3'>
                                <Field label='Reason / Objectives' value={record.reason} />
                            </div>
                            {record.sessionNotes && (
                                <div className='sm:col-span-2 lg:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200'>
                                    <Field label='Conducted Session Notes' value={record.sessionNotes} />
                                </div>
                            )}
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewExtraClass
