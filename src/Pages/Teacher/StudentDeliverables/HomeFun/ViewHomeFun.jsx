import React, { useRef, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, FileUp, Upload } from 'lucide-react'
import pdf_icon from '../../../../assets/images/pdf-icon.png'
import SubmissionStudentsModal from './Components/SubmissionStudentsModal'
import {
    DEFAULT_ROUTE_BASE,
    getHomeFunItemById,
    getHomeFunSubmissionRecord,
    getRecordAssessmentType,
    statusBadgeColor,
    typeBadgeColor,
} from './homeFunData'
import {
    getStudentSubmission,
    saveStudentSubmission,
} from '../../../Student/StudentDeliverables/studentHomeFunSubmissions'
import { useActiveStudent } from '../../../../context/ActiveStudentContext'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const SubmissionStatButton = ({ label, count, colorClass, statusType, record, onView }) => {
    const canView = count > 0

    return (
        <div className='flex flex-col gap-y-2 p-4 rounded-xl border border-[#EEF0F6] bg-[#FAFBFD]'>
            <span className='text-sm font-medium text-[#808080]'>{label}</span>
            <div className='flex items-center justify-between gap-3'>
                <span className={`text-2xl font-semibold ${colorClass}`}>{count}</span>
                <button
                    type='button'
                    title={canView ? 'View students' : 'No students to show'}
                    disabled={!canView}
                    onClick={() => canView && onView(record, statusType)}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shrink-0 ${
                        canView
                            ? 'border-[#515DEF33] bg-[#515DEF0D] text-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] cursor-pointer'
                            : 'border-[#E2E8F0] bg-white text-[#C4C4C4] cursor-not-allowed'
                    }`}
                >
                    <Eye size={16} />
                    View
                </button>
            </div>
        </div>
    )
}

const StudentSubmissionSection = ({ record }) => {
    const { activeStudentId } = useActiveStudent()
    const [submission, setSubmission] = useState(() =>
        getStudentSubmission(record.assignmentId, record.assignmentTitle, activeStudentId),
    )
    const [note, setNote] = useState('')
    const [fileData, setFileData] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const inputRef = useRef(null)

    useEffect(() => {
        setSubmission(getStudentSubmission(record.assignmentId, record.assignmentTitle, activeStudentId))
        setNote('')
        setFileData(null)
        setSuccessMessage('')
    }, [record.assignmentId, record.assignmentTitle, activeStudentId])

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const handleFile = (file) => {
        if (!file) return

        const supported = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        if (!supported.includes(file.type)) {
            alert('Unsupported format. Please upload PDF, JPG, or PNG.')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit.')
            return
        }

        setFileData({
            name: file.name,
            size: formatSize(file.size),
        })
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        if (!fileData) {
            alert('Please upload your assignment file before submitting.')
            return
        }

        setSubmitting(true)
        const saved = saveStudentSubmission({
            assignmentId: record.assignmentId,
            assignmentTitle: record.assignmentTitle,
            fileName: fileData.name,
            fileSize: fileData.size,
            additionalNote: note.trim(),
            dueDate: record.dueDate,
        }, activeStudentId)
        setSubmission(saved)
        setSuccessMessage('Your assignment has been submitted successfully.')
        setSubmitting(false)
    }

    if (submission) {
        return (
            <Section title='My Submission'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Submitted On' value={submission.submittedAt} />
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Status</span>
                        <span className={`inline-flex w-fit px-2 py-1 rounded-lg text-xs font-semibold ${submission.isLate ? 'bg-[#F4433633] text-[#F44336]' : 'bg-[#4CAF5033] text-[#4CAF50]'}`}>
                            {submission.isLate ? 'Late Submission' : 'Submitted'}
                        </span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Uploaded File</span>
                        <span className='flex items-center gap-x-2 text-sm text-[#515DEF]'>
                            <img src={pdf_icon} alt='attachment' className='w-6 h-6' />
                            {submission.fileName}
                            {submission.fileSize ? ` (${submission.fileSize})` : ''}
                        </span>
                    </div>
                    <div className='lg:col-span-3'>
                        <Field label='Additional Note' value={submission.additionalNote || '—'} />
                    </div>
                </div>
            </Section>
        )
    }

    return (
        <Section title='Submit Assignment'>
            {successMessage && (
                <p className='mb-4 text-sm font-medium text-[#4CAF50]'>{successMessage}</p>
            )}
            <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='submission-note' className='text-base font-medium text-[#808080]'>
                        Additional Note
                    </label>
                    <textarea
                        id='submission-note'
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder='Add any notes for your teacher (optional)'
                        className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full min-h-[100px] resize-y'
                    />
                </div>

                <div className='flex flex-col gap-y-2'>
                    <span className='text-base font-medium text-[#808080]'>Upload Your Answer</span>
                    <div
                        onClick={() => !fileData && inputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center w-full min-h-[140px] rounded-xl border-2 border-dashed transition-all duration-200 ${fileData ? 'cursor-default border-gray-200 bg-white' : 'cursor-pointer border-gray-200 bg-white hover:border-[#515DEF] hover:bg-[#515DEF0D]'}`}
                    >
                        <input
                            ref={inputRef}
                            type='file'
                            accept='.pdf,.jpg,.jpeg,.png'
                            className='hidden'
                            onChange={(event) => handleFile(event.target.files?.[0])}
                        />
                        {fileData ? (
                            <div className='flex flex-col items-center gap-2 py-6'>
                                <div className='w-14 h-14 rounded-full bg-[#EDEEF5] flex items-center justify-center'>
                                    <Upload size={24} className='text-[#515DEF]' />
                                </div>
                                <span className='text-sm font-semibold text-[#1E1E1E]'>{fileData.name}</span>
                                <span className='text-xs text-[#667085]'>{fileData.size}</span>
                                <button
                                    type='button'
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        setFileData(null)
                                        if (inputRef.current) inputRef.current.value = ''
                                    }}
                                    className='text-sm text-[#515DEF] hover:underline cursor-pointer'
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div className='flex flex-col items-center gap-2 py-8 px-4'>
                                <div className='w-12 h-12 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center'>
                                    <FileUp className='w-6 h-6 text-[#515DEF]' />
                                </div>
                                <p className='text-sm text-[#667085] text-center'>
                                    <span className='text-[#515DEF] font-medium'>Click to Upload</span>
                                    {' '}or drag and drop
                                </p>
                                <p className='text-xs text-[#667085] text-center'>
                                    Supported formats: PDF, JPG, PNG — up to 5 MB
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex justify-end'>
                    <button
                        type='submit'
                        disabled={submitting}
                        className='bg-[#515DEF] text-white text-sm px-8 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-60'
                    >
                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                </div>
            </form>
        </Section>
    )
}

