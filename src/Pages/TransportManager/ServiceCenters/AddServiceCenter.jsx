import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
    getServiceCenterById,
    hydrateServiceCentersFromApi,
    upsertServiceCenter,
    SERVICE_CENTER_STATUSES,
} from '../VehicleMaintenance/serviceCentersData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const AddServiceCenter = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = Boolean(id)
    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)
    const [name, setName] = useState('')
    const [location, setLocation] = useState('')
    const [contactPerson, setContactPerson] = useState('')
    const [phone, setPhone] = useState('')
    const [status, setStatus] = useState('Active')

    useEffect(() => {
        if (!isEdit) return undefined
        let cancelled = false
        hydrateServiceCentersFromApi().finally(() => {
            if (cancelled) return
            const record = getServiceCenterById(id)
            if (!record) {
                toast.error('Service center not found.')
                navigate('/transport-manager/service-centers')
                return
            }
            setName(record.name || '')
            setLocation(record.location || '')
            setContactPerson(record.contactPerson || '')
            setPhone(record.phone || '')
            setStatus(record.status || 'Active')
            setLoading(false)
        })
        return () => {
            cancelled = true
        }
    }, [id, isEdit, navigate])

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Service center name is required.')
            return
        }
        setSaving(true)
        const result = await upsertServiceCenter({
            id: isEdit ? id : undefined,
            name,
            location,
            contactPerson,
            phone,
            status,
        })
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Could not save service center.')
            return
        }
        toast.success(
            result?.api
                ? (isEdit ? 'Service center updated in campus API.' : 'Service center saved to campus API.')
                : (isEdit ? 'Service center updated.' : 'Service center saved.')
        )
        navigate('/transport-manager/service-centers')
    }

    if (isEdit && loading) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Loading…</div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <h2 className='text-xl font-semibold text-black'>
                    {isEdit ? 'Edit Service Center' : 'Service Center Information'}
                </h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8'>
                    <div className='flex flex-col gap-y-2 lg:col-span-2'>
                        <label htmlFor='center-name' className='text-base font-medium text-[#1E1E1E]'>Service Center Name:</label>
                        <input
                            id='center-name'
                            type='text'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder='e.g. Chennai Automotive Service — Velachery'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='center-status' className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                        <select
                            id='center-status'
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className={selectClass}
                        >
                            {SERVICE_CENTER_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='center-location' className='text-base font-medium text-[#1E1E1E]'>Location / Area:</label>
                        <input
                            id='center-location'
                            type='text'
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder='e.g. Velachery'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='center-contact' className='text-base font-medium text-[#1E1E1E]'>Contact Person:</label>
                        <input
                            id='center-contact'
                            type='text'
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            placeholder='e.g. Ravi Kumar'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='center-phone' className='text-base font-medium text-[#1E1E1E]'>Phone:</label>
                        <input
                            id='center-phone'
                            type='text'
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder='e.g. 98765 43210'
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/service-centers')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer md:w-auto w-full disabled:opacity-50'
                >
                    {saving ? 'Saving…' : (isEdit ? 'Update' : 'Save')}
                </button>
            </div>
        </section>
    )
}

export default AddServiceCenter
