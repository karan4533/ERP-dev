import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import VehicleHealthStatusForm from './Components/VehicleHealthStatusForm'
import { getHealthStatusById } from './vehicleHealthStatusData'

const ViewVehicleHealthStatus = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getHealthStatusById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/driver/vehicle-management/vehicle-health-status')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Vehicle health status record not found or could not be loaded.
                </div>
            ) : (
                <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                    <h2 className='text-xl font-semibold text-black'>Vehicle Health Status Information</h2>
                    <VehicleHealthStatusForm record={record} readOnly />
                </div>
            )}
        </section>
    )
}

export default ViewVehicleHealthStatus
