import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import {
    DAYS,
    applyClassToTimelineRow,
    createTimelineRow,
    getClassesForTimetableTeacher,
    getSectionsForTimetableTeacher,
    getSubjectsForTimetableTeacher,
} from '../classTimetableData'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white min-w-[7rem]'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-w-[5rem]'

const ClassTimelineEditor = ({
    timelines,
    onChange,
    readOnly = false,
    ownerTeacherId = '',
    defaultTeacher = '',
}) => {
    const { pathname } = useLocation()
    const classOptions = getClassesForTimetableTeacher(ownerTeacherId)

    const updateRow = (index, key, value) => {
        onChange(
            timelines.map((row, rowIndex) => {
                if (rowIndex !== index) return row
                if (key === 'className') {
                    return applyClassToTimelineRow(row, ownerTeacherId, value, defaultTeacher)
                }
                if (key === 'section') {
                    const subjects = getSubjectsForTimetableTeacher(ownerTeacherId, row.className, value)
                    const subject = subjects.length === 1
                        ? subjects[0]
                        : (subjects.includes(row.subject) ? row.subject : '')
                    return { ...row, section: value, subject, teacher: defaultTeacher || row.teacher }
                }
                return { ...row, [key]: value }
            }),
        )
    }

    const addRow = () => {
        const row = createTimelineRow()
        if (defaultTeacher) row.teacher = defaultTeacher
        onChange([...timelines, row])
    }

    const removeRow = (index) => {
        if (timelines.length === 1) return
        onChange(timelines.filter((_, rowIndex) => rowIndex !== index))
    }

    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <div>
                    <h3 className='text-lg font-semibold text-black'>Timetable Timelines</h3>
                    <p className='text-sm text-[#667085] mt-1'>
                        Pick the grade for each period. Section and subject map from that teacher&apos;s allocation.
                    </p>
                    {ownerTeacherId && !readOnly && getSubjectsForTimetableTeacher(ownerTeacherId).length === 0 && (
                        <p className='text-sm text-[#B54708] mt-2' role='alert'>
                            This teacher has no subjects allocated yet, so the Subject list is empty.{' '}
                            {pathname.startsWith('/principal') ? (
                                <>
                                    Allocate classes and subjects in{' '}
                                    <Link to='/principal/academic/teacher-allocation' className='underline text-[#515DEF]'>
                                        Teacher Allocation
                                    </Link>{' '}
                                    first.
                                </>
                            ) : 'Ask the Principal to allocate classes and subjects (Teacher Allocation) first.'}
                        </p>
                    )}
                </div>
                {!readOnly && (
                    <button
                        type='button'
                        onClick={addRow}
                        className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-3 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <Plus size={16} />
                        Add More
                    </button>
                )}
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Period</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Day</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teacher</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Time</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Time</th>
                            {!readOnly && (
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {timelines.map((row, index) => {
                            const sectionOptions = getSectionsForTimetableTeacher(ownerTeacherId, row.className)
                            const subjectOptions = getSubjectsForTimetableTeacher(
                                ownerTeacherId,
                                row.className,
                                row.section,
                            )
                            const sectionLocked = sectionOptions.length === 1
                            const subjectLocked = subjectOptions.length === 1

                            return (
                                <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                    <td className='px-2 py-3'>
                                        {readOnly ? (
                                            row.periodNumber || '—'
                                        ) : (
                                            <input
                                                type='number'
                                                min='1'
                                                value={row.periodNumber}
                                                onChange={(e) => updateRow(index, 'periodNumber', e.target.value)}
                                                className={inputClass}
                                                placeholder='1'
                                            />
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>
                                        {readOnly ? (
                                            row.day || '—'
                                        ) : (
                                            <select
                                                value={row.day}
                                                onChange={(e) => updateRow(index, 'day', e.target.value)}
                                                className={selectClass}
                                            >
                                                <option value=''>Select day</option>
                                                {DAYS.map((day) => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>
                                        {readOnly ? (
                                            row.className || '—'
                                        ) : (
                                            <select
                                                value={row.className}
                                                onChange={(e) => updateRow(index, 'className', e.target.value)}
                                                className={selectClass}
                                                disabled={!ownerTeacherId}
                                            >
                                                <option value=''>
                                                    {ownerTeacherId ? 'Select class' : 'Select teacher first'}
                                                </option>
                                                {classOptions.map((grade) => (
                                                    <option key={grade} value={grade}>{grade}</option>
                                                ))}
                                                {row.className && !classOptions.includes(row.className) ? (
                                                    <option value={row.className}>{row.className}</option>
                                                ) : null}
                                            </select>
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>
                                        {readOnly || sectionLocked ? (
                                            <input
                                                type='text'
                                                value={row.section || (sectionLocked ? sectionOptions[0] : '—')}
                                                readOnly
                                                className={`${inputClass} bg-[#F8F9FC]`}
                                            />
                                        ) : (
                                            <select
                                                value={row.section}
                                                onChange={(e) => updateRow(index, 'section', e.target.value)}
                                                className={selectClass}
                                                disabled={!row.className}
                                            >
                                                <option value=''>
                                                    {row.className ? 'Select section' : 'Select class first'}
                                                </option>
                                                {sectionOptions.map((section) => (
                                                    <option key={section} value={section}>{section}</option>
                                                ))}
                                                {row.section && !sectionOptions.includes(row.section) ? (
                                                    <option value={row.section}>{row.section}</option>
                                                ) : null}
                                            </select>
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>
                                        {readOnly || subjectLocked ? (
                                            <input
                                                type='text'
                                                value={row.subject || (subjectLocked ? subjectOptions[0] : '—')}
                                                readOnly
                                                className={`${inputClass} bg-[#F8F9FC]`}
                                            />
                                        ) : subjectOptions.length ? (
                                            <select
                                                value={row.subject}
                                                onChange={(e) => updateRow(index, 'subject', e.target.value)}
                                                className={selectClass}
                                            >
                                                <option value=''>Select subject</option>
                                                {subjectOptions.map((subject) => (
                                                    <option key={subject} value={subject}>{subject}</option>
                                                ))}
                                                {row.subject && !subjectOptions.includes(row.subject) ? (
                                                    <option value={row.subject}>{row.subject}</option>
                                                ) : null}
                                            </select>
                                        ) : (
                                            <input
                                                type='text'
                                                value={row.subject}
                                                className={`${inputClass} bg-[#F8F9FC]`}
                                                placeholder={!row.className ? 'Select class' : 'No subjects'}
                                                disabled
                                            />
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>
                                        <input
                                            type='text'
                                            value={row.teacher || defaultTeacher || '—'}
                                            readOnly
                                            className={`${inputClass} bg-[#F8F9FC]`}
                                        />
                                    </td>
                                    <td className='px-2 py-3'>
                                        {readOnly ? (
                                            row.startTime || '—'
                                        ) : (
                                            <input
                                                type='time'
                                                value={row.startTime}
                                                onChange={(e) => updateRow(index, 'startTime', e.target.value)}
                                                className={inputClass}
                                            />
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>
                                        {readOnly ? (
                                            row.endTime || '—'
                                        ) : (
                                            <input
                                                type='time'
                                                value={row.endTime}
                                                onChange={(e) => updateRow(index, 'endTime', e.target.value)}
                                                className={inputClass}
                                            />
                                        )}
                                    </td>
                                    {!readOnly && (
                                        <td className='px-2 py-3'>
                                            <button
                                                type='button'
                                                onClick={() => removeRow(index)}
                                                disabled={timelines.length === 1}
                                                className='inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
                                            >
                                                <Trash2 size={14} />
                                                Remove
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ClassTimelineEditor
