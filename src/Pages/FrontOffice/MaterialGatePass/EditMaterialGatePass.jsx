import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MaterialGatePassForm, {
    recordToFormData,
    validateMaterialGatePassForm,
} from './Components/MaterialGatePassForm'
import { getMaterialGatePassById, updateMaterialGatePass } from './materialGatePassData'

const EditMaterialGatePass = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const existingRecord = getMaterialGatePassById(id)
    const [formData, setFormData] = useState(() => (existingRecord ? recordToFormData(existingRecord) : null))
    const [errors, setErrors] = useState({})

    if (!existingRecord || !formData) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Material gate pass not found.
                </div>
            </section>
        )
    }

    const handleSubmit = () => {
        const validationErrors = validateMaterialGatePassForm(formData)
        setErrors(validationErrors)
        if (Object.keys(validationErrors).length > 0) return

        updateMaterialGatePass(id, formData)
        navigate('/front-office/material-gate-pass-list')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-6'>
                <h2 className='text-xl font-semibold text-black'>Edit Material Gate Pass</h2>
                <p className='text-sm text-[#667085] mt-1'>M.G.P. No. {existingRecord.mgpNo}</p>
            </div>

            <MaterialGatePassForm formData={formData} onChange={setFormData} errors={errors} isEdit />

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
                    Update Gate Pass
                </button>
            </div>
        </section>
    )
}

export default EditMaterialGatePass
