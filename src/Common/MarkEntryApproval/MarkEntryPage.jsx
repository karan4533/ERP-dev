import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download, Upload } from 'lucide-react'
import ExportModal from '../CommonComponents/ExportModal'
import EntryClosureGate from '../demoDomain/EntryClosureGate'
import { entryBlocked } from '../demoDomain/governance'
import IncompleteMarksModal from '../../Pages/Teacher/StudentEvaluation/MarkEntry/Components/IncompleteMarksModal'
import SubmitMarksConfirmModal from '../../Pages/Teacher/StudentEvaluation/MarkEntry/Components/SubmitMarksConfirmModal'
import {
    ACADEMIC_YEARS,
    CLASSES,
    EXAM_OPTIONS,
    SECTIONS,
    STATUS_FILTERS,
    SUBJECTS,
    TERMS,
    buildContextKey,
    createEmptyEntries,
    filterStudentsForTable,
    formatClassLabel,
    getEntryWithComputed,
    getExamMaxMarks,
    getMarkEntryStats,
    getSessionStatusColor,
    getSessionStatusLabel,
    isSessionLocked,
    loadMarkEntrySession,
    resultBadgeColor,
    saveMarkEntrySession,
    submitMarkEntrySession,
} from './markEntryApprovalData'
import {
    canUseExamsApi,
    createMarksBatchApi,
    getMarksBatchApi,
    listExamsApi,
    listMarksBatchesApi,
    listSectionNamesForClassApi,
    mapExamFromApi,
    mapMarksBatchFromApi,
    requestMarksCorrectionApi,
    reviseMarksBatchApi,
    submitMarksBatchApi,
    updateMarksBatchEntriesApi,
} from '../../services/examsApi'
import {
    batchStatusMessage,
    examEntryState,
    isPublishedBatch,
    mapBatchStatus,
    needsRevision,
    pickLatestBatch,
} from './markEntryStatus'
import { listStudentsApi, mapStudentListFromApi } from '../../services/studentsApi'
import {
    canUseClassDetailsApi,
    listAcademicYears,
    listSubjects,
    loadClassDirectory,
} from '../../services/classDetailsApi'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2.5 w-full bg-white'

