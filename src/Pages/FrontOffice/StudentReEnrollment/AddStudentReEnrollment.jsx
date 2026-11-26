import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer } from 'lucide-react'
import StudentReEnrollmentForm from './Components/StudentReEnrollmentForm'
import {
    ROUTE_BASE,
    addReEnrollment,
    defaultForm,
    updateReEnrollment,
    validateReEnrollmentForm,
} from './studentReEnrollmentData'

const AddStudentReEnrollment = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState(defaultForm)
    const [errors, setErrors] = useState([])
    const [savedId, setSavedId] = useState(null)

    const handleSave = () => {
        const payload = { ...form, status: form.status || 'Pending' }
        const record = savedId ? updateReEnrollment(savedId, payload) : addReEnrollment(payload)
        setSavedId(record.id)
        setErrors([])
    }

    const handleSubmit = () => {
        const nextErrors = validateReEnrollmentForm(form)
        setErrors(nextErrors)
        if (nextErrors.length > 0) return

        const payload = { ...form, status: 'Pending' }
        if (savedId) {
            updateReEnrollment(savedId, payload)
        } else {
            addReEnrollment(payload)
        }
        navigate(ROUTE_BASE)
    }

    const handlePrint = () => {
        const nextErrors = validateReEnrollmentForm(form)
        setErrors(nextErrors)
        if (nextErrors.length > 0) return

        const record = savedId ? updateReEnrollment(savedId, form) : addReEnrollment(form)
        navigate(`${ROUTE_BASE}/view/${record.id}?print=1`)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-6'>
                <h2 className='text-xl font-semibold text-black'>Student Re-Enrollment</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Student completed Grade 10, received TC, returned original TC, and continues in Grade 11 at the same school.
                </p>
            </div>

            {errors.length > 0 && (
                <div className='rounded-lg border border-red-200 bg-red-50 p-4 mb-6'>
                    <ul className='list-disc pl-5 text-sm text-red-600 space-y-1'>
                        {errors.map((error) => (
                            <li key={error}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <StudentReEnrollmentForm form={form} onChange={setForm} />

            <div className='flex sm:justify-end justify-center flex-wrap gap-3 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'
                >
                    Save
                </button>
                <button
                    type='button'
                    onClick={handleSubmit}
                    className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer'
                >
                    Submit
                </button>
                <button
                    type='button'
                    onClick={handlePrint}
                    className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer inline-flex items-center gap-2'
                >
                    <Printer size={16} />
                    Print Acknowledgement
                </button>
            </div>
        </section>
    )
}

export default AddStudentReEnrollment
