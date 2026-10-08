import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Upload } from 'lucide-react'
import { CLASSES, SECTIONS, SUBJECTS } from '../../../AssignedClass/assignedClassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const formatDate = (date) => {
    if (!date) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

const HomeFunForm = ({ onSubmit, formId = 'home-fun-form' }) => {
    const [assessmentType, setAssessmentType] = useState('')
    const [assignedDate, setAssignedDate] = useState(new Date())
    const [dueDate, setDueDate] = useState(new Date())
    const [attachmentName, setAttachmentName] = useState('')

    const isHomework = assessmentType === 'Homework'
    const isAssignment = assessmentType === 'Assignment'

    const handleSubmit = (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const formData = new FormData(form)

        onSubmit({
            assessmentType: formData.get('assessmentType'),
            className: formData.get('className'),
            section: formData.get('section'),
            subject: formData.get('subject'),
            assignmentTitle: formData.get('title'),
            assignmentDescription: formData.get('description'),
            totalMarks: isAssignment ? formData.get('totalMarks') : undefined,
            assignedDate: formatDate(assignedDate),
            dueDate: formatDate(dueDate),
            attachment: attachmentName || '—',
        })
    }

    return (
        <form id={formId} onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                    <label htmlFor='assessment-type' className='text-base font-medium text-[#1E1E1E]'>Assessment Type:</label>
                    <select
                        id='assessment-type'
                        name='assessmentType'
                        required
                        value={assessmentType}
                        onChange={(event) => setAssessmentType(event.target.value)}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        <option value='Assignment'>Assignment</option>
                        <option value='Homework'>Homework</option>
                    </select>
                </div>

                {assessmentType && (
                    <>
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
                            <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                            <select id='subject' name='subject' required className={selectClass}>
                                <option value=''>--Select--</option>
                                {SUBJECTS.map((subject) => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                            <label htmlFor='title' className='text-base font-medium text-[#1E1E1E]'>
                                {isHomework ? 'Homework Title:' : 'Assignment Title:'}
                            </label>
                            <input
                                type='text'
                                id='title'
                                name='title'
                                required
                                placeholder={isHomework ? 'e.g. Chapter 5 Practice Questions' : 'e.g. Quadratic Equations Worksheet'}
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                            <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>
                                {isHomework ? 'Homework Description:' : 'Assignment Description:'}
                            </label>
                            <textarea
                                id='description'
                                name='description'
                                required
                                placeholder={
                                    isHomework
                                        ? 'Describe the homework objectives and instructions...'
                                        : 'Describe the assignment objectives and instructions...'
                                }
                                className={textareaClass}
                            />
                        </div>
                        {isAssignment && (
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor='total-marks' className='text-base font-medium text-[#1E1E1E]'>Total Marks:</label>
                                <input
                                    type='number'
                                    id='total-marks'
                                    name='totalMarks'
                                    required
                                    min='1'
                                    placeholder='e.g. 50'
                                    className={inputClass}
                                />
                            </div>
                        )}
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Assigned Date:</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={assignedDate}
                                    onChange={(date) => setAssignedDate(date)}
                                    dateFormat='dd/MM/yyyy'
                                    isClearable
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Due Date:</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={dueDate}
                                    onChange={(date) => setDueDate(date)}
                                    dateFormat='dd/MM/yyyy'
                                    isClearable
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                            <label htmlFor='upload-document' className='text-base font-medium text-[#1E1E1E]'>Upload Document:</label>
                            <label
                                htmlFor='upload-document'
                                className='flex items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'
                            >
                                <Upload size={20} className='text-[#808080]' />
                                <span className='text-sm text-[#808080]'>
                                    {attachmentName || 'Choose file (PDF, DOC, PPT, images)'}
                                </span>
                                <input
                                    type='file'
                                    id='upload-document'
                                    className='hidden'
                                    accept='.pdf,.doc,.docx,.ppt,.pptx,image/*'
                                    onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? '')}
                                />
                            </label>
                        </div>
                    </>
                )}
            </div>
        </form>
    )
}

export default HomeFunForm
