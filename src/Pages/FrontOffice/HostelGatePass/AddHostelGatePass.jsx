import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import HostelGatePassForm from './Components/HostelGatePassForm'
import {
    DEFAULT_HOSTEL_GATE_PASS_FORM,
    addHostelGatePass,
    formatGatePassDate,
    validateHostelGatePassForm,
} from './hostelGatePassData'

const AddHostelGatePass = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        ...DEFAULT_HOSTEL_GATE_PASS_FORM,
        outDate: formatGatePassDate(new Date()),
        returnDate: formatGatePassDate(new Date()),
    })
    const [errors, setErrors] = useState({})

    const handleSave = () => {
        const validationErrors = validateHostelGatePassForm(formData)
        setErrors(validationErrors)
        if (Object.keys(validationErrors).length > 0) return

        const result = addHostelGatePass(formData)
        if (!result.success) {
            toast.error(result.message)
            return
        }

        toast.success('Hostel gate pass saved successfully.')
        navigate('/front-office/hostel-gate-pass-list')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Hostel Gate Pass Information</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Search and select an enrolled student to auto-fill their details.
                </p>
                <HostelGatePassForm formData={formData} onChange={setFormData} errors={errors} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/hostel-gate-pass-list')}
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

export default AddHostelGatePass
