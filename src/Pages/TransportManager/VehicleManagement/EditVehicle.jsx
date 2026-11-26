import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VehicleDetailsForm from './Components/VehicleDetailsForm'
import { getVehicleById } from './vehicleManagementData'

const EditVehicle = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const vehicle = getVehicleById(id)

    if (!vehicle) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Vehicle not found or could not be loaded.
                </div>
                <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                    <button
                        type='button'
                        onClick={() => navigate('/transport-manager/vehicle-management')}
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                    >
                        Back to list
                    </button>
                </div>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Vehicle Details Information</h2>
                <p className='text-sm text-[#667085] mt-1'>Editing {vehicle.id} — {vehicle.vehicleNumber}</p>
                <VehicleDetailsForm vehicle={vehicle} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/vehicle-management')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default EditVehicle