const ViewHomeFun = ({ routeBase = DEFAULT_ROUTE_BASE, viewMode = 'teacher' }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [studentsModal, setStudentsModal] = useState(null)
    const isStudent = viewMode === 'student'

    const record = getHomeFunItemById(id)
    const submissionRecord = record ? getHomeFunSubmissionRecord(record) : null
    const assessmentType = record ? getRecordAssessmentType(record) : ''
    const isHomework = assessmentType === 'Homework'

    const openStudentsModal = (item, statusType) => {
        setStudentsModal({ record: item, statusType })
    }

    const showTeacherSubmissions = !isStudent && submissionRecord

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(routeBase)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record || (!isStudent && !submissionRecord) ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <h1 className='text-2xl font-semibold text-black'>{record.assignmentId}</h1>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${typeBadgeColor[assessmentType] ?? 'bg-[#EDEEF5] text-[#667085]'}`}>
                                {assessmentType}
                            </span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                {record.status}
                            </span>
                        </div>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{record.assignmentTitle}</span>
                            {' · '}
                            <span>{record.subject}</span>
                            {' · '}
                            <span>Class {record.className}-{record.section}</span>
                        </p>
                    </div>

                    <Section title={isHomework ? 'Homework Information' : 'Assignment Information'}>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Assessment Type' value={assessmentType} />
                            <Field label='Class' value={record.className} />
                            <Field label='Section' value={record.section} />
                            <Field label='Subject' value={record.subject} />
                            <Field
                                label={isHomework ? 'Homework Title' : 'Assignment Title'}
                                value={record.assignmentTitle}
                            />
                            <Field
                                label={isHomework ? 'Homework Description' : 'Assignment Description'}
                                value={record.assignmentDescription}
                            />
                            {!isHomework && <Field label='Total Marks' value={record.totalMarks} />}
                            <Field label='Assigned Date' value={record.assignedDate} />
                            <Field label='Due Date' value={record.dueDate} />
                            <div className='flex flex-col gap-y-1'>
                                <span className='text-base font-medium text-[#808080]'>Upload Document</span>
                                {record.attachment && record.attachment !== '—' ? (
                                    <span className='flex items-center gap-x-2'>
                                        <img src={pdf_icon} alt='attachment' className='w-6 h-6' />
                                        <span className='text-sm text-[#515DEF]'>{record.attachment}</span>
                                    </span>
                                ) : (
                                    <span className='text-sm text-[#1E1E1E]'>—</span>
                                )}
                            </div>
                        </div>
                    </Section>

                    {isStudent && <StudentSubmissionSection record={record} />}

                    {showTeacherSubmissions && (
                        <Section title='Student Submissions'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                                <div className='flex flex-col gap-y-2 p-4 rounded-xl border border-[#EEF0F6] bg-[#FAFBFD]'>
                                    <span className='text-sm font-medium text-[#808080]'>Total Students</span>
                                    <span className='text-2xl font-semibold text-[#1E1E1E]'>{submissionRecord.totalStudents}</span>
                                </div>
                                <SubmissionStatButton
                                    label='Submitted Students'
                                    count={submissionRecord.submittedStudents}
                                    colorClass='text-[#4CAF50]'
                                    statusType='submitted'
                                    record={submissionRecord}
                                    onView={openStudentsModal}
                                />
                                <SubmissionStatButton
                                    label='Pending Students'
                                    count={submissionRecord.pendingStudents}
                                    colorClass={submissionRecord.pendingStudents > 0 ? 'text-[#FF9800]' : 'text-[#667085]'}
                                    statusType='pending'
                                    record={submissionRecord}
                                    onView={openStudentsModal}
                                />
                                <SubmissionStatButton
                                    label='Late Submissions'
                                    count={submissionRecord.lateSubmissions}
                                    colorClass={submissionRecord.lateSubmissions > 0 ? 'text-[#F44336]' : 'text-[#667085]'}
                                    statusType='late'
                                    record={submissionRecord}
                                    onView={openStudentsModal}
                                />
                            </div>
                        </Section>
                    )}
                </>
            )}

            <SubmissionStudentsModal modalState={studentsModal} onClose={() => setStudentsModal(null)} />
        </section>
    )
}

export default ViewHomeFun
