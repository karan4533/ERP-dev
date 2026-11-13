import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import StudentGatePassForm from './Components/StudentGatePassForm'
import {
    getStudentGatePassById,
    toGatePassFormState,
    updateStudentGatePass,
    validateStudentGatePassForm,
} from './gatePassData'

const EditGatePass = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [formData, setFormData] = useState(null)
    const [errors, setErrors] = useState({})
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const record = getStudentGatePassById(id)
        if (!record) {
            setNotFound(true)
            return
        }
        setNotFound(false)
        setFormData(toGatePassFormState(record))
    }, [id])

    const handleSave = () => {
        const validationErrors = validateStudentGatePassForm(formData)
        setErrors(validationErrors)
        if (Object.keys(validationErrors).length > 0) return

        const result = updateStudentGatePass(id, formData)
        if (!result.success) {
            toast.error(result.message)
            return
        }

        toast.success('Student gate pass updated successfully.')
        navigate('/front-office/gate-pass-list')
    }

    if (notFound) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Gate pass not found</h2>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/gate-pass-list')}
                    className='mt-4 text-[#515DEF] hover:underline cursor-pointer'
                >
                    Back to list
                </button>
            </section>
        )
    }

    if (!formData) return null

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Edit Student Gate Pass</h2>
                <StudentGatePassForm formData={formData} onChange={setFormData} errors={errors} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/gate-pass-list')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Update Gate Pass
                </button>
            </div>
        </section>
    )
}

export default EditGatePass
