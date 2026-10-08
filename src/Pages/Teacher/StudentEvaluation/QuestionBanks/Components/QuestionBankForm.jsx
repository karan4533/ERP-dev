import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Upload } from 'lucide-react'
import { CLASSES, SECTIONS, SUBJECTS, EXAM_TYPES, formatDate } from '../questionBanksData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const QuestionBankForm = ({ onSubmit }) => {
    const [uploadDate, setUploadDate] = useState(new Date())
    const [fileName, setFileName] = useState('')

    const handleSubmit = (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const formData = new FormData(form)

        onSubmit({
            subject: formData.get('subject'),
            className: formData.get('className'),
            section: formData.get('section'),
            paperTitle: formData.get('paperTitle'),
            description: formData.get('description'),
            examType: formData.get('examType'),
            uploadDate: formatDate(uploadDate),
            fileName: fileName || '—',
        })
    }

    return (
        <form id='question-bank-form' onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                    <select id='subject' name='subject' required className={selectClass}>
                        <option value=''>--Select--</option>
                        {SUBJECTS.map((subject) => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
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
                <div className='flex flex-col gap-y-2 lg:col-span-2'>
                    <label htmlFor='paper-title' className='text-base font-medium text-[#1E1E1E]'>Paper Title:</label>
                    <input type='text' id='paper-title' name='paperTitle' required placeholder='e.g. Quadratic Equations — Question Paper' className={inputClass} />
                </div>
                <div className='flex flex-col gap-y-2 lg:col-span-3'>
                    <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                    <textarea id='description' name='description' required placeholder='Brief description of the question bank...' className={textareaClass} />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='exam-type' className='text-base font-medium text-[#1E1E1E]'>Exam Type:</label>
                    <select id='exam-type' name='examType' required className={selectClass}>
                        <option value=''>--Select--</option>
                        {EXAM_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Upload Date:</label>
                    <div className='relative'>
                        <DatePicker
                            selected={uploadDate}
                            onChange={(date) => setUploadDate(date)}
                            dateFormat='dd/MM/yyyy'
                            isClearable
                            className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                        />
                        <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                    </div>
                </div>
                <div className='flex flex-col gap-y-2 lg:col-span-3'>
                    <label htmlFor='upload-document' className='text-base font-medium text-[#1E1E1E]'>Upload Document:</label>
                    <label
                        htmlFor='upload-document'
                        className='flex items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'
                    >
                        <Upload size={20} className='text-[#808080]' />
                        <span className='text-sm text-[#808080]'>
                            {fileName || 'Choose file (PDF, DOC, DOCX)'}
                        </span>
                        <input
                            type='file'
                            id='upload-document'
                            className='hidden'
                            accept='.pdf,.doc,.docx'
                            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
                        />
                    </label>
                </div>
            </div>
        </form>
    )
}

export default QuestionBankForm
