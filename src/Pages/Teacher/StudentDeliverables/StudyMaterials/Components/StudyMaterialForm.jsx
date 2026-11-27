import React, { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import FileUploadField from '../../../../../Common/CommonComponents/FileUploadField'
import { useAssignedClassSectionSubject } from '../../../../../Common/Teacher/useAssignedClassSectionSubject'
import { canUseAcademicFileUploads } from '../../../../../services/academicAttachments'
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
    const apiMode = canUseAcademicFileUploads()
    const [fileName, setFileName] = useState(record?.fileName ?? '')
    const [pendingFiles, setPendingFiles] = useState([])
    const [title, setTitle] = useState(record?.title ?? '')
    const [description, setDescription] = useState(record?.description ?? '')
    const [className, setClassName] = useState(record?.className ?? '')
    const [section, setSection] = useState(record?.section ?? '')
    const [subject, setSubject] = useState(record?.subject ?? '')

    const {
        assignments,
        classOptions,
        sectionOptions,
        subjectOptions,
        applyClassChange,
        applySectionChange,
    } = useAssignedClassSectionSubject({
        className,
        section,
        fallbackClasses: CLASSES,
        fallbackSections: SECTIONS,
        fallbackSubjects: SUBJECTS,
    })

    useEffect(() => {
        if (!record) return
        setTitle(record.title ?? '')
        setDescription(record.description ?? '')
        setClassName(record.className ?? '')
        setSection(record.section ?? '')
        setSubject(record.subject ?? '')
        setFileName(record.fileName ?? '')
    }, [record])

    useEffect(() => {
        if (readOnly || record || !assignments.ready) return
        if (className || !classOptions[0]) return
        const next = applyClassChange(classOptions[0], { section, subject })
        setClassName(next.className)
        setSection(next.section)
        setSubject(next.subject)
    }, [assignments.ready, readOnly, record, classOptions, className, section, subject, applyClassChange])

    const handleSubmit = (event) => {
        event.preventDefault()
        if (readOnly) return
        const chosenName = apiMode ? (pendingFiles[0]?.name || fileName) : fileName
        onSubmit({
            title: title.trim(),
            description: description.trim(),
            subject,
            className,
            section,
            fileName: chosenName || record?.fileName || '—',
            fileType: chosenName ? getFileType(chosenName) : record?.fileType || 'pdf',
            pendingFiles: apiMode ? pendingFiles : [],
            fileId: record?.fileId || null,
        })
    }

    const handleFileChange = (event) => {
        const file = event.target.files?.[0]
        if (file) setFileName(file.name)
    }

    return (
        <form id={formId} onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                {!assignments.ready && !readOnly ? (
                    <p className='text-sm text-[#667085] sm:col-span-2 lg:col-span-3'>Loading your assigned classes…</p>
                ) : null}
                {assignments.emptyReason && assignments.ready && !readOnly ? (
                    <p className='text-sm text-[#E65100] sm:col-span-2 lg:col-span-3'>{assignments.emptyReason}</p>
                ) : null}
                <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                    <label htmlFor='title' className='text-base font-medium text-[#1E1E1E]'>Title:</label>
                    <input
                        type='text'
                        id='title'
                        required
                        readOnly={readOnly}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder='e.g. Real Numbers — Chapter Notes'
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                    <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                    <textarea
                        id='description'
                        required
                        readOnly={readOnly}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder='Brief description of the study material...'
                        className={textareaClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='class-name' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                    <select
                        id='class-name'
                        required
                        disabled={readOnly || !classOptions.length}
                        value={className}
                        onChange={(event) => {
                            const next = applyClassChange(event.target.value, { section, subject })
                            setClassName(next.className)
                            setSection(next.section)
                            setSubject(next.subject)
                        }}
                        className={selectClass}
                    >
                        <option value=''>{classOptions.length ? '--Select--' : 'No assigned classes'}</option>
                        {classOptions.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                        {className && !classOptions.includes(className) ? (
                            <option value={className}>{className}</option>
                        ) : null}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                    <select
                        id='section'
                        required
                        disabled={readOnly || !sectionOptions.length}
                        value={section}
                        onChange={(event) => {
                            const next = applySectionChange(event.target.value, { className, subject })
                            setSection(next.section)
                            setSubject(next.subject)
                        }}
                        className={selectClass}
                    >
                        <option value=''>{sectionOptions.length ? '--Select--' : 'Select class first'}</option>
                        {sectionOptions.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                        {section && !sectionOptions.includes(section) ? (
                            <option value={section}>{section}</option>
                        ) : null}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                    <select
                        id='subject'
                        required
                        disabled={readOnly || !subjectOptions.length}
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        className={selectClass}
                    >
                        <option value=''>{subjectOptions.length ? '--Select--' : 'No assigned subjects'}</option>
                        {subjectOptions.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                        {subject && !subjectOptions.includes(subject) ? (
                            <option value={subject}>{subject}</option>
                        ) : null}
                    </select>
                </div>
                {!readOnly && (
                    <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                        {apiMode ? (
                            <FileUploadField
                                label='Upload File'
                                deferred
                                pendingFiles={pendingFiles}
                                onPendingChange={setPendingFiles}
                                multiple={false}
                                maxFiles={1}
                                hint='PDF, PNG, JPG, Word or Excel · up to 10 MB · uploads when saved'
                            />
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                )}
            </div>
        </form>
    )
}

export default StudyMaterialForm
