import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MaterialGatePassForm, {
    createInitialFormData,
    validateMaterialGatePassForm,
} from './Components/MaterialGatePassForm'
import { addMaterialGatePass } from './materialGatePassData'

const AddMaterialGatePass = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState(createInitialFormData)
    const [errors, setErrors] = useState({})

    const handleSubmit = () => {
        const validationErrors = validateMaterialGatePassForm(formData)
        setErrors(validationErrors)
        if (Object.keys(validationErrors).length > 0) return

        addMaterialGatePass(formData)
        navigate('/front-office/material-gate-pass-list')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-6'>
                <h2 className='text-xl font-semibold text-black'>Add Material Gate Pass</h2>
                <p className='text-sm text-[#667085] mt-1'>Create a new material gate pass entry. Select Returnable or Non-Returnable pass type.</p>
            </div>

            <MaterialGatePassForm formData={formData} onChange={setFormData} errors={errors} />

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/material-gate-pass-list')}
                    className='bg-white text-[#515DEF] text-sm px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSubmit}
                    className='bg-[#515DEF] text-white text-sm px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Gate Pass
                </button>
            </div>
        </section>
    )
}

export default AddMaterialGatePass
