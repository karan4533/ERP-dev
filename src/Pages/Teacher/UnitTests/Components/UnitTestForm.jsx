import React, { useEffect, useMemo, useState } from 'react'
import { Upload } from 'lucide-react'
import { useTeacherAssignments } from '../../../../Common/Teacher/useTeacherAssignments'
import { classKeysMatch, normalizeSectionKey } from '../../../../Common/Teacher/teacherAssignedClasses'
import { CLASSES, SECTIONS, SUBJECTS } from '../unitTestsData'

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
    if (['doc', 'docx'].includes(extension)) return 'doc'
    return 'pdf'
}

const UnitTestForm = ({ record, onSubmit, formId = 'unit-test-form', readOnly = false }) => {
    const assignments = useTeacherAssignments()
    const [fileName, setFileName] = useState(record?.fileName ?? '')
    const [formState, setFormState] = useState(() => ({
        title: record?.title ?? '',
        description: record?.description ?? '',
        subject: record?.subject ?? '',
        className: record?.className ?? '',
        section: record?.section ?? '',
        testDate: record?.testDate ?? '',
        totalMarks: record?.totalMarks ?? '',
        duration: record?.duration ?? '',
    }))

    useEffect(() => {
        if (!record) return
        setFormState({
            title: record.title ?? '',
            description: record.description ?? '',
            subject: record.subject ?? '',
            className: record.className ?? '',
            section: record.section ?? '',
            testDate: record.testDate ?? '',
            totalMarks: record.totalMarks ?? '',
            duration: record.duration ?? '',
        })
        setFileName(record.fileName ?? '')
    }, [record])

    const classOptions = useMemo(() => {
        if (assignments.classes?.length) return assignments.classes
        return CLASSES
    }, [assignments.classes])

    const sectionOptions = useMemo(() => {
        if (!formState.className) return []
        const fromAssignments = assignments.sectionsFor?.(formState.className) || []
        if (fromAssignments.length) return fromAssignments
        return assignments.assignments?.length ? [] : SECTIONS
    }, [assignments, formState.className])

    const subjectOptions = useMemo(() => {
        if (!assignments.assignments?.length) return SUBJECTS
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
        return assignments.subjects?.length ? assignments.subjects : SUBJECTS
    }, [assignments, formState.className, formState.section])

    // Prefill first assigned class / section / subject once allocations load (create mode).
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
            return changed ? next : current
        })
    }, [assignments.ready, assignments, classOptions, subjectOptions, readOnly, record])

    const update = (key, value) => {
        setFormState((current) => {
            const next = { ...current, [key]: value }
            if (key === 'className') {
                const nextSections = assignments.sectionsFor?.(value) || []
                next.section = nextSections.includes(current.section) ? current.section : (nextSections[0] || '')
                const nextSubjects = (assignments.assignments || [])
                    .filter((row) => classKeysMatch(row.className, value)
                        && (!next.section || !row.section
                            || normalizeSectionKey(row.section) === normalizeSectionKey(next.section)))
                    .map((row) => row.subject)
                    .filter(Boolean)
                const uniqueSubjects = [...new Set(nextSubjects)]
                if (uniqueSubjects.length && !uniqueSubjects.includes(next.subject)) {
                    next.subject = uniqueSubjects[0]
                }
            }
            if (key === 'section' && current.className) {
                const nextSubjects = (assignments.assignments || [])
                    .filter((row) => classKeysMatch(row.className, current.className)
                        && (!value || !row.section
                            || normalizeSectionKey(row.section) === normalizeSectionKey(value)))
                    .map((row) => row.subject)
                    .filter(Boolean)
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
        if (readOnly) return

        onSubmit({
            title: formState.title.trim(),
            description: formState.description.trim(),
            subject: formState.subject,
            className: formState.className,
            section: formState.section,
            testDate: formState.testDate,
            totalMarks: formState.totalMarks,
            duration: formState.duration,
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
                        value={formState.title}
                        onChange={(event) => update('title', event.target.value)}
                        placeholder='e.g. Real Numbers — Unit Test I'
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                    <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                    <textarea
                        id='description'
                        required
                        readOnly={readOnly}
                        value={formState.description}
                        onChange={(event) => update('description', event.target.value)}
                        placeholder='Brief description of the unit test syllabus and format...'
                        className={textareaClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                    <select
                        id='subject'
                        required
                        disabled={readOnly || !subjectOptions.length}
                        value={formState.subject}
                        onChange={(event) => update('subject', event.target.value)}
                        className={selectClass}
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
                        required
                        disabled={readOnly || !classOptions.length}
                        value={formState.className}
                        onChange={(event) => update('className', event.target.value)}
                        className={selectClass}
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
                        required
                        disabled={readOnly || !sectionOptions.length}
                        value={formState.section}
                        onChange={(event) => update('section', event.target.value)}
                        className={selectClass}
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
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='test-date' className='text-base font-medium text-[#1E1E1E]'>Test Date:</label>
                    <input
                        type='date'
                        id='test-date'
                        required
                        readOnly={readOnly}
                        value={formState.testDate}
                        onChange={(event) => update('testDate', event.target.value)}
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='total-marks' className='text-base font-medium text-[#1E1E1E]'>Total Marks:</label>
                    <input
                        type='number'
                        id='total-marks'
                        required
                        min='1'
                        readOnly={readOnly}
                        value={formState.totalMarks}
                        onChange={(event) => update('totalMarks', event.target.value)}
                        placeholder='e.g. 25'
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='duration' className='text-base font-medium text-[#1E1E1E]'>Duration (minutes):</label>
                    <input
                        type='number'
                        id='duration'
                        required
                        min='1'
                        readOnly={readOnly}
                        value={formState.duration}
                        onChange={(event) => update('duration', event.target.value)}
                        placeholder='e.g. 45'
                        className={inputClass}
                    />
                </div>
                {!readOnly && (
                    <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                        <label htmlFor='upload-document' className='text-base font-medium text-[#1E1E1E]'>Upload Question Paper:</label>
                        <label
                            htmlFor='upload-document'
                            className='flex items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'
                        >
                            <Upload size={20} className='text-[#808080]' />
                            <span className='text-sm text-[#808080]'>
                                {fileName || 'Choose file (PDF, DOC, PPT, images)'}
                            </span>
                            <input
                                type='file'
                                id='upload-document'
                                className='hidden'
                                accept='.pdf,.doc,.docx,.ppt,.pptx,image/*'
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                )}
            </div>
        </form>
    )
}

export default UnitTestForm
