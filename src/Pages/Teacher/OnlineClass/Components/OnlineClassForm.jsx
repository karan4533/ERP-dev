import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    formatOnlineClassDate,
    getClasses,
    getSections,
    getSubjects,
    MEETING_PLATFORMS,
    ONLINE_CLASS_STATUSES,
} from '../onlineClassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = String(value).split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const OnlineClassForm = ({
    record,
    formId = 'online-class-form',
    onSubmit,
    classOptions,
    sectionOptions,
    subjectOptions,
    readOnly = false,
}) => {
    const classes = classOptions?.length ? classOptions : getClasses()
    const sections = sectionOptions?.length ? sectionOptions : getSections()
    const subjects = subjectOptions?.length ? subjectOptions : getSubjects()
    const [formState, setFormState] = useState(() => ({
        subject: record?.subject ?? '',
        className: record?.className ?? '',
        section: record?.section ?? '',
        topic: record?.topic ?? '',
        date: parseDate(record?.date),
        startTime: record?.startTime ?? '',
        endTime: record?.endTime ?? '',
        meetingPlatform: record?.meetingPlatform ?? '',
        meetingLink: record?.meetingLink ?? '',
        status: record?.status ?? 'Scheduled',
    }))

    useEffect(() => {
        if (!record) return
        setFormState({
            subject: record.subject ?? '',
            className: record.className ?? '',
            section: record.section ?? '',
            topic: record.topic ?? '',
            date: parseDate(record.date),
            startTime: record.startTime ?? '',
            endTime: record.endTime ?? '',
            meetingPlatform: record.meetingPlatform ?? '',
            meetingLink: record.meetingLink ?? '',
            status: record.status ?? 'Scheduled',
        })
    }, [record])

    const update = (key, value) => setFormState((current) => ({ ...current, [key]: value }))

    const handleSubmit = (event) => {
        event.preventDefault()
        if (readOnly || typeof onSubmit !== 'function') return
        onSubmit({
            ...formState,
            subject: formState.subject.trim(),
            className: formState.className.trim(),
            section: formState.section.trim(),
            topic: formState.topic.trim(),
            date: formatOnlineClassDate(formState.date),
            startTime: formState.startTime.trim(),
            endTime: formState.endTime.trim(),
            meetingPlatform: formState.meetingPlatform.trim(),
            meetingLink: formState.meetingLink.trim(),
            status: formState.status || 'Scheduled',
        })
    }

    return (
        <form id={formId} onSubmit={handleSubmit} className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                <select id='subject' value={formState.subject} disabled={readOnly} onChange={(e) => update('subject', e.target.value)} className={selectClass} required>
                    <option value=''>--Select--</option>
                    {subjects.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='class-name' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                <select id='class-name' value={formState.className} disabled={readOnly} onChange={(e) => update('className', e.target.value)} className={selectClass} required>
                    <option value=''>--Select--</option>
                    {classes.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                <select id='section' value={formState.section} disabled={readOnly} onChange={(e) => update('section', e.target.value)} className={selectClass} required>
                    <option value=''>--Select--</option>
                    {sections.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='topic' className='text-base font-medium text-[#1E1E1E]'>Topic:</label>
                <input type='text' id='topic' value={formState.topic} disabled={readOnly} onChange={(e) => update('topic', e.target.value)} placeholder='e.g. Quadratic Equations' className={inputClass} required />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={formState.date}
                        onChange={(date) => update('date', date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable={!readOnly}
                        disabled={readOnly}
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='start-time' className='text-base font-medium text-[#1E1E1E]'>Start Time:</label>
                <input type='text' id='start-time' value={formState.startTime} disabled={readOnly} onChange={(e) => update('startTime', e.target.value)} placeholder='e.g. 09:00 AM' className={inputClass} required />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='end-time' className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                <input type='text' id='end-time' value={formState.endTime} disabled={readOnly} onChange={(e) => update('endTime', e.target.value)} placeholder='e.g. 10:00 AM' className={inputClass} required />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='meeting-platform' className='text-base font-medium text-[#1E1E1E]'>Meeting Platform:</label>
                <select id='meeting-platform' value={formState.meetingPlatform} disabled={readOnly} onChange={(e) => update('meetingPlatform', e.target.value)} className={selectClass} required>
                    <option value=''>--Select--</option>
                    {MEETING_PLATFORMS.map((platform) => (
                        <option key={platform} value={platform}>{platform}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='status' className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                <select id='status' value={formState.status} disabled={readOnly} onChange={(e) => update('status', e.target.value)} className={selectClass}>
                    {ONLINE_CLASS_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='meeting-link' className='text-base font-medium text-[#1E1E1E]'>Meeting Link:</label>
                <input type='url' id='meeting-link' value={formState.meetingLink} disabled={readOnly} onChange={(e) => update('meetingLink', e.target.value)} placeholder='https://meet.google.com/...' className={inputClass} required />
            </div>
        </form>
    )
}

export default OnlineClassForm
