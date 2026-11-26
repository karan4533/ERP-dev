import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
    GRADES,
    SECTIONS,
    DAYS,
    SUBJECTS,
    TEACHERS,
    getClassTimetables,
    saveClassTimetables,
    addClassTimetable,
} from '../../../Principal/ClassTimetable/classTimetableData'

const AddTimeTable = () => {
    const navigate = useNavigate()
    const [className, setClassName] = useState(GRADES[0] || 'Grade 9')
    const [section, setSection] = useState(SECTIONS[0] || 'A')
    const [day, setDay] = useState(DAYS[0] || 'Monday')
    const [periodNumber, setPeriodNumber] = useState('1')
    const [subject, setSubject] = useState(SUBJECTS[0] || 'English')
    const [teacher, setTeacher] = useState(TEACHERS[0] || 'Mr. Ravi Kumar')
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('09:45')

    const handleSave = (e) => {
        e.preventDefault()
        try {
            const allTimetables = getClassTimetables()
            const matchIndex = allTimetables.findIndex(
                (item) => item.className === className && item.section === section
            )

            const newPeriod = {
                id: `TL-${Date.now()}`,
                periodNumber: String(periodNumber),
                day,
                subject,
                teacher,
                startTime,
                endTime,
            }

            if (matchIndex >= 0) {
                const current = allTimetables[matchIndex]
                const updatedTimelines = [
                    ...current.timelines.filter(
                        (t) => !(t.day === day && String(t.periodNumber) === String(periodNumber))
                    ),
                    newPeriod,
                ]
                allTimetables[matchIndex] = {
                    ...current,
                    timelines: updatedTimelines,
                }
                saveClassTimetables(allTimetables)
            } else {
                addClassTimetable({
                    className,
                    section,
                    academicYear: '2025-2026',
                    term: 'Term 1',
                    timelines: [newPeriod],
                })
            }

            toast.success(`Period ${periodNumber} for ${className}-${section} (${day}) added successfully!`)
            navigate('/admin/class/timetable-list')
        } catch (err) {
            toast.error('Failed to add period: ' + err.message)
        }
    }

    return (
        <section>
            <form onSubmit={handleSave}>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-xl font-semibold text-black'>Add Class Period to Timetable</h2>
                    <p className='text-sm text-slate-500 mt-1 mb-6'>
                        Schedule period slots for any grade, section, and day of the week.
                    </p>

                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='class-select' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                            <select
                                id='class-select'
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'
                            >
                                {GRADES.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='section-select' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                            <select
                                id='section-select'
                                value={section}
                                onChange={(e) => setSection(e.target.value)}
                                className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'
                            >
                                {SECTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='day-select' className='text-base font-medium text-[#1E1E1E]'>Day:</label>
                            <select
                                id='day-select'
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'
                            >
                                {DAYS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='period-input' className='text-base font-medium text-[#1E1E1E]'>Period Number:</label>
                            <input
                                id='period-input'
                                type='number'
                                min='1'
                                max='10'
                                value={periodNumber}
                                onChange={(e) => setPeriodNumber(e.target.value)}
                                required
                                className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='subject-select' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                            <select
                                id='subject-select'
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'
                            >
                                {SUBJECTS.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='teacher-select' className='text-base font-medium text-[#1E1E1E]'>Teacher:</label>
                            <select
                                id='teacher-select'
                                value={teacher}
                                onChange={(e) => setTeacher(e.target.value)}
                                className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'
                            >
                                {TEACHERS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='start-time' className='text-base font-medium text-[#1E1E1E]'>Start Time:</label>
                            <input
                                id='start-time'
                                type='time'
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='end-time' className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                            <input
                                id='end-time'
                                type='time'
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                            />
                        </div>
                    </div>
                </div>

                <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                    <button
                        type='button'
                        onClick={() => navigate('/admin/class/timetable-list')}
                        className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                    >
                        Discard Changes
                    </button>
                    <button
                        type='submit'
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </section>
    )
}

export default AddTimeTable
