import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import { CLASSES, SECTIONS, SUBJECTS } from '../studyMaterialsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const getFileType = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
    if (extension === 'mp4') return 'mp4'
    if (['ppt', 'pptx'].includes(extension)) return 'ppt'
    return 'pdf'
}

const StudyMaterialForm = ({ record, onSubmit, formId = 'study-material-form', readOnly = false }) => {
    const [fileName, setFileName] = useState(record?.fileName ?? '')

    const handleSubmit = (event) => {
        event.preventDefault()
        if (readOnly) return

        const form = event.currentTarget
        const formData = new FormData(form)

        onSubmit({
            title: formData.get('title'),
            description: formData.get('description'),
            subject: formData.get('subject'),
            className: formData.get('className'),
            section: formData.get('section'),
            fileName: fileName || record?.fileName || '—',
            fileType: fileName ? getFileType(fileName) : record?.fileType || 'pdf',
        })
    }

    const handleFileChange = (event) => {
        const file = event.target.files?.[0]
        if (file) setFileName(file.name)
    }

    return (
        <form id={formId} onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                    <label htmlFor='title' className='text-base font-medium text-[#1E1E1E]'>Title:</label>
                    <input
                        type='text'
                        id='title'
                        name='title'
                        required
                        readOnly={readOnly}
                        defaultValue={record?.title ?? ''}
                        placeholder='e.g. Real Numbers — Chapter Notes'
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                    <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                    <textarea
                        id='description'
                        name='description'
                        required
                        readOnly={readOnly}
                        defaultValue={record?.description ?? ''}
                        placeholder='Brief description of the study material...'
                        className={textareaClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                    <select
                        id='subject'
                        name='subject'
                        required
                        disabled={readOnly}
                        defaultValue={record?.subject ?? ''}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {SUBJECTS.map((subject) => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='class-name' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                    <select
                        id='class-name'
                        name='className'
                        required
                        disabled={readOnly}
                        defaultValue={record?.className ?? ''}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {CLASSES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                    <select
                        id='section'
                        name='section'
                        required
                        disabled={readOnly}
                        defaultValue={record?.section ?? ''}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {SECTIONS.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                {!readOnly && (
                    <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                        <label htmlFor='upload-document' className='text-base font-medium text-[#1E1E1E]'>Upload File:</label>
                        <label
                            htmlFor='upload-document'
                            className='flex items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'
                        >
                            <Upload size={20} className='text-[#808080]' />
                            <span className='text-sm text-[#808080]'>
                                {fileName || 'Choose file (PDF, DOC, PPT, images, video)'}
                            </span>
                            <input
                                type='file'
                                id='upload-document'
                                className='hidden'
                                accept='.pdf,.doc,.docx,.ppt,.pptx,.mp4,image/*'
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                )}
            </div>
        </form>
    )
}

export default StudyMaterialForm
