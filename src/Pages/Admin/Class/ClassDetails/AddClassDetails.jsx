import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ClassInfo from './Components/ClassInfo'
import SectionInfo from './Components/SectionInfo'
import { saveClassDetails } from '../../../../Common/RBAC/academicsCatalogData'
import { getCreatedUsersByRole } from '../../../../Common/RBAC/createdUsersData'

const emptyForm = {
    className: '',
    classTeacher: '',
    classTeacherEmail: '',
    classCapacity: '',
    classRoomNumber: '',
}

const AddClassDetails = () => {
    const navigate = useNavigate()
    const teachers = useMemo(
        () => getCreatedUsersByRole('teacher').filter((user) => user.status === 'Active'),
        [],
    )
    const [form, setForm] = useState(emptyForm)
    const [sections, setSections] = useState([{ name: '', capacity: '' }])
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
        setSections((prev) => [...prev, { name: '', capacity: '' }])
    }

    const removeSectionRow = (index) => {
        setSections((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
    }

    const handleDiscard = () => {
        setForm(emptyForm)
        setSections([{ name: '', capacity: '' }])
        setError('')
        navigate('/admin/class/class-details')
    }

    const handleSave = () => {
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
                <ClassInfo form={form} teachers={teachers} onChange={updateForm} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Section(s) Information</h2>
                <SectionInfo
                    sections={sections}
                    onChangeSection={updateSection}
                    onAddSection={addSectionRow}
                    onRemoveSection={removeSectionRow}
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
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddClassDetails
