import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import GoodsReceivedPassForm, {
    recordToFormData,
    validateGoodsReceivedPassForm,
} from './Components/GoodsReceivedPassForm'
import { getGoodsReceivedPassById, getGoodsReceivedPassPaths, updateGoodsReceivedPass } from './goodsReceivedPassData'

const EditGoodsReceivedPass = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const paths = getGoodsReceivedPassPaths()
    const existingRecord = getGoodsReceivedPassById(id)
    const [formData, setFormData] = useState(() => (existingRecord ? recordToFormData(existingRecord) : null))
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)

    if (!existingRecord || !formData) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Goods received pass not found.
                </div>
            </section>
        )
    }

    const handleSubmit = async () => {
        const validationErrors = validateGoodsReceivedPassForm(formData)
        setErrors(validationErrors)
        if (Object.keys(validationErrors).length > 0) return

        setSaving(true)
        try {
            const updated = await updateGoodsReceivedPass(id, formData)
            if (!updated) {
                toast.error('Goods received pass not found.')
                return
            }
            toast.success('Goods received pass updated successfully.')
            navigate(paths.list)
        } catch (error) {
            toast.error(error?.message || 'Could not update goods received pass.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-6'>
                <h2 className='text-xl font-semibold text-black'>Edit Goods Received Pass</h2>
                <p className='text-sm text-[#667085] mt-1'>G.R. No. {existingRecord.grNo}</p>
            </div>

            <GoodsReceivedPassForm formData={formData} onChange={setFormData} errors={errors} isEdit />

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(paths.list)}
                    className='bg-white text-[#515DEF] text-sm px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSubmit}
                    className='bg-[#515DEF] text-white text-sm px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Update Goods Received Pass'}
                </button>
            </div>
        </section>
    )
}

export default EditGoodsReceivedPass
