import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import VehicleMaintenanceForm from './Components/VehicleMaintenanceForm'
import {
    getMaintenanceById,
    hydrateMaintenanceRecordsFromApi,
    upsertMaintenanceRecord,
} from './vehicleMaintenanceData'

const AddVehicleMaintenance = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = Boolean(id)
    const formRef = useRef(null)
    const [record, setRecord] = useState(() => (id ? getMaintenanceById(id) : null))
    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isEdit) return undefined
        let cancelled = false
        hydrateMaintenanceRecordsFromApi().finally(() => {
            if (!cancelled) {
                setRecord(getMaintenanceById(id))
                setLoading(false)
            }
        })
        return () => {
            cancelled = true
        }
    }, [id, isEdit])

    const handleSave = async () => {
        const error = formRef.current?.validate?.()
        if (error) {
            toast.error(error)
            return
        }
        const values = formRef.current.getValues()
        setSaving(true)
        const result = await upsertMaintenanceRecord(isEdit ? { ...record, ...values, id: record.id } : values)
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Maintenance record saved locally — API push failed.')
            return
        }
        toast.success(result?.api
            ? (isEdit ? 'Maintenance updated in campus API.' : 'Maintenance saved to campus API.')
            : (isEdit ? 'Maintenance updated.' : 'Maintenance saved.'))
        navigate('/transport-manager/vehicle-maintenance')
    }

    if (isEdit && loading) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Loading record…</div>
            </section>
        )
    }

    if (isEdit && !record) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Record not found.</div>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Vehicle Maintenance Information</h2>
                {isEdit && (
                    <p className='text-sm text-[#667085] mt-1'>Editing {record.id}</p>
                )}
                <VehicleMaintenanceForm key={record?.id || 'new'} ref={formRef} record={record} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/vehicle-maintenance')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddVehicleMaintenance
