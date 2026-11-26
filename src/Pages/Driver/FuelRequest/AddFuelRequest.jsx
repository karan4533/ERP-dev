import React from 'react'
import { useNavigate } from 'react-router-dom'
import FuelRequestForm from './Components/FuelRequestForm'

const AddFuelRequest = () => {
    const navigate = useNavigate()

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <h2 className='text-xl font-semibold text-black'>Fuel Request Information</h2>
                <FuelRequestForm />
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
                    onClick={() => navigate('/driver/fuel-request')}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer md:w-auto w-full'
                >
                    Submit Request
                </button>
            </div>
        </section>
    )
}

export default AddFuelRequest
