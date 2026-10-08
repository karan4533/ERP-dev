import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { CLASSES, SECTIONS, SUBJECTS, DAYS, formatDate } from '../createExamScheduleData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const createSubjectRow = () => ({
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    subject: '',
    examDate: new Date(),
    startTime: '',
    endTime: '',
    day: '',
    duration: '',
})

const ExamScheduleForm = ({ onSubmit }) => {
    const [examDate, setExamDate] = useState(new Date())
    const [endDate, setEndDate] = useState(new Date())
    const [subjects, setSubjects] = useState([createSubjectRow()])

    const updateSubject = (key, field, value) => {
        setSubjects((prev) =>
            prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
        )
    }

    const addSubjectRow = () => {
        setSubjects((prev) => [...prev, createSubjectRow()])
    }

    const removeSubjectRow = (key) => {
        setSubjects((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)))
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const formData = new FormData(form)

        onSubmit({
            examName: formData.get('examName'),
            className: formData.get('className'),
            section: formData.get('section'),
            examDate: formatDate(examDate),
            endDate: formatDate(endDate),
            teacherName: formData.get('teacherName'),
            subjects: subjects.map((row) => ({
                subject: row.subject,
                examDate: formatDate(row.examDate),
                startTime: row.startTime,
                endTime: row.endTime,
                day: row.day,
                duration: row.duration,
            })),
        })
    }

    return (
        <form id='exam-schedule-form' onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                    <label htmlFor='exam-name' className='text-base font-medium text-[#1E1E1E]'>Exam Name:</label>
                    <input type='text' id='exam-name' name='examName' required placeholder='e.g. Mid Term Examination' className={inputClass} />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='class-name' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                    <select id='class-name' name='className' required className={selectClass}>
                        <option value=''>--Select--</option>
                        {CLASSES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                    <select id='section' name='section' required className={selectClass}>
                        <option value=''>--Select--</option>
                        {SECTIONS.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Exam Date:</label>
                    <div className='relative'>
                        <DatePicker
                            selected={examDate}
                            onChange={(date) => setExamDate(date)}
                            dateFormat='dd/MM/yyyy'
                            isClearable
                            className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                        />
                        <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                    </div>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>End Date:</label>
                    <div className='relative'>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            dateFormat='dd/MM/yyyy'
                            isClearable
                            className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                        />
                        <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                    </div>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='teacher-name' className='text-base font-medium text-[#1E1E1E]'>Teacher Name:</label>
                    <input type='text' id='teacher-name' name='teacherName' required placeholder='e.g. Mr. Anil Kumar' className={inputClass} />
                </div>
            </div>

            <div className='mt-10 pt-6 border-t border-[#EEF0F6]'>
                <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
                    <h3 className='text-lg font-semibold text-[#0C1E5B]'>Add Subjects</h3>
                    <button
                        type='button'
                        onClick={addSubjectRow}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        <Plus size={16} />
                        Add Subject
                    </button>
                </div>

                <div className='space-y-6'>
                    {subjects.map((row, index) => (
                        <div key={row.key} className='p-4 rounded-xl border border-[#EEF0F6] bg-[#FAFBFD]'>
                            <div className='flex items-center justify-between gap-3 mb-4'>
                                <p className='text-sm font-medium text-[#515DEF]'>Subject {index + 1}</p>
                                {subjects.length > 1 && (
                                    <button
                                        type='button'
                                        onClick={() => removeSubjectRow(row.key)}
                                        className='inline-flex items-center gap-1 text-sm text-[#F44336] hover:opacity-80 cursor-pointer'
                                    >
                                        <Trash2 size={14} />
                                        Remove
                                    </button>
                                )}
                            </div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                                <div className='flex flex-col gap-y-2'>
                                    <label className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                                    <select
                                        required
                                        value={row.subject}
                                        onChange={(e) => updateSubject(row.key, 'subject', e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value=''>--Select--</option>
                                        {SUBJECTS.map((subject) => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <label className='text-base font-medium text-[#1E1E1E]'>Exam Date:</label>
                                    <div className='relative'>
                                        <DatePicker
                                            selected={row.examDate}
                                            onChange={(date) => updateSubject(row.key, 'examDate', date)}
                                            dateFormat='dd/MM/yyyy'
                                            isClearable
                                            className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                        />
                                        <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                                    </div>
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <label className='text-base font-medium text-[#1E1E1E]'>Day:</label>
                                    <select
                                        required
                                        value={row.day}
                                        onChange={(e) => updateSubject(row.key, 'day', e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value=''>--Select--</option>
                                        {DAYS.map((day) => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <label className='text-base font-medium text-[#1E1E1E]'>Start Time:</label>
                                    <input
                                        type='text'
                                        required
                                        value={row.startTime}
                                        onChange={(e) => updateSubject(row.key, 'startTime', e.target.value)}
                                        placeholder='e.g. 10:30 AM'
                                        className={inputClass}
                                    />
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <label className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                                    <input
                                        type='text'
                                        required
                                        value={row.endTime}
                                        onChange={(e) => updateSubject(row.key, 'endTime', e.target.value)}
                                        placeholder='e.g. 12:30 PM'
                                        className={inputClass}
                                    />
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <label className='text-base font-medium text-[#1E1E1E]'>Duration:</label>
                                    <input
                                        type='text'
                                        required
                                        value={row.duration}
                                        onChange={(e) => updateSubject(row.key, 'duration', e.target.value)}
                                        placeholder='e.g. 2 Hours'
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </form>
    )
}

export default ExamScheduleForm
