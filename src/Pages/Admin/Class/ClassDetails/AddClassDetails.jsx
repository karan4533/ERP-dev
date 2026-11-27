import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ClassInfo from './Components/ClassInfo'
import SectionInfo from './Components/SectionInfo'
import { saveClassDetails } from '../../../../Common/RBAC/academicsCatalogData'
import { getCreatedUsersByRole, syncCreatedUsersFromApi } from '../../../../Common/RBAC/createdUsersData'
import { saveClassWithSections } from '../../../../services/classDetailsApi'
import { useClassDirectory, useClassTeacherOptions } from './useClassDirectory'

const emptyForm = {
    className: '',
    classTeacher: '',
    classTeacherEmail: '',
    classCapacity: '',
    classRoomNumber: '',
}

// API mode keeps room and the class teacher (a login id) per section; local mode keeps its old shape.
const blankSection = (apiMode) => (
    apiMode
        ? { name: '', capacity: '', roomNumber: '', classTeacherUserId: '' }
        : { name: '', capacity: '' }
)

const AddClassDetails = () => {
    const navigate = useNavigate()
    // API mode: the server stores the class, its academic year and, per section, the capacity, room
    // and class teacher (chosen from real teacher logins, never typed as a name).
    const directory = useClassDirectory('')
    const apiMode = directory.apiMode
    const teacherPicker = useClassTeacherOptions(apiMode)
    const [saving, setSaving] = useState(false)
    const [academicYearId, setAcademicYearId] = useState('')
    const [teacherRecords, setTeacherRecords] = useState(() => getCreatedUsersByRole('teacher'))
    const teachers = useMemo(
        () => teacherRecords.filter((user) => user.status === 'Active'),
        [teacherRecords],
    )

    // In API mode the server owns the user list; refresh the local mirror before showing teachers.
    useEffect(() => {
        if (apiMode) return undefined // API mode picks teachers from the masters API (useClassTeacherOptions)
        let cancelled = false
        syncCreatedUsersFromApi()
            .then((mapped) => {
                if (mapped && !cancelled) setTeacherRecords(getCreatedUsersByRole('teacher'))
            })
            .catch(() => { /* keep whatever is already mirrored */ })
        return () => { cancelled = true }
    }, [apiMode])
    const [form, setForm] = useState(emptyForm)
    const [sections, setSections] = useState(() => [blankSection(apiMode)])
    const [error, setError] = useState('')

    const updateForm = (keyOrPatch, value) => {
        if (typeof keyOrPatch === 'object' && keyOrPatch !== null) {
            setForm((prev) => ({ ...prev, ...keyOrPatch }))
            return
        }
        setForm((prev) => ({ ...prev, [keyOrPatch]: value }))
    }

    const updateSection = (index, key, value) => {
        setSections((prev) => prev.map((section, i) => (
            i === index ? { ...section, [key]: value } : section
        )))
    }

    const addSectionRow = () => {
        setSections((prev) => [...prev, blankSection(apiMode)])
    }

    const removeSectionRow = (index) => {
        setSections((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
    }

    const handleDiscard = () => {
        setForm(emptyForm)
        setSections([blankSection(apiMode)])
        setError('')
        navigate('/admin/class/class-details')
    }

    const handleSaveApi = async () => {
        setError('')
        if (!form.className) {
            setError('Class is required.')
            return
        }
        if (!sections.some((section) => String(section.name || '').trim())) {
            setError('Add at least one section.')
            return
        }
        setSaving(true)
        try {
            const result = await saveClassWithSections({
                className: form.className,
                sections,
                academicYearId,
            })
            if (result.failures.length > 0) {
                // The class exists now; saving again only adds what is still missing.
                const listed = result.failures.map((item) => `${item.name} (${item.message})`).join('; ')
                setError(
                    `Class ${result.className} was saved, but these sections were not: ${listed}. `
                    + 'Press Save Changes again to retry only the missing sections.',
                )
                return
            }
            const parts = []
            if (result.classCreated) parts.push(`Class ${result.className} created`)
            else parts.push(`Class ${result.className} already existed`)
            if (result.sectionsCreated.length) parts.push(`sections added: ${result.sectionsCreated.join(', ')}`)
            if (result.sectionsExisting.length) parts.push(`already present: ${result.sectionsExisting.join(', ')}`)
            toast.success(`${parts.join('; ')}.`)
            navigate('/admin/class/class-details')
        } catch (saveError) {
            setError(
                saveError?.status === 403
                    ? 'You do not have permission to create classes.'
                    : saveError?.message || 'Could not save the class.',
            )
        } finally {
            setSaving(false)
        }
    }

    const handleSave = () => {
        if (apiMode) {
            handleSaveApi()
            return
        }
        setError('')
        const result = saveClassDetails({
            ...form,
            displayName: form.className,
            sections,
        })

        if (!result.success) {
            setError(result.message)
            return
        }

        toast.success('Class details saved successfully.')
        navigate('/admin/class/class-details')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Class Information</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Selected class and sections feed Mark Entry and student assignment dropdowns.
                </p>
                <ClassInfo
                    form={form}
                    teachers={teachers}
                    onChange={updateForm}
                    apiMode={apiMode}
                    years={directory.years}
                    academicYearId={academicYearId}
                    onAcademicYearChange={setAcademicYearId}
                />
                {apiMode && (
                    <p className='text-xs text-[#667085] mt-4'>
                        A class belongs to one academic year. Choosing a class that already exists in that year adds
                        only the new sections to it; sections it already has are left as they are (edit them from
                        the class list). Capacity, room and class teacher are saved with each section.
                    </p>
                )}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Section(s) Information</h2>
                <SectionInfo
                    sections={sections}
                    onChangeSection={updateSection}
                    onAddSection={addSectionRow}
                    onRemoveSection={removeSectionRow}
                    showCapacity={!apiMode}
                    apiMode={apiMode}
                    teacherOptions={teacherPicker.options}
                    teacherStatus={teacherPicker.status}
                    teacherError={teacherPicker.error}
                    onRetryTeachers={teacherPicker.reload}
                />
            </div>

            {error && <p className='text-sm text-[#F44336] mt-4'>{error}</p>}

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={handleDiscard}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    disabled={saving}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60 disabled:cursor-not-allowed'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddClassDetails
