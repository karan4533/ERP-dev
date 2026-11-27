import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { useTeacherAssignments } from '../../../../Common/Teacher/useTeacherAssignments'
import { classKeysMatch, normalizeSectionKey } from '../../../../Common/Teacher/teacherAssignedClasses'
import {
    formatExtraClassDate,
    getClasses,
    getSections,
    getSubjects,
    VENUES,
} from '../extraClassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = String(value).split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

/** Convert stored "03:30 PM" / "15:30" → HTML time input "15:30". */
const toTimeInputValue = (value) => {
    const text = String(value || '').trim()
    if (!text) return ''
    const hhmm = text.match(/^(\d{1,2}):(\d{2})$/)
    if (hhmm) {
        return `${String(Number(hhmm[1])).padStart(2, '0')}:${hhmm[2]}`
    }
    const meridiem = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!meridiem) return ''
    let hours = Number(meridiem[1])
    const minutes = meridiem[2]
    const period = meridiem[3].toUpperCase()
    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${minutes}`
}

/** Convert HTML time "15:30" → display "03:30 PM". */
const fromTimeInputValue = (value) => {
    const text = String(value || '').trim()
    const match = text.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return text
    let hours = Number(match[1])
    const minutes = match[2]
    const period = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    if (hours === 0) hours = 12
    return `${String(hours).padStart(2, '0')}:${minutes} ${period}`
}

const ExtraClassForm = ({
    record,
    formId = 'extra-class-form',
    onSubmit,
    readOnly = false,
}) => {
    const assignments = useTeacherAssignments()
    const [formState, setFormState] = useState(() => ({
        subject: record?.subject ?? '',
        className: record?.className ?? '',
        section: record?.section ?? '',
        topic: record?.topic ?? '',
        date: parseDate(record?.date),
        startTime: toTimeInputValue(record?.startTime),
        endTime: toTimeInputValue(record?.endTime),
        venue: record?.venue ?? '',
        reason: record?.reason ?? '',
    }))

    useEffect(() => {
        if (!record) return
        setFormState({
            subject: record.subject ?? '',
            className: record.className ?? '',
            section: record.section ?? '',
            topic: record.topic ?? '',
            date: parseDate(record.date),
            startTime: toTimeInputValue(record.startTime),
            endTime: toTimeInputValue(record.endTime),
            venue: record.venue ?? '',
            reason: record.reason ?? '',
        })
    }, [record])

    const classOptions = useMemo(() => {
        if (assignments.classes?.length) return assignments.classes
        return getClasses()
    }, [assignments.classes])

    const sectionOptions = useMemo(() => {
        if (!formState.className) return []
        const fromAssignments = assignments.sectionsFor?.(formState.className) || []
        if (fromAssignments.length) return fromAssignments
        return getSections()
    }, [assignments, formState.className])

    const subjectOptions = useMemo(() => {
        if (!assignments.assignments?.length) return getSubjects()
        const rows = assignments.assignments.filter((row) => {
            if (formState.className && !classKeysMatch(row.className, formState.className)) return false
            if (
                formState.section
                && row.section
                && normalizeSectionKey(row.section) !== normalizeSectionKey(formState.section)
            ) {
                return false
            }
            return Boolean(row.subject)
        })
        const subjects = [...new Set(rows.map((row) => row.subject).filter(Boolean))]
        if (subjects.length) return subjects.sort((a, b) => a.localeCompare(b))
        return assignments.subjects?.length ? assignments.subjects : getSubjects()
    }, [assignments, formState.className, formState.section])

    // Default first assigned class/section/subject once allocations load (create mode only).
    useEffect(() => {
        if (readOnly || record || !assignments.ready) return
        setFormState((current) => {
            const next = { ...current }
            let changed = false
            if (!next.className && classOptions[0]) {
                next.className = classOptions[0]
                changed = true
            }
            const sections = next.className
                ? (assignments.sectionsFor?.(next.className) || [])
                : []
            if (!next.section && sections[0]) {
                next.section = sections[0]
                changed = true
            }
            if (!next.subject && subjectOptions[0]) {
                next.subject = subjectOptions[0]
                changed = true
            }
            if (!next.venue && VENUES[0]) {
                next.venue = VENUES[0]
                changed = true
            }
            return changed ? next : current
        })
    }, [assignments.ready, assignments, classOptions, subjectOptions, readOnly, record])

    const update = (key, value) => {
        setFormState((current) => {
            const next = { ...current, [key]: value }
            if (key === 'className') {
                const nextSections = assignments.sectionsFor?.(value) || []
                next.section = nextSections.includes(current.section) ? current.section : (nextSections[0] || '')
                const nextSubjects = assignments.assignments
                    ?.filter((row) => classKeysMatch(row.className, value)
                        && (!next.section || !row.section
                            || normalizeSectionKey(row.section) === normalizeSectionKey(next.section)))
                    .map((row) => row.subject)
                    .filter(Boolean) || []
                const uniqueSubjects = [...new Set(nextSubjects)]
                if (uniqueSubjects.length && !uniqueSubjects.includes(next.subject)) {
                    next.subject = uniqueSubjects[0]
                }
            }
            if (key === 'section' && current.className) {
                const nextSubjects = assignments.assignments
                    ?.filter((row) => classKeysMatch(row.className, current.className)
                        && (!value || !row.section
                            || normalizeSectionKey(row.section) === normalizeSectionKey(value)))
                    .map((row) => row.subject)
                    .filter(Boolean) || []
                const uniqueSubjects = [...new Set(nextSubjects)]
                if (uniqueSubjects.length && !uniqueSubjects.includes(next.subject)) {
                    next.subject = uniqueSubjects[0]
                }
            }
            return next
        })
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        if (readOnly || typeof onSubmit !== 'function') return
        onSubmit({
            subject: formState.subject.trim(),
            className: formState.className.trim(),
            section: formState.section.trim(),
            topic: formState.topic.trim(),
            date: formatExtraClassDate(formState.date),
            startTime: fromTimeInputValue(formState.startTime),
            endTime: fromTimeInputValue(formState.endTime),
            venue: formState.venue.trim(),
            reason: formState.reason.trim(),
        })
    }

    return (
        <form id={formId} onSubmit={handleSubmit} className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            {assignments.emptyReason && !readOnly ? (
                <p className='text-sm text-[#E65100] sm:col-span-2 lg:col-span-3'>{assignments.emptyReason}</p>
            ) : null}
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                <select
                    id='subject'
                    value={formState.subject}
                    disabled={readOnly || !subjectOptions.length}
                    onChange={(e) => update('subject', e.target.value)}
                    className={selectClass}
                    required
                >
                    <option value=''>{subjectOptions.length ? '--Select--' : 'No assigned subjects'}</option>
                    {subjectOptions.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                    {formState.subject && !subjectOptions.includes(formState.subject) ? (
                        <option value={formState.subject}>{formState.subject}</option>
                    ) : null}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='class-name' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                <select
                    id='class-name'
                    value={formState.className}
                    disabled={readOnly || !classOptions.length}
                    onChange={(e) => update('className', e.target.value)}
                    className={selectClass}
                    required
                >
                    <option value=''>{classOptions.length ? '--Select--' : 'No assigned classes'}</option>
                    {classOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                    {formState.className && !classOptions.includes(formState.className) ? (
                        <option value={formState.className}>{formState.className}</option>
                    ) : null}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                <select
                    id='section'
                    value={formState.section}
                    disabled={readOnly || !sectionOptions.length}
                    onChange={(e) => update('section', e.target.value)}
                    className={selectClass}
                    required
                >
                    <option value=''>
                        {!formState.className
                            ? 'Select class first'
                            : sectionOptions.length
                                ? '--Select--'
                                : 'No assigned sections'}
                    </option>
                    {sectionOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                    {formState.section && !sectionOptions.includes(formState.section) ? (
                        <option value={formState.section}>{formState.section}</option>
                    ) : null}
                </select>
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='topic' className='text-base font-medium text-[#1E1E1E]'>Topic:</label>
                <input
                    type='text'
                    id='topic'
                    value={formState.topic}
                    disabled={readOnly}
                    onChange={(e) => update('topic', e.target.value)}
                    placeholder='e.g. Quadratic Equations'
                    className={inputClass}
                    required
                />
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
                <input
                    type='time'
                    id='start-time'
                    value={formState.startTime}
                    disabled={readOnly}
                    onChange={(e) => update('startTime', e.target.value)}
                    className={inputClass}
                    required
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='end-time' className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                <input
                    type='time'
                    id='end-time'
                    value={formState.endTime}
                    disabled={readOnly}
                    onChange={(e) => update('endTime', e.target.value)}
                    className={inputClass}
                    required
                    min={formState.startTime || undefined}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='venue' className='text-base font-medium text-[#1E1E1E]'>Venue:</label>
                <select
                    id='venue'
                    value={formState.venue}
                    disabled={readOnly}
                    onChange={(e) => update('venue', e.target.value)}
                    className={selectClass}
                    required
                >
                    <option value=''>--Select--</option>
                    {VENUES.map((venue) => (
                        <option key={venue} value={venue}>{venue}</option>
                    ))}
                    {formState.venue && !VENUES.includes(formState.venue) ? (
                        <option value={formState.venue}>{formState.venue}</option>
                    ) : null}
                </select>
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='reason' className='text-base font-medium text-[#1E1E1E]'>Reason:</label>
                <textarea
                    id='reason'
                    value={formState.reason}
                    disabled={readOnly}
                    onChange={(e) => update('reason', e.target.value)}
                    placeholder='Reason for scheduling extended class...'
                    className={textareaClass}
                />
            </div>
        </form>
    )
}

export default ExtraClassForm
