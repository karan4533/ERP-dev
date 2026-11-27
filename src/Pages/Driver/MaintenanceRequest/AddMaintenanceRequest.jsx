import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import MaintenanceRequestForm from './Components/MaintenanceRequestForm'
import { upsertDriverMaintenanceRequest } from './maintenanceRequestData'

const AddMaintenanceRequest = () => {
    const navigate = useNavigate()
    const formRef = useRef(null)
    const [saving, setSaving] = useState(false)

    const handleSubmit = async () => {
        const error = formRef.current?.validate?.()
        if (error) {
            toast.error(error)
            return
        }
        setSaving(true)
        const values = formRef.current.getValues()
        const result = await upsertDriverMaintenanceRequest(values)
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Could not submit maintenance request.')
            return
        }
        toast.success('Maintenance request submitted for Transport Manager approval.')
        navigate('/driver/maintenance-request')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <h2 className='text-xl font-semibold text-black'>Maintenance Request Information</h2>
                <MaintenanceRequestForm ref={formRef} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4'>
                <button
                    type='button'
                    onClick={() => navigate('/driver/maintenance-request')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSubmit}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Submitting…' : 'Submit Request'}
                </button>
            </div>
        </section>
    )
}

export default AddMaintenanceRequest
