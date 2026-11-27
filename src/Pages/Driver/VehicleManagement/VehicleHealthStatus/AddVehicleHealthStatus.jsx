import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import VehicleHealthStatusForm from './Components/VehicleHealthStatusForm'
import { getHealthRecords, saveHealthRecords } from './vehicleHealthStatusData'

const AddVehicleHealthStatus = () => {
    const navigate = useNavigate()
    const [draft, setDraft] = useState(null)

    const save = () => {
        if (!draft?.vehicleNumber) {
            toast.error('Choose a vehicle before saving.')
            return
        }
        const record = {
            id: `VHS-${Date.now()}`,
            ...draft,
        }
        saveHealthRecords([record, ...getHealthRecords()])
        toast.success('Vehicle health record saved.')
        navigate('/driver/vehicle-management/vehicle-health-status')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <h2 className='text-xl font-semibold text-black'>Vehicle Health Status Information</h2>
                <VehicleHealthStatusForm onChange={setDraft} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4'>
                <button
                    type='button'
                    onClick={() => navigate('/driver/vehicle-management/vehicle-health-status')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={save}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddVehicleHealthStatus
