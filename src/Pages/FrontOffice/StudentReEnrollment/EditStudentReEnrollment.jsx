import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import StudentReEnrollmentForm from './Components/StudentReEnrollmentForm'
import {
    ROUTE_BASE,
    formFromRecord,
    getReEnrollmentById,
    updateReEnrollment,
    validateReEnrollmentForm,
} from './studentReEnrollmentData'

const EditStudentReEnrollment = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getReEnrollmentById(id)
    const [form, setForm] = useState(() => (record ? formFromRecord(record) : null))
    const [errors, setErrors] = useState([])

    if (!record || !form) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Re-enrollment record not found.</div>
            </section>
        )
    }

    const handleSave = () => {
        updateReEnrollment(id, form)
        setErrors([])
    }

    const handleSubmit = () => {
        const nextErrors = validateReEnrollmentForm(form)
        setErrors(nextErrors)
        if (nextErrors.length > 0) return
        updateReEnrollment(id, { ...form, status: form.status || 'Pending' })
        navigate(ROUTE_BASE)
    }

    const handlePrint = () => {
        const nextErrors = validateReEnrollmentForm(form)
        setErrors(nextErrors)
        if (nextErrors.length > 0) return
        updateReEnrollment(id, form)
        navigate(`${ROUTE_BASE}/view/${id}?print=1`)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-6'>
                <h2 className='text-xl font-semibold text-black'>Edit Student Re-Enrollment</h2>
                <p className='text-sm text-[#667085] mt-1'>Reference ID: {record.id}</p>
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
                <button type='button' onClick={() => navigate(ROUTE_BASE)} className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'>
                    Discard Changes
                </button>
                <button type='button' onClick={handleSave} className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'>
                    Save
                </button>
                <button type='button' onClick={handleSubmit} className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer'>
                    Submit
                </button>
                <button type='button' onClick={handlePrint} className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer inline-flex items-center gap-2'>
                    <Printer size={16} />
                    Print Acknowledgement
                </button>
            </div>
        </section>
    )
}

export default EditStudentReEnrollment
