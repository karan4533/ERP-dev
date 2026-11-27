import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import MaintenanceRequestForm from './Components/MaintenanceRequestForm'
import {
    getMaintenanceRequestById,
    hydrateDriverMaintenanceRequestsFromApi,
    upsertDriverMaintenanceRequest,
} from './maintenanceRequestData'

const EditMaintenanceRequest = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const formRef = useRef(null)
    const [record, setRecord] = useState(() => getMaintenanceRequestById(id))
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        hydrateDriverMaintenanceRequestsFromApi().finally(() => setRecord(getMaintenanceRequestById(id)))
    }, [id])

    if (!record) {
        return (
            <section className='space-y-6'>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Maintenance request not found.
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
        const result = await upsertDriverMaintenanceRequest({
            ...record,
            ...formRef.current.getValues(),
            id: record.id,
            requestId: record.requestId,
            requestStatus: record.requestStatus,
        })
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Could not save maintenance request.')
            return
        }
        toast.success('Maintenance request updated.')
        navigate('/driver/maintenance-request')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <h2 className='text-xl font-semibold text-black'>Maintenance Request Information</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Request ID:
                    {' '}
                    <span className='font-medium text-[#1E1E1E]'>{record.requestId}</span>
                </p>
                <MaintenanceRequestForm ref={formRef} record={record} />
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
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default EditMaintenanceRequest
