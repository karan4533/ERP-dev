import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import ClassTimelineEditor from './Components/ClassTimelineEditor'
import {
    TERMS,
    addClassTimetable,
    canSaveClassTimetables,
    classRecordToForm,
    defaultClassTimetableForm,
    findTimetableConflicts,
    generateTimetableId,
    getClassTimetableById,
    getTimetableHydrateError,
    getTimetableHydrateStatus,
    getTimetableRoutes,
    hydrateClassTimetablesFromApi,
    isTimetableSaveInFlight,
    loadAcademicYearOptions,
    loadClassTimetableTeacherOptions,
    updateClassTimetable,
} from './classTimetableData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const CreateClassTimetable = () => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { id: editId } = useParams()
    const isEdit = Boolean(editId)
    const { listPath } = getTimetableRoutes(pathname)
    const createdByRole = pathname.startsWith('/coordinator')
        ? 'Coordinator'
        : pathname.startsWith('/director')
          ? 'Director'
          : 'Principal'

    const [form, setForm] = useState(() => ({
        ...defaultClassTimetableForm(),
        timetableId: generateTimetableId(),
    }))
    const [errors, setErrors] = useState([])
    const [teachers, setTeachers] = useState([])
    const [academicYears, setAcademicYears] = useState([])
    const [loadingTeachers, setLoadingTeachers] = useState(true)
    const [loadingYears, setLoadingYears] = useState(true)
    const [recordLoading, setRecordLoading] = useState(isEdit)
    const [hydrateOk, setHydrateOk] = useState(false)
    const [hydrateError, setHydrateError] = useState('')
    const [saving, setSaving] = useState(false)

    const load = async () => {
        setLoadingTeachers(true)
        setLoadingYears(true)
        setRecordLoading(isEdit)
        const [allocOk, teacherRows, yearRows] = await Promise.all([
            hydrateClassTimetablesFromApi({ force: true }),
            loadClassTimetableTeacherOptions({ viewerPath: pathname }),
            loadAcademicYearOptions(),
        ])
        setTeachers(teacherRows || [])
        const years = Array.isArray(yearRows) ? yearRows : []
        setAcademicYears(years)
        const currentYear = years.find((y) => y.isCurrent)?.name || years[0]?.name || ''
        const status = getTimetableHydrateStatus()
        setHydrateOk(allocOk || status === 'ready' || status === 'idle')
        setHydrateError(getTimetableHydrateError())
        if (isEdit) {
            const record = getClassTimetableById(editId)
            if (!record) {
                setErrors(['Class timetable not found.'])
            } else {
                const nextForm = classRecordToForm(record)
                if (nextForm.academicYear && !years.some((y) => y.name === nextForm.academicYear)) {
                    setAcademicYears([{ id: nextForm.academicYear, name: nextForm.academicYear, isCurrent: false }, ...years])
                }
                setForm(nextForm)
            }
        } else {
            setForm((current) => ({
                ...current,
                timetableId: current.timetableId || generateTimetableId(),
                academicYear: current.academicYear || currentYear,
            }))
        }
        setRecordLoading(false)
        setLoadingTeachers(false)
        setLoadingYears(false)
    }

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            await load()
            if (cancelled) return
        })()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, editId, pathname])

    const updateField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const selectOwnerTeacher = (employeeId) => {
        const selected = teachers.find((item) => item.employeeId === employeeId)
        setForm((current) => ({
            ...current,
            ownerTeacherId: selected?.employeeId || '',
            ownerTeacherName: selected?.name || '',
            ownerTeacherEmail: selected?.email || '',
            timelines: current.timelines.map((row) => ({
                ...row,
                teacher: selected?.name || '',
                className: '',
                section: '',
                subject: '',
            })),
        }))
    }

    const validate = () => {
        const nextErrors = []
        if (!form.academicYear) nextErrors.push('Academic year is required.')
        if (!form.ownerTeacherId) nextErrors.push('Select the teacher this timetable belongs to.')
        if (!form.timelines.some((row) => (
            row.day && row.className && row.section && row.subject && row.startTime && row.endTime
        ))) {
            nextErrors.push('Add at least one complete timeline row (day, class, section, subject, and times).')
        }
        nextErrors.push(
            ...findTimetableConflicts(form.timelines, {
                ownerTeacherId: form.ownerTeacherId,
                ownerTeacherName: form.ownerTeacherName,
            }),
        )
        setErrors(nextErrors)
        return nextErrors.length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return
        if (!canSaveClassTimetables() && getTimetableHydrateStatus() !== 'idle') {
            const message = getTimetableHydrateError() || 'Timetables are not ready to save yet. Retry loading first.'
            setErrors([message])
            toast.error(message)
            return
        }
        if (isTimetableSaveInFlight() || saving) return
        setSaving(true)
        try {
            const result = isEdit
                ? await updateClassTimetable(editId, form)
                : await addClassTimetable({ ...form, createdByRole })
            if (!result.success) {
                const message = (result.errors && result.errors[0]) || 'Could not save timetable.'
                setErrors(result.errors || [message])
                toast.error(message)
                return
            }
            toast.success(isEdit ? 'Class timetable updated.' : 'Class timetable submitted for approval.')
            navigate(listPath)
        } finally {
            setSaving(false)
        }
    }

    const saveDisabled = recordLoading || saving || getTimetableHydrateStatus() === 'error'

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 space-y-8'>
                <div>
                    <h2 className='text-xl font-semibold text-black'>
                        {isEdit ? 'Edit Class Timetable' : 'Create Class Timetable'}
                    </h2>
                    <p className='text-sm text-[#667085] mt-1'>
                        {isEdit
                            ? 'Update periods as needed. Saving returns the timetable to Pending for Principal or Director approval.'
                            : pathname.startsWith('/coordinator')
                              ? 'Select a teacher, then add periods from their allocation. Principal or Director can approve.'
                              : 'Select a teacher or coordinator, then add periods from their allocation. Principal or Director can approve.'}
                    </p>
                    {recordLoading && (
                        <p className='text-sm text-[#667085] mt-2'>Loading timetable…</p>
                    )}
                    {!hydrateOk && hydrateError ? (
                        <div className='mt-3 text-sm text-[#B54708] bg-[#FFFAEB] border border-[#FEDF89] rounded-lg px-3 py-2 flex flex-wrap items-center gap-3'>
                            <span>{hydrateError}</span>
                            <button
                                type='button'
                                onClick={() => void load()}
                                className='text-[#515DEF] underline cursor-pointer'
                            >
                                Retry
                            </button>
                        </div>
                    ) : null}
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
                    <h3 className='text-lg font-semibold text-black mb-4'>Timetable Information</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='timetable-id' className='text-base font-medium text-[#1E1E1E]'>Timetable ID:</label>
                            <input type='text' id='timetable-id' value={form.timetableId} readOnly className={inputClass} />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='owner-teacher' className='text-base font-medium text-[#1E1E1E]'>Teacher:</label>
                            <select
                                id='owner-teacher'
                                value={form.ownerTeacherId}
                                onChange={(e) => selectOwnerTeacher(e.target.value)}
                                className={selectClass}
                                disabled={loadingTeachers}
                            >
                                <option value=''>
                                    {loadingTeachers ? 'Loading teachers…' : teachers.length ? 'Select teacher' : 'No teachers found'}
                                </option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.employeeId} value={teacher.employeeId}>
                                        {teacher.name}{teacher.email ? ` (${teacher.email})` : ''}
                                    </option>
                                ))}
                                {form.ownerTeacherId && !teachers.some((t) => t.employeeId === form.ownerTeacherId) ? (
                                    <option value={form.ownerTeacherId}>
                                        {form.ownerTeacherName || form.ownerTeacherId}
                                        {form.ownerTeacherEmail ? ` (${form.ownerTeacherEmail})` : ''}
                                    </option>
                                ) : null}
                            </select>
                            <p className='text-xs text-[#667085]'>This timetable ID belongs to the selected teacher.</p>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='academic-year' className='text-base font-medium text-[#1E1E1E]'>Academic Year:</label>
                            <select
                                id='academic-year'
                                value={form.academicYear}
                                onChange={(e) => updateField('academicYear', e.target.value)}
                                className={selectClass}
                                disabled={loadingYears}
                            >
                                <option value=''>
                                    {loadingYears
                                        ? 'Loading years…'
                                        : academicYears.length
                                          ? 'Select academic year'
                                          : 'No academic years found'}
                                </option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.name}>
                                        {year.name}{year.isCurrent ? ' (Current)' : ''}
                                    </option>
                                ))}
                            </select>
                            {!loadingYears && academicYears.length === 0 && (
                                <p className='text-xs text-[#B54708]'>
                                    Add academic years under Admin → Class → Academic Years.
                                </p>
                            )}
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='term' className='text-base font-medium text-[#1E1E1E]'>Term:</label>
                            <select id='term' value={form.term} onChange={(e) => updateField('term', e.target.value)} className={selectClass}>
                                <option value=''>Select term</option>
                                {TERMS.map((term) => (
                                    <option key={term} value={term}>{term}</option>
                                ))}
                                {form.term && !TERMS.includes(form.term) ? (
                                    <option value={form.term}>{form.term}</option>
                                ) : null}
                            </select>
                        </div>
                    </div>
                </div>

                <ClassTimelineEditor
                    timelines={form.timelines}
                    onChange={(timelines) => updateField('timelines', timelines)}
                    ownerTeacherId={form.ownerTeacherId}
                    defaultTeacher={form.ownerTeacherName}
                />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saveDisabled}
                    onClick={() => void handleSubmit()}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit for Approval'}
                </button>
            </div>
        </section>
    )
}

export default CreateClassTimetable
