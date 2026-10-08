import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import ExamTimelineEditor from './Components/ExamTimelineEditor'
import {
    EXAM_STATUSES,
    GRADES,
    ROUTE_BASE,
    SECTIONS,
    TEACHERS,
    addExamTimetable,
    defaultExamTimetableForm,
    generateExamId,
} from './examinationTimetableData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const CreateExaminationTimetable = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState(() => ({
        ...defaultExamTimetableForm(),
        examId: generateExamId(),
    }))
    const [errors, setErrors] = useState([])

    const updateField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const validate = () => {
        const nextErrors = []
        if (!form.examName) nextErrors.push('Exam name is required.')
        if (!form.className) nextErrors.push('Class is required.')
        if (!form.section) nextErrors.push('Section is required.')
        if (!form.timelines.some((row) => row.day && row.subject && row.startTime && row.endTime)) {
            nextErrors.push('Add at least one complete timeline row.')
        }
        setErrors(nextErrors)
        return nextErrors.length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return
        addExamTimetable(form)
        navigate(ROUTE_BASE)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 space-y-8'>
                <div>
                    <h2 className='text-xl font-semibold text-black'>Create Examination Timetable</h2>
                    <p className='text-sm text-[#667085] mt-1'>
                        Enter exam details once, then add multiple exam timelines using Add More.
                    </p>
                </div>

                {errors.length > 0 && (
                    <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                        <ul className='list-disc pl-5 text-sm text-red-600 space-y-1'>
                            {errors.map((error) => (
                                <li key={error}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div>
                    <h3 className='text-lg font-semibold text-black mb-4'>Examination Information</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='exam-id' className='text-base font-medium text-[#1E1E1E]'>Exam ID:</label>
                            <input type='text' id='exam-id' value={form.examId} readOnly className={inputClass} />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='exam-name' className='text-base font-medium text-[#1E1E1E]'>Exam Name:</label>
                            <input
                                type='text'
                                id='exam-name'
                                value={form.examName}
                                onChange={(e) => updateField('examName', e.target.value)}
                                placeholder='Mid Term Examination'
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='class' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                            <select id='class' value={form.className} onChange={(e) => updateField('className', e.target.value)} className={selectClass}>
                                <option value=''>Select class</option>
                                {GRADES.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                            <select id='section' value={form.section} onChange={(e) => updateField('section', e.target.value)} className={selectClass}>
                                <option value=''>Select section</option>
                                {SECTIONS.map((section) => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='teacher-name' className='text-base font-medium text-[#1E1E1E]'>Teacher Name:</label>
                            <select id='teacher-name' value={form.teacherName} onChange={(e) => updateField('teacherName', e.target.value)} className={selectClass}>
                                <option value=''>Select teacher</option>
                                {TEACHERS.map((teacher) => (
                                    <option key={teacher} value={teacher}>{teacher}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='status' className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                            <select id='status' value={form.status} onChange={(e) => updateField('status', e.target.value)} className={selectClass}>
                                {EXAM_STATUSES.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Start Date:</label>
                            <div className='relative w-full'>
                                <DatePicker
                                    selected={form.startDate}
                                    onChange={(date) => updateField('startDate', date)}
                                    isClearable
                                    showMonthYearDropdown
                                    scrollableMonthYearDropdown
                                    dateFormat='dd/MM/yyyy'
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>End Date:</label>
                            <div className='relative w-full'>
                                <DatePicker
                                    selected={form.endDate}
                                    onChange={(date) => updateField('endDate', date)}
                                    isClearable
                                    showMonthYearDropdown
                                    scrollableMonthYearDropdown
                                    dateFormat='dd/MM/yyyy'
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                    </div>
                </div>

                <ExamTimelineEditor
                    timelines={form.timelines}
                    onChange={(timelines) => updateField('timelines', timelines)}
                />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSubmit}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Timetable
                </button>
            </div>
        </section>
    )
}

export default CreateExaminationTimetable
