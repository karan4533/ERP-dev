import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import ExamTimelineEditor from './Components/ExamTimelineEditor'
import {
    EXAM_STATUSES,
    SUBJECTS as FALLBACK_SUBJECTS,
    addExamTimetable,
    defaultExamTimetableForm,
    examRecordToForm,
    generateExamId,
    getExamTimetableById,
    getExamTimetableRoutes,
    mapExamApiToTimetableRecord,
    updateExamTimetable,
} from './examinationTimetableData'
import { EXAM_TYPE_OPTIONS } from '../../../Common/ExamSchedule/examScheduleData'
import ClassCatalogStatus from '../../../Common/RBAC/ClassCatalogStatus'
import { useClassCatalogOptions } from '../../../Common/RBAC/useClassCatalogOptions'
import { canUseClassDetailsApi, listSubjects } from '../../../services/classDetailsApi'
import { canUseExamsApi, createExamApi, getExamApi, submitExamApi, updateExamApi } from '../../../services/examsApi'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const toIsoDate = (value) => {
    if (!value) return null
    if (typeof value === 'string') return value.slice(0, 10)
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const completeTimelines = (timelines = []) =>
    timelines.filter((row) => row.day && row.subject && row.startTime && row.endTime)

const CreateExaminationTimetable = () => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { id: editId } = useParams()
    const isEdit = Boolean(editId)
    const { listPath } = getExamTimetableRoutes(pathname)
    const api = canUseExamsApi()
    const [form, setForm] = useState(() => {
        if (editId) {
            // API mode loads the campus record below; the browser copy is only for offline demo.
            const existing = api ? null : getExamTimetableById(editId)
            if (existing) return examRecordToForm(existing)
            return {
                ...defaultExamTimetableForm(),
                examId: editId,
                examType: 'MIDTERM',
            }
        }
        return {
            ...defaultExamTimetableForm(),
            examId: api ? '' : generateExamId(),
            examType: 'MIDTERM',
        }
    })
    const [errors, setErrors] = useState([])
    const [saving, setSaving] = useState(false)
    const [loadingRecord, setLoadingRecord] = useState(Boolean(isEdit && api))
    const [subjectOptions, setSubjectOptions] = useState(FALLBACK_SUBJECTS)
    const catalog = useClassCatalogOptions(form.className)
    const classOptions = catalog.classes
    const sectionOptions = catalog.sections

    useEffect(() => {
        if (!isEdit || !editId) return undefined
        let cancelled = false

        const applyRecord = (record) => {
            if (cancelled || !record) return
            const next = examRecordToForm(record)
            setForm(next)
            const timelineSubjects = (next.timelines || []).map((row) => row.subject).filter(Boolean)
            if (timelineSubjects.length) {
                setSubjectOptions((prev) => [...new Set([...prev, ...timelineSubjects])])
            }
        }

        if (!api) {
            const local = getExamTimetableById(editId)
            if (local) applyRecord(local)
            else setErrors([`Exam timetable ${editId} was not found.`])
            setLoadingRecord(false)
            return undefined
        }

        setLoadingRecord(true)
        getExamApi(editId)
            .then((exam) => {
                if (cancelled) return
                applyRecord(mapExamApiToTimetableRecord(exam))
                setLoadingRecord(false)
            })
            .catch((err) => {
                if (cancelled) return
                setErrors([err?.message || 'Could not load exam timetable.'])
                setLoadingRecord(false)
            })

        return () => { cancelled = true }
    }, [api, editId, isEdit])

    useEffect(() => {
        let cancelled = false
        if (!canUseClassDetailsApi()) return undefined
        listSubjects()
            .then((subjects) => {
                if (cancelled) return
                const subjectNames = (Array.isArray(subjects) ? subjects : [])
                    .map((row) => row.name)
                    .filter(Boolean)
                if (subjectNames.length) setSubjectOptions(subjectNames)
            })
            .catch(() => {
                /* keep subject fallbacks */
            })
        return () => { cancelled = true }
    }, [])

    const updateField = (key, value) => {
        setForm((current) => {
            if (key === 'className' && value !== current.className) {
                return { ...current, className: value, section: '' }
            }
            return { ...current, [key]: value }
        })
    }

    const validate = () => {
        const nextErrors = []
        if (!form.examName) nextErrors.push('Exam name is required.')
        if (!form.className) nextErrors.push('Class is required.')
        if (!form.examType) nextErrors.push('Exam type is required.')
        if (!form.startDate) nextErrors.push('Start date is required.')
        if (!form.endDate) nextErrors.push('End date is required.')
        if (!completeTimelines(form.timelines).length) {
            nextErrors.push('Add at least one complete timeline row (day, subject, start and end time).')
        }
        setErrors(nextErrors)
        return nextErrors.length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return
        const timelines = completeTimelines(form.timelines)
        const publish = form.status === 'Published'
        const payload = {
            name: form.examName,
            examType: form.examType || 'MIDTERM',
            className: form.className,
            section: form.section || '',
            teacherName: '',
            startDate: toIsoDate(form.startDate),
            endDate: toIsoDate(form.endDate),
            timelines,
        }
        if (!api) {
            if (isEdit) updateExamTimetable(editId, { ...form, timelines })
            else addExamTimetable({ ...form, timelines })
            navigate(listPath)
            return
        }
        setSaving(true)
        setErrors([])
        try {
            if (isEdit) {
                // PUT /exams/:id updates schedule/details and reopens Director approval.
                await updateExamApi(editId, payload)
                toast.success('Exam timetable updated and sent for Director approval.')
            } else {
                const created = await createExamApi(payload)
                // Draft → leave as campus draft. Published → submit for Director approval.
                if (publish && created?.id) {
                    await submitExamApi(created.id)
                    toast.success('Exam timetable submitted for Director approval.')
                } else {
                    toast.info('Saved as Draft. Use Edit and save it to send it to the Director.')
                }
            }
            navigate(listPath)
        } catch (err) {
            setErrors([err?.message || 'Could not save exam to campus API.'])
        } finally {
            setSaving(false)
        }
    }

    const gradeOptions = classOptions.length
        ? classOptions
        : (form.className ? [form.className] : [])
    const sectionSelectOptions = sectionOptions.length
        ? sectionOptions
        : (form.section ? [form.section] : [])

    if (loadingRecord) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-sm text-[#667085]'>Loading exam timetable…</p>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 space-y-8'>
                <div>
                    <h2 className='text-xl font-semibold text-black'>
                        {isEdit ? 'Edit Examination Timetable' : 'Create Examination Timetable'}
                    </h2>
                    <p className='text-sm text-[#667085] mt-1'>
                        {isEdit
                            ? 'Update exam details and subject timelines, then save.'
                            : api
                              ? 'Save as Draft to keep it unpublished, or Published to submit it for Director approval.'
                              : 'Enter exam details once, then add multiple exam timelines using Add More. Status Draft/Published is saved on the list.'}
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

                <ClassCatalogStatus status={catalog.status} error={catalog.error} onRetry={catalog.reload} />

                <div>
                    <h3 className='text-lg font-semibold text-black mb-4'>Examination Information</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='exam-id' className='text-base font-medium text-[#1E1E1E]'>Exam ID:</label>
                            <input
                                type='text'
                                id='exam-id'
                                value={form.examId}
                                placeholder={api ? 'Assigned when saved' : ''}
                                readOnly
                                className={inputClass}
                            />
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
                            <label htmlFor='exam-type' className='text-base font-medium text-[#1E1E1E]'>Exam Type:</label>
                            <select
                                id='exam-type'
                                value={form.examType || 'MIDTERM'}
                                onChange={(e) => updateField('examType', e.target.value)}
                                className={selectClass}
                            >
                                {EXAM_TYPE_OPTIONS.map((option) => (
                                    <option key={option.code} value={option.code}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='class' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                            <select id='class' value={form.className} onChange={(e) => updateField('className', e.target.value)} className={selectClass}>
                                <option value=''>Select class</option>
                                {gradeOptions.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                            <select id='section' value={form.section} onChange={(e) => updateField('section', e.target.value)} className={selectClass}>
                                <option value=''>All / Select section</option>
                                {sectionSelectOptions.map((section) => (
                                    <option key={section} value={section}>{section}</option>
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
                    subjects={subjectOptions}
                    classSelected={Boolean(form.className)}
                />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSubmit}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Timetable'}
                </button>
            </div>
        </section>
    )
}

export default CreateExaminationTimetable