const formatDate = (date) => {
    if (!date) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

const parseDisplayDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = value.split('/').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const getSubmitMessage = (session) => {
    if (session?.source === 'api') return batchStatusMessage(session)
    if (!session || session.status !== 'submitted') return ''
    if (session.approvalStatus === 'Pending') {
        return 'Marks submitted to the Director for review. They will be visible to students only after approval.'
    }
    if (session.approvalStatus === 'Approved') {
        return 'Marks approved by the Director and published to the student portal.'
    }
    if (session.approvalStatus === 'Rejected') {
        return session.rejectionReason
            ? `Marks rejected by the Director: ${session.rejectionReason}. Please revise and resubmit.`
            : 'Marks rejected by the Director. Please revise and resubmit.'
    }
    return 'Marks have already been submitted for this examination.'
}

const batchSessionFields = (batch) => ({
    batchId: batch?.id || null,
    version: batch?.version ?? null,
    awaitingRole: batch?.awaitingRole || null,
    awaitingEligibleApprover: Boolean(batch?.awaitingEligibleApprover),
    rejectionReason: batch?.rejectionReason || '',
    ...mapBatchStatus(batch),
})

const entriesPayloadFromSession = (session) =>
    session.students
        .map((student) => {
            const entry = session.entries[student.id] || {}
            const absent = Boolean(entry.absent)
            const hasMarks = entry.obtainedMarks !== null && entry.obtainedMarks !== undefined && entry.obtainedMarks !== ''
            if (!absent && !hasMarks) return null
            return {
                studentId: student.id,
                marks: absent ? null : Number(entry.obtainedMarks),
                absent,
                remarks: entry.remarks || '',
            }
        })
        .filter(Boolean)

const MarkEntryPage = ({ submittedByRole = 'Teacher' }) => {
    const api = canUseExamsApi()
    const [yearOptions, setYearOptions] = useState(ACADEMIC_YEARS)
    const [classOptions, setClassOptions] = useState(() => (api ? [] : CLASSES))
    const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0])
    const [term, setTerm] = useState(TERMS[0])
    const [correctionMode, setCorrectionMode] = useState(false)
    const [correctionReason, setCorrectionReason] = useState('')
    const [correctionModal, setCorrectionModal] = useState(false)
    const [exam, setExam] = useState(EXAM_OPTIONS[0].name)
    const [examId, setExamId] = useState('')
    const [campusExams, setCampusExams] = useState([])
    const [examsLoaded, setExamsLoaded] = useState(false)
    const [apiSections, setApiSections] = useState({ forClass: '', names: [] })
    const [apiSubjects, setApiSubjects] = useState([])
    const [className, setClassName] = useState(() => (api ? '' : (CLASSES[0] || '')))
    const [section, setSection] = useState(() => (api ? '' : (SECTIONS[0] || '')))
    const [subject, setSubject] = useState(() => (api ? '' : (SUBJECTS[0] || '')))
    const [examDate, setExamDate] = useState(parseDisplayDate('15/07/2026'))
    const [catalogError, setCatalogError] = useState('')

    const catalogEmpty = api
        ? Boolean(catalogError) || (examsLoaded && classOptions.length === 0)
        : (classOptions.length === 0 || SECTIONS.length === 0 || SUBJECTS.length === 0)

    const [session, setSession] = useState(null)
    const [loaded, setLoaded] = useState(false)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [exportModal, setExportModal] = useState(false)
    const [incompleteModal, setIncompleteModal] = useState(false)
    const [submitModal, setSubmitModal] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')
    const [submitMessage, setSubmitMessage] = useState('')

    useEffect(() => {
        if (!api) return undefined
        let cancelled = false
        listExamsApi()
            .then((rows) => {
                if (cancelled) return
                const mapped = rows.map(mapExamFromApi)
                setCampusExams(mapped)
                setExamsLoaded(true)
                if (mapped.length > 0) {
                    setExamId((current) => current || mapped[0].id)
                    setExam((current) => (current === EXAM_OPTIONS[0].name ? mapped[0].name : current))
                    if (mapped[0].className) setClassName(mapped[0].className)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCampusExams([])
                    setExamsLoaded(true)
                }
            })
        return () => {
            cancelled = true
        }
    }, [api])

    useEffect(() => {
        if (!canUseClassDetailsApi()) return undefined
        let cancelled = false
        setCatalogError('')
        Promise.all([listAcademicYears(), loadClassDirectory(), listSubjects()])
            .then(([years, directory, subjects]) => {
                if (cancelled) return
                const yearNames = (Array.isArray(years) ? years : []).map((row) => row.name).filter(Boolean)
                if (yearNames.length) {
                    setYearOptions(yearNames)
                    setAcademicYear((current) => (yearNames.includes(current) ? current : yearNames[0]))
                }
                const records = Array.isArray(directory?.records) ? directory.records : []
                const classNames = records.map((row) => row.className).filter(Boolean)
                setClassOptions(classNames)
                if (classNames.length) {
                    setClassName((current) => (classNames.includes(current) ? current : classNames[0]))
                }
                const subjectNames = (Array.isArray(subjects) ? subjects : []).map((row) => row.name).filter(Boolean)
                setApiSubjects(subjectNames)
                if (subjectNames.length) {
                    setSubject((current) => (subjectNames.includes(current) ? current : subjectNames[0]))
                }
                if (!classNames.length) {
                    setCatalogError('No active classes in Class Details. Ask an Admin to configure classes and sections.')
                }
            })
            .catch((err) => {
                if (cancelled) return
                // API mode: never fall back to hardcoded A/B/C — surface the failure.
                setClassOptions([])
                setApiSubjects([])
                setCatalogError(err?.message || 'Could not load classes and sections from the server.')
            })
        return () => { cancelled = true }
    }, [])

    const stats = useMemo(() => {
        if (!session) return null
        return getMarkEntryStats(session.students, session.entries, session.maxMarks)
    }, [session])

    const filteredStudents = useMemo(() => {
        if (!session) return []
        return filterStudentsForTable(session.students, session.entries, { search, statusFilter })
    }, [session, search, statusFilter])

    const selectedExam = api ? campusExams.find((item) => item.id === examId) || null : null
    const examClassName = selectedExam?.className || ''
    const examState = api ? examEntryState(selectedExam) : { open: true, reason: '' }

    useEffect(() => {
        if (!api || !examClassName) return undefined
        let cancelled = false
        listSectionNamesForClassApi(examClassName)
            .then((names) => {
                if (cancelled) return
                setApiSections({ forClass: examClassName, names })
                setSection((current) => (names.includes(current) ? current : names[0] || ''))
            })
            .catch(() => {
                if (!cancelled) setApiSections({ forClass: examClassName, names: [] })
            })
        return () => {
            cancelled = true
        }
    }, [api, examClassName])

    const sectionOptions = api ? (apiSections.forClass === examClassName ? apiSections.names : []) : SECTIONS
    const subjectOptions = api ? apiSubjects : SUBJECTS
    const awaitingRevision = needsRevision(session)
    const published = isPublishedBatch(session)
    const isLocked = (isSessionLocked(session) || awaitingRevision) && !correctionMode

    const handleLoadStudents = async () => {
        setCorrectionMode(false)
        setCorrectionReason('')
        if (api && !examState.open) {
            setSaveMessage(examState.reason)
            setLoaded(false)
            setSession(null)
            return
        }
        if (!className || !section || !subject) {
            setSaveMessage('Select class, section, and subject before entering marks.')
            setLoaded(false)
            setSession(null)
            return
        }

        if (!api) {
            const nextSession = loadMarkEntrySession({
                academicYear,
                term,
                exam,
                className,
                section,
                subject,
                examDate: formatDate(examDate),
                maxMarks: getExamMaxMarks(exam),
            })
            setSession(nextSession)
            setLoaded(true)
            setSearch('')
            setStatusFilter('All')
            setSaveMessage(
                nextSession.students.length === 0
                    ? 'No students are assigned to this class and section yet.'
                    : '',
            )
            setSubmitMessage(getSubmitMessage(nextSession))
            return
        }

        if (!examId) {
            setSaveMessage('Select a campus exam (approved schedule) before entering marks.')
            return
        }
        if (selectedExam?.className && selectedExam.className !== className) {
            setSaveMessage(`This exam is for ${selectedExam.className}. Marks can only be entered for that class.`)
            return
        }

        setLoading(true)
        setSaveMessage('')
        try {
            const [studentRows, batches] = await Promise.all([
                listStudentsApi({ className }),
                listMarksBatchesApi({ examId, mine: true }),
            ])
            const students = studentRows
                .map(mapStudentListFromApi)
                .filter((row) => {
                    const placed = String(row.placementStatus || '').toLowerCase() === 'placed'
                    const sectionMatch = String(row.section || '').trim() === String(section || '').trim()
                    return placed && sectionMatch
                })
                .map((row) => ({
                    ...row,
                    rollNumber: row.rollNumber || row.admissionNumber || '',
                    section: row.section || section,
                }))
            const match = pickLatestBatch(batches.map(mapMarksBatchFromApi), { subject, section })
            let batchDetail = match
            if (match?.id) {
                batchDetail = mapMarksBatchFromApi(await getMarksBatchApi(match.id))
            }
            const context = {
                academicYear: selectedExam?.academicYear || academicYear,
                term,
                exam,
                examId,
                className,
                section,
                subject,
                examDate: formatDate(examDate),
                maxMarks: Number(batchDetail?.maxMarks) || getExamMaxMarks(exam) || 100,
            }
            const entries = createEmptyEntries(students)
            if (Array.isArray(batchDetail?.entries)) {
                batchDetail.entries.forEach((entry) => {
                    entries[String(entry.studentId)] = {
                        obtainedMarks: entry.marks ?? null,
                        absent: Boolean(entry.absent),
                        remarks: entry.remarks || '',
                    }
                })
            }
            const nextSession = {
                contextKey: buildContextKey(context),
                ...context,
                ...batchSessionFields(batchDetail),
                entries,
                students,
                source: 'api',
            }
            setSession(nextSession)
            setLoaded(true)
            setSearch('')
            setStatusFilter('All')
            setSaveMessage(students.length === 0 ? 'No students found for this class.' : '')
            setSubmitMessage(getSubmitMessage(nextSession))
        } catch (err) {
            setLoaded(false)
            setSession(null)
            setSaveMessage(err?.message || 'Could not load mark entry from campus API.')
        } finally {
            setLoading(false)
        }
    }

    const updateEntry = (studentId, patch) => {
        setSession((current) => {
            if (!current) return current
            const existing = current.entries[studentId] ?? { obtainedMarks: null, absent: false, remarks: '' }
            let nextEntry = { ...existing, ...patch }

            if (patch.absent) {
                nextEntry = { ...nextEntry, obtainedMarks: null }
            }

            if (patch.obtainedMarks !== undefined && patch.obtainedMarks !== null && patch.obtainedMarks !== '') {
                nextEntry = { ...nextEntry, absent: false }
            }

            return {
                ...current,
                entries: {
                    ...current.entries,
                    [studentId]: nextEntry,
                },
            }
        })
        setSaveMessage('')
        setSubmitMessage('')
    }

    const handleSaveDraft = async () => {
        if (!api && entryBlocked('Mark Entry', submittedByRole)) return
        if (!session || isLocked) return
        if (!api || session.source !== 'api') {
            const saved = saveMarkEntrySession({ ...session, status: 'draft', approvalStatus: null })
            setSession(saved)
            setSaveMessage('Draft saved successfully. You can continue entering marks later.')
            return
        }
        const entries = entriesPayloadFromSession(session)
        if (entries.length === 0) {
            setSaveMessage('Enter marks or mark absent for at least one student before saving draft.')
            return
        }
        try {
            let batch
            if (session.batchId) {
                batch = mapMarksBatchFromApi(await updateMarksBatchEntriesApi(session.batchId, entries))
            } else {
                batch = mapMarksBatchFromApi(
                    await createMarksBatchApi({
                        examId: session.examId,
                        subject: session.subject,
                        section: session.section,
                        maxMarks: session.maxMarks,
                        entries,
                    }),
                )
            }
            setSession((current) => ({
                ...current,
                ...batchSessionFields(batch),
                maxMarks: batch.maxMarks ?? current.maxMarks,
            }))
            setSaveMessage('Draft saved to campus marks batch. You can continue entering marks later.')
            setSubmitMessage('')
        } catch (err) {
            setSaveMessage(err?.message || 'Could not save draft to campus API.')
        }
    }

    const handleSubmitClick = () => {
        if (!session || !stats) return
        if (isLocked && !correctionMode) return
        if (stats.pending > 0) {
            setIncompleteModal(true)
            return
        }
        if (correctionMode) {
            setCorrectionModal(true)
            return
        }
        setSubmitModal(true)
    }

    const handleRevise = async () => {
        if (!awaitingRevision || !session?.batchId) return
        try {
            const revised = mapMarksBatchFromApi(await reviseMarksBatchApi(session.batchId))
            const nextSession = { ...session, ...batchSessionFields(revised) }
            setSession(nextSession)
            setCorrectionMode(false)
            setSubmitMessage('')
            setSaveMessage(`Version ${revised.version} created as a draft with the same marks. Correct them, save and submit again.`)
        } catch (err) {
            setSaveMessage(err?.message || 'Could not revise this marks batch.')
        }
    }

    const handleStartCorrection = () => {
        if (!published || !session?.batchId) return
        setCorrectionMode(true)
        setCorrectionReason('')
        setSaveMessage('Correction mode: edit marks, then submit the correction for Principal → Director approval.')
        setSubmitMessage('')
    }

    const handleConfirmCorrection = async () => {
        if (!correctionMode || !session?.batchId) return
        const reason = String(correctionReason || '').trim()
        if (!reason) {
            setSaveMessage('Enter a reason for the marks correction.')
            return
        }
        const entries = entriesPayloadFromSession(session)
        if (!entries.length) {
            setSaveMessage('Enter corrected marks (or mark absent) before requesting a correction.')
            return
        }
        try {
            const corrected = mapMarksBatchFromApi(
                await requestMarksCorrectionApi(session.batchId, { reason, entries }),
            )
            const nextSession = {
                ...session,
                ...batchSessionFields(corrected),
                submittedByRole,
                submittedAt: corrected.submittedAt || new Date().toISOString(),
            }
            setSession(nextSession)
            setCorrectionMode(false)
            setCorrectionModal(false)
            setCorrectionReason('')
            setSubmitMessage(batchStatusMessage(nextSession))
            setSaveMessage(`Correction v${corrected.version} submitted. Principal then Director must approve before parents see the new marks.`)
        } catch (err) {
            setSaveMessage(err?.message || 'Could not request marks correction.')
        }
    }

    const handleConfirmSubmit = async () => {
        if (!api && entryBlocked('Mark Entry', submittedByRole)) return
        if (!session || isLocked) return
        if (correctionMode) {
            setSubmitModal(false)
            setCorrectionModal(true)
            return
        }
        if (!api || session.source !== 'api') {
            const submitted = submitMarkEntrySession(session, { submittedByRole })
            setSession(submitted)
            setSubmitModal(false)
            setSubmitMessage(getSubmitMessage(submitted))
            setSaveMessage('')
            return
        }
        const entries = entriesPayloadFromSession(session)
        try {
            let batchId = session.batchId
            if (!batchId) {
                const created = mapMarksBatchFromApi(
                    await createMarksBatchApi({
                        examId: session.examId,
                        subject: session.subject,
                        section: session.section,
                        maxMarks: session.maxMarks,
                        entries,
                    }),
                )
                batchId = created.id
            } else {
                await updateMarksBatchEntriesApi(batchId, entries)
            }
            const submitted = mapMarksBatchFromApi(await submitMarksBatchApi(batchId))
            const nextSession = {
                ...session,
                ...batchSessionFields(submitted),
                submittedByRole,
                submittedAt: submitted.submittedAt || new Date().toISOString(),
            }
            setSession(nextSession)
            setSubmitModal(false)
            setSubmitMessage(batchStatusMessage(nextSession))
            setSaveMessage('')
        } catch (err) {
            setSubmitModal(false)
            setSaveMessage(err?.message || 'Could not submit marks batch.')
        }
    }

    return (
        <section className='space-y-6'>
            {!api && <EntryClosureGate moduleName='Mark Entry' actor={submittedByRole} />}
            <div>
                <h1 className='text-2xl font-semibold text-black'>Mark Entry</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    {api
                        ? 'Enter marks for an approved exam. Submitted marks go to the Coordinator, then the Principal, then the Director; students and parents see them only after the Director publishes them.'
                        : 'Enter examination marks for students. Submitted marks are sent to the Director for approval before publishing to students.'}
                </p>
            </div>

            {catalogEmpty && (
                <div className='bg-white rounded-2xl shadow-md p-6 border border-[#EDEEF5]'>
                    <h2 className='text-lg font-semibold text-[#0C1E5B]'>
                        {catalogError ? 'Class catalog unavailable' : 'No classes or subjects yet'}
                    </h2>
                    <p className='text-sm text-[#667085] mt-2'>
                        {catalogError
                            || 'Ask an Administrator to create classes and sections under Class Details, subjects under RBAC, and students under User Creation before using Mark Entry.'}
                    </p>
                </div>
            )}

            {saveMessage && !loaded && (
                <div className='rounded-xl border border-[#FF980033] bg-[#FFF8E1] px-4 py-3 text-sm text-[#E65100]'>
                    {saveMessage}
                </div>
            )}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='academic-year' className='text-base font-medium text-[#808080]'>Academic Year</label>
                        <select id='academic-year' value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={inputClass}>
                            {yearOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='term' className='text-base font-medium text-[#808080]'>Term</label>
                        <select id='term' value={term} onChange={(e) => setTerm(e.target.value)} className={inputClass}>
                            {TERMS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='exam' className='text-base font-medium text-[#808080]'>Exam</label>
                        {api ? (
                            <select
                                id='exam'
                                value={examId}
                                onChange={(e) => {
                                    const next = campusExams.find((item) => item.id === e.target.value)
                                    setExamId(e.target.value)
                                    if (next) {
                                        setExam(next.name)
                                        if (next.className) setClassName(next.className)
                                    }
                                }}
                                className={inputClass}
                            >
                                <option value=''>Select campus exam</option>
                                {campusExams.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} — {item.className} ({item.status || 'scheduled'})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select id='exam' value={exam} onChange={(e) => setExam(e.target.value)} className={inputClass}>
                                {EXAM_OPTIONS.map((item) => (
                                    <option key={item.name} value={item.name}>{item.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class'
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            disabled={Boolean(selectedExam?.className)}
                            title={selectedExam?.className ? 'Class comes from the selected exam' : undefined}
                            className={`${inputClass} disabled:bg-[#F2F4F7]`}
                        >
                            {selectedExam?.className && !CLASSES.includes(selectedExam.className) ? (
                                <option value={selectedExam.className}>{formatClassLabel(selectedExam.className)}</option>
                            ) : null}
                            <option value=''>Select class</option>
                            {classOptions.map((item) => (
                                <option key={item} value={item}>{formatClassLabel(item)}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section' className='text-base font-medium text-[#808080]'>Section</label>
                        <select id='section' value={section} onChange={(e) => setSection(e.target.value)} className={inputClass}>
                            <option value=''>Select section</option>
                            {sectionOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='subject' className='text-base font-medium text-[#808080]'>Subject</label>
                        <select id='subject' value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass}>
                            <option value=''>Select subject</option>
                            {subjectOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Exam Date</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={examDate}
                                onChange={(date) => setExamDate(date)}
                                dateFormat='dd/MM/yyyy'
                                disabled={isLocked}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2.5 pr-10 focus:outline-none disabled:bg-[#F2F4F7]'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex items-end'>
                        <button
                            type='button'
                            disabled={loading}
                            onClick={handleLoadStudents}
                            className='w-full bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-60'
                        >
                            {loading ? 'Loading…' : 'Load Students'}
                        </button>
                    </div>
                </div>
                {api && selectedExam && !examState.open ? (
                    <div className='mt-4 rounded-xl border border-[#FDBA74] bg-[#FFF7ED] px-4 py-3 text-sm text-[#9A3412]' role='status'>
                        <p className='font-medium'>Mark entry is closed for {selectedExam.name}.</p>
                        <p className='mt-1'>{examState.reason}</p>
                    </div>
                ) : null}
                {api && examsLoaded && campusExams.length === 0 ? (
                    <div className='mt-4 rounded-xl border border-[#FDBA74] bg-[#FFF7ED] px-4 py-3 text-sm text-[#9A3412]' role='status'>
                        No exam schedules exist yet. Marks can be entered once the Principal creates an exam and the Director approves it.
                    </div>
                ) : null}
            </div>

            {loaded && session && (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-xl font-semibold text-black mb-4'>Exam Information</h2>
                        <div className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4'>
                            <h3 className='text-lg font-semibold text-[#0C1E5B]'>{exam} Examination</h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 mt-4 text-sm'>
                                <p><span className='text-[#808080]'>Academic Year :</span> <span className='text-[#1E1E1E]'>{session.academicYear || academicYear}</span></p>
                                <p><span className='text-[#808080]'>Term :</span> <span className='text-[#1E1E1E]'>{term}</span></p>
                                <p><span className='text-[#808080]'>Class :</span> <span className='text-[#1E1E1E]'>{formatClassLabel(className)}</span></p>
                                <p><span className='text-[#808080]'>Section :</span> <span className='text-[#1E1E1E]'>{section}</span></p>
                                <p><span className='text-[#808080]'>Subject :</span> <span className='text-[#1E1E1E]'>{subject}</span></p>
                                <p><span className='text-[#808080]'>Maximum Marks :</span> <span className='text-[#1E1E1E]'>{session.maxMarks}</span></p>
                                <p><span className='text-[#808080]'>Exam Date :</span> <span className='text-[#1E1E1E]'>{formatDate(examDate)}</span></p>
                                <p>
                                    <span className='text-[#808080]'>Status :</span>{' '}
                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getSessionStatusColor(session)}`}>
                                        {getSessionStatusLabel(session)}
                                    </span>
                                </p>
                                {session.submittedByRole ? (
                                    <p><span className='text-[#808080]'>Submitted By :</span> <span className='text-[#1E1E1E]'>{session.submittedByRole}</span></p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-xl font-semibold text-black mb-4'>Mark Entry Summary</h2>
                        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4'>
                            {[
                                { label: 'Total Students', value: stats.totalStudents },
                                { label: 'Marks Entered', value: stats.marksEntered },
                                { label: 'Pending', value: stats.pending },
                                { label: 'Absent', value: stats.absent },
                                { label: 'Average Mark', value: stats.averageMark },
                                { label: 'Highest Mark', value: stats.highestMark },
                            ].map((item) => (
                                <div key={item.label} className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4 text-center'>
                                    <span className='text-sm text-[#808080]'>{item.label}</span>
                                    <p className='text-2xl font-semibold text-[#0C1E5B] mt-2'>{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className='mt-4 rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4 inline-block min-w-[180px]'>
                            <span className='text-sm text-[#808080]'>Lowest Mark</span>
                            <p className='text-2xl font-semibold text-[#0C1E5B] mt-2'>{stats.lowestMark}</p>
                        </div>
                    </div>

                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4'>
                            <div className='flex flex-col gap-y-2 flex-1 max-w-md'>
                                <label htmlFor='search-student' className='text-base font-medium text-[#808080]'>Search Student</label>
                                <input
                                    id='search-student'
                                    type='text'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder='Search by name, roll number, admission number...'
                                    className={inputClass}
                                />
                            </div>
                            <div className='flex flex-col gap-y-2 w-full lg:max-w-xs'>
                                <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status Filter</label>
                                <select id='status-filter' value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
                                    {STATUS_FILTERS.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                    <tr>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>S.No.</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Roll No.</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission No.</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Maximum Marks</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Obtained Marks</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Absent</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Grade</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Percentage</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Result</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Teacher Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className='px-2 py-8 text-center text-[#667085]'>
                                                {session.students.length === 0
                                                    ? 'No students in this class yet. Create students under Admin → RBAC → User Creation.'
                                                    : 'No students match the selected filters.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student, index) => {
                                            const entry = getEntryWithComputed(
                                                session.entries[student.id] ?? { obtainedMarks: null, absent: false, remarks: '' },
                                                session.maxMarks,
                                            )
                                            const rollDisplay = String(student.rollNumber).replace(/^.*-(\d+)$/, '$1').slice(-2)
                                                || String(index + 1).padStart(2, '0')

                                            return (
                                                <tr key={student.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                                    <td className='px-2 py-3 rounded-s-lg'>{index + 1}</td>
                                                    <td className='px-2 py-3'>{rollDisplay}</td>
                                                    <td className='px-2 py-3 font-medium text-[#1E1E1E]'>{student.name}</td>
                                                    <td className='px-2 py-3'>{student.admissionNumber}</td>
                                                    <td className='px-2 py-3'>{session.maxMarks}</td>
                                                    <td className='px-2 py-3'>
                                                        <input
                                                            type='number'
                                                            min='0'
                                                            max={session.maxMarks}
                                                            disabled={entry.absent || isLocked}
                                                            value={entry.absent ? '' : (entry.obtainedMarks ?? '')}
                                                            placeholder='--'
                                                            onChange={(e) => updateEntry(student.id, { obtainedMarks: e.target.value === '' ? null : e.target.value })}
                                                            className='w-20 text-sm border border-[#D9D9D9] rounded-md px-2 py-1.5 disabled:bg-[#F2F4F7] disabled:text-[#667085]'
                                                        />
                                                    </td>
                                                    <td className='px-2 py-3'>
                                                        <label className='inline-flex items-center gap-2 cursor-pointer'>
                                                            <input
                                                                type='checkbox'
                                                                checked={entry.absent}
                                                                disabled={isLocked}
                                                                onChange={(e) => updateEntry(student.id, { absent: e.target.checked })}
                                                                className='rounded border-[#D9D9D9] text-[#515DEF] focus:ring-[#515DEF]'
                                                            />
                                                            <span className='text-xs'>Absent</span>
                                                        </label>
                                                    </td>
                                                    <td className='px-2 py-3 font-medium text-[#1E1E1E]'>{entry.grade}</td>
                                                    <td className='px-2 py-3'>{entry.displayPercent}</td>
                                                    <td className='px-2 py-3'>
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${resultBadgeColor[entry.result] ?? resultBadgeColor['—']}`}>
                                                            {entry.result}
                                                        </span>
                                                    </td>
                                                    <td className='px-2 py-3 rounded-e-lg min-w-[180px]'>
                                                        <input
                                                            type='text'
                                                            value={entry.remarks ?? ''}
                                                            disabled={isLocked}
                                                            placeholder='Optional remark...'
                                                            onChange={(e) => updateEntry(student.id, { remarks: e.target.value })}
                                                            className='w-full text-sm border border-[#D9D9D9] rounded-md px-2 py-1.5 disabled:bg-[#F2F4F7]'
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {(saveMessage || submitMessage) && (
                        <div className={`rounded-xl p-4 text-sm ${
                            submitMessage && session?.approvalStatus === 'Rejected'
                                ? 'bg-[#FDF3F4] border border-[#F5D7DA] text-[#980E0F]'
                                : submitMessage
                                    ? 'bg-[#F1FCF2] border border-[#D1E7CC] text-[#0B6D2C]'
                                    : 'bg-[#515DEF0D] border border-[#515DEF33] text-[#515DEF]'
                        }`}>
                            {submitMessage || saveMessage}
                        </div>
                    )}

                    <div className='bg-white rounded-2xl shadow-md p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
                        <div className='flex flex-wrap gap-3'>
                            <button
                                type='button'
                                onClick={() => alert('Import marks from spreadsheet will be available in a future update.')}
                                className='bg-white text-[#515DEF] text-sm px-4 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF0D] transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                            >
                                <Upload size={16} />
                                Import Marks
                            </button>
                            <button
                                type='button'
                                onClick={() => setExportModal(true)}
                                className='bg-white text-[#515DEF] text-sm px-4 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF0D] transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                            >
                                <Download size={16} />
                                Export
                            </button>
                        </div>
                        <div className='flex flex-wrap gap-3'>
                            {awaitingRevision ? (
                                <button
                                    type='button'
                                    onClick={handleRevise}
                                    className='bg-white text-[#980E0F] text-sm px-6 py-2.5 rounded-md border border-[#980E0F] hover:bg-[#FDF3F4] transition-all duration-200 cursor-pointer'
                                >
                                    Revise (new version)
                                </button>
                            ) : null}
                            {published && !correctionMode ? (
                                <button
                                    type='button'
                                    onClick={handleStartCorrection}
                                    className='bg-white text-[#980E0F] text-sm px-6 py-2.5 rounded-md border border-[#980E0F] hover:bg-[#FDF3F4] transition-all duration-200 cursor-pointer'
                                >
                                    Request correction
                                </button>
                            ) : null}
                            <button
                                type='button'
                                onClick={handleSaveDraft}
                                disabled={isLocked || published}
                                className='bg-white text-[#515DEF] text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:bg-[#515DEF0D] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Save Draft
                            </button>
                            <button
                                type='button'
                                onClick={handleSubmitClick}
                                disabled={isLocked && !correctionMode}
                                className='bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {correctionMode ? 'Submit correction' : 'Submit for Approval'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='mark-entry-page'
                rows={Array.isArray(session?.students) ? session.students : []}
                exportDescription={<>You are exporting {Array.isArray(session?.students) ? session.students.length : 0} record(s).</>}
            />
            <IncompleteMarksModal open={incompleteModal} onClose={() => setIncompleteModal(false)} stats={stats} />
            <SubmitMarksConfirmModal
                open={submitModal}
                onClose={() => setSubmitModal(false)}
                onConfirm={handleConfirmSubmit}
                stats={stats}
                examLabel={`${exam} — ${formatClassLabel(className)} Section ${section} — ${subject}`}
            />
            {correctionModal ? (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
                    <div className='w-full max-w-md rounded-lg bg-white p-5 shadow-lg'>
                        <h3 className='text-lg font-semibold text-[#0C1E5B]'>Request marks correction</h3>
                        <p className='mt-2 text-sm text-[#475467]'>
                            Principal then Director must approve. Parents keep seeing published marks until then.
                        </p>
                        <label className='mt-4 block text-sm font-medium text-[#344054]'>
                            Reason
                            <textarea
                                className={`${inputClass} mt-1 min-h-[96px]`}
                                value={correctionReason}
                                onChange={(event) => setCorrectionReason(event.target.value)}
                                placeholder='Why do these marks need correction?'
                            />
                        </label>
                        <div className='mt-4 flex justify-end gap-2'>
                            <button
                                type='button'
                                className='rounded-md border border-[#D0D5DD] px-4 py-2 text-sm'
                                onClick={() => setCorrectionModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type='button'
                                className='rounded-md bg-[#515DEF] px-4 py-2 text-sm text-white'
                                onClick={handleConfirmCorrection}
                            >
                                Submit correction
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    )
}

export default MarkEntryPage
