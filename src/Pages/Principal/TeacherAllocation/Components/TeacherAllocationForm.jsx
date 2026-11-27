import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
    ACADEMIC_YEARS,
    ALLOCATION_STATUSES,
    createEmptyMappingRow,
    defaultAllocationForm,
    getGrades,
    getSectionsForClass,
    getSubjects,
    hydrateClassCatalogForAllocation,
} from '../teacherAllocationData'
import { CLASS_CATALOG_UPDATED_EVENT } from '../../../../Common/RBAC/academicsCatalogData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#E4E7EC] rounded-md px-2 py-3 w-full bg-[#F9FAFB]'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-2'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className={readOnlyClass}>{value || '—'}</span>
    </div>
)

const TeacherAllocationForm = ({
    teacher,
    initialValues,
    onSubmit,
    formId = 'teacher-allocation-form',
    readOnly = false,
    validationErrors = [],
    showDepartmentDesignation = true,
    showStatus = true,
}) => {
    const [formState, setFormState] = useState(() => initialValues ?? defaultAllocationForm())
    const [catalogTick, setCatalogTick] = useState(0)
    const grades = getGrades()
    const subjects = getSubjects()
    void catalogTick

    useEffect(() => {
        setFormState(initialValues ?? defaultAllocationForm())
    }, [initialValues])

    useEffect(() => {
        hydrateClassCatalogForAllocation()
        const refresh = () => setCatalogTick((value) => value + 1)
        window.addEventListener(CLASS_CATALOG_UPDATED_EVENT, refresh)
        return () => window.removeEventListener(CLASS_CATALOG_UPDATED_EVENT, refresh)
    }, [])

    const updateField = (key, value) => {
        setFormState((current) => ({ ...current, [key]: value }))
    }

    const updateClassTeacher = (key, value) => {
        setFormState((current) => {
            const next = { ...current.classTeacher, [key]: value }
            if (key === 'className' && value !== current.classTeacher?.className) {
                next.section = ''
            }
            return { ...current, classTeacher: next }
        })
    }

    const classTeacherSections = getSectionsForClass(formState.classTeacher?.className || '')

    const toggleArrayValue = (key, value) => {
        setFormState((current) => {
            const removing = current[key].includes(value)
            const list = removing
                ? current[key].filter((item) => item !== value)
                : [...current[key], value]

            // Mapping Class/Subject options follow Teaching Class / Subject Allocation.
            // Clear mapping cells that no longer match the checked sets.
            let mappings = current.mappings
            if (key === 'teachingClasses' && removing) {
                mappings = mappings.map((row) =>
                    row.className === value ? { ...row, className: '' } : row,
                )
            }
            if (key === 'subjects' && removing) {
                mappings = mappings.map((row) =>
                    row.subject === value ? { ...row, subject: '' } : row,
                )
            }

            return { ...current, [key]: list, mappings }
        })
    }

    const mappingClassOptions = formState.teachingClasses.length
        ? grades.filter((grade) => formState.teachingClasses.includes(grade))
        : []

    const mappingSubjectOptions = formState.subjects.length
        ? subjects.filter((subject) => formState.subjects.includes(subject))
        : []

    const updateMapping = (index, key, value) => {
        setFormState((current) => ({
            ...current,
            mappings: current.mappings.map((row, rowIndex) => {
                if (rowIndex !== index) return row
                if (key === 'className' && value !== row.className) {
                    return { ...row, className: value, section: '' }
                }
                return { ...row, [key]: value }
            }),
        }))
    }

    const addMappingRow = () => {
        setFormState((current) => ({
            ...current,
            mappings: [...current.mappings, createEmptyMappingRow()],
        }))
    }

    const removeMappingRow = (index) => {
        setFormState((current) => ({
            ...current,
            mappings: current.mappings.filter((_, rowIndex) => rowIndex !== index),
        }))
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        if (readOnly) return
        onSubmit(formState)
    }

    return (
        <form id={formId} onSubmit={handleSubmit} className='space-y-8'>
            <div>
                <h3 className='text-lg font-semibold text-black mb-4'>Teacher Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Employee ID' value={teacher.employeeId} />
                    <Field label='Teacher Name' value={teacher.name} />
                    {showDepartmentDesignation && (
                        <>
                            <Field label='Department' value={teacher.department} />
                            <Field label='Designation' value={teacher.designation} />
                        </>
                    )}
                    <Field label='Qualification' value={teacher.qualification} />
                    <Field label='Joining Date' value={teacher.joiningDate} />
                </div>
            </div>

            {validationErrors.length > 0 && (
                <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                    <p className='text-sm font-medium text-red-700 mb-2'>Please fix the following:</p>
                    <ul className='list-disc pl-5 text-sm text-red-600 space-y-1'>
                        {validationErrors.map((error) => (
                            <li key={error}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h3 className='text-lg font-semibold text-black mb-4'>Class Teacher Assignment</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Academic Year</label>
                        {readOnly ? (
                            <span className={readOnlyClass}>{formState.classTeacher?.academicYear || '—'}</span>
                        ) : (
                            <select
                                value={formState.classTeacher?.academicYear ?? ''}
                                onChange={(e) => updateClassTeacher('academicYear', e.target.value)}
                                className={selectClass}
                            >
                                {ACADEMIC_YEARS.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Class</label>
                        {readOnly ? (
                            <span className={readOnlyClass}>{formState.classTeacher?.className || '—'}</span>
                        ) : (
                            <select
                                value={formState.classTeacher?.className ?? ''}
                                onChange={(e) => updateClassTeacher('className', e.target.value)}
                                className={selectClass}
                            >
                                <option value=''>--Select--</option>
                                {grades.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Section</label>
                        {readOnly ? (
                            <span className={readOnlyClass}>{formState.classTeacher?.section || '—'}</span>
                        ) : (
                            <select
                                value={formState.classTeacher?.section ?? ''}
                                onChange={(e) => updateClassTeacher('section', e.target.value)}
                                className={selectClass}
                            >
                                <option value=''>
                                    {formState.classTeacher?.className ? '--Select--' : 'Select class first'}
                                </option>
                                {classTeacherSections.map((section) => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-lg font-semibold text-black mb-4'>Teaching Class Allocation</h3>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                    {grades.map((grade) => (
                        <label
                            key={grade}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                formState.teachingClasses.includes(grade)
                                    ? 'border-[#515DEF] bg-[#F0F1FF] text-[#515DEF]'
                                    : 'border-[#D9D9D9] text-[#667085]'
                            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <input
                                type='checkbox'
                                checked={formState.teachingClasses.includes(grade)}
                                disabled={readOnly}
                                onChange={() => toggleArrayValue('teachingClasses', grade)}
                                className='accent-[#515DEF]'
                            />
                            {grade}
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className='text-lg font-semibold text-black mb-4'>Subject Allocation</h3>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                    {subjects.map((subject) => (
                        <label
                            key={subject}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                formState.subjects.includes(subject)
                                    ? 'border-[#515DEF] bg-[#F0F1FF] text-[#515DEF]'
                                    : 'border-[#D9D9D9] text-[#667085]'
                            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <input
                                type='checkbox'
                                checked={formState.subjects.includes(subject)}
                                disabled={readOnly}
                                onChange={() => toggleArrayValue('subjects', subject)}
                                className='accent-[#515DEF]'
                            />
                            {subject}
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Class–Subject Mapping</h3>
                    {!readOnly && (
                        <button
                            type='button'
                            onClick={addMappingRow}
                            disabled={!formState.teachingClasses.length}
                            className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-3 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#515DEF]'
                        >
                            <Plus size={16} />
                            Add More
                        </button>
                    )}
                </div>
                {!readOnly && !formState.teachingClasses.length ? (
                    <p className='text-sm text-[#667085] mb-3'>
                        Select one or more grades under Teaching Class Allocation first — those grades appear in the Class dropdown below.
                    </p>
                ) : null}
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                {!readOnly && (
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {formState.mappings.map((row, index) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                    <td className='px-2 py-3'>
                                        {readOnly ? (
                                            row.className || '—'
                                        ) : (
                                            <select
                                                value={row.className}
                                                onChange={(e) => updateMapping(index, 'className', e.target.value)}
                                                className={selectClass}
                                                disabled={!mappingClassOptions.length}
                                            >
                                                <option value=''>
                                                    {mappingClassOptions.length ? '--Select--' : 'Select teaching classes first'}
                                                </option>
                                                {mappingClassOptions.map((grade) => (
                                                    <option key={grade} value={grade}>{grade}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>
                                        {readOnly ? (
                                            row.section || '—'
                                        ) : (
                                            <select
                                                value={row.section}
                                                onChange={(e) => updateMapping(index, 'section', e.target.value)}
                                                className={selectClass}
                                                disabled={!row.className}
                                            >
                                                <option value=''>
                                                    {row.className ? '--Select--' : 'Select class first'}
                                                </option>
                                                {getSectionsForClass(row.className).map((section) => (
                                                    <option key={section} value={section}>{section}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>
                                        {readOnly ? (
                                            row.subject || '—'
                                        ) : (
                                            <select
                                                value={row.subject}
                                                onChange={(e) => updateMapping(index, 'subject', e.target.value)}
                                                className={selectClass}
                                                disabled={!mappingSubjectOptions.length}
                                            >
                                                <option value=''>
                                                    {mappingSubjectOptions.length ? '--Select--' : 'Select subjects first'}
                                                </option>
                                                {mappingSubjectOptions.map((subject) => (
                                                    <option key={subject} value={subject}>{subject}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    {!readOnly && (
                                        <td className='px-2 py-3'>
                                            <button
                                                type='button'
                                                onClick={() => removeMappingRow(index)}
                                                disabled={formState.mappings.length === 1}
                                                className='inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
                                            >
                                                <Trash2 size={14} />
                                                Remove
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showStatus && (
                <div>
                    <h3 className='text-lg font-semibold text-black mb-4'>Status</h3>
                    {readOnly ? (
                        <span className={readOnlyClass}>{formState.status}</span>
                    ) : (
                        <select
                            value={formState.status}
                            onChange={(e) => updateField('status', e.target.value)}
                            className={`${selectClass} max-w-xs`}
                        >
                            {ALLOCATION_STATUSES.filter((item) => item !== 'Not Allocated').map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}
        </form>
    )
}

export default TeacherAllocationForm
