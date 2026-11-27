import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import FuelRequestForm from './Components/FuelRequestForm'
import {
    getFuelRequestById,
    hydrateDriverFuelRequestsFromApi,
    upsertDriverFuelRequest,
} from './fuelRequestData'

const EditFuelRequest = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const formRef = useRef(null)
    const [record, setRecord] = useState(() => getFuelRequestById(id))
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        hydrateDriverFuelRequestsFromApi().finally(() => setRecord(getFuelRequestById(id)))
    }, [id])

    if (!record) {
        return (
            <section className='space-y-6'>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Fuel request not found.
                </div>
            </section>
        )
    }

    const handleSave = async () => {
        const error = formRef.current?.validate?.()
        if (error) {
            toast.error(error)
            return
        }
        setSaving(true)
        const result = await upsertDriverFuelRequest({
            ...record,
            ...formRef.current.getValues(),
            id: record.id,
            fuelRequestId: record.fuelRequestId,
            approvalStatus: record.approvalStatus,
        })
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Could not save fuel request.')
            return
        }
        toast.success('Fuel request updated.')
        navigate('/driver/fuel-request')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <h2 className='text-xl font-semibold text-black'>Fuel Request Information</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Request ID:
                    {' '}
                    <span className='font-medium text-[#1E1E1E]'>{record.fuelRequestId}</span>
                </p>
                <FuelRequestForm ref={formRef} record={record} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4'>
                <button
                    type='button'
                    onClick={() => navigate('/driver/fuel-request')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default EditFuelRequest
