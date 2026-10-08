import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RouteDetailsForm from './Components/RouteDetailsForm'
import StopDetailsForm from './Components/StopDetailsForm'
import { getRouteById } from './routeManagementData'

const EditRoute = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const route = getRouteById(id)

    if (!route) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Route not found or could not be loaded.
                </div>
                <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                    <button
                        type='button'
                        onClick={() => navigate('/transport-manager/route-management')}
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
                <h2 className='text-xl font-semibold text-black'>Route Details Information</h2>
                <p className='text-sm text-[#667085] mt-1'>Editing {route.id} — {route.routeName}</p>
                <RouteDetailsForm route={route} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Add Stops</h2>
                {route.stops.map((stop, index) => (
                    <StopDetailsForm key={`${route.id}-stop-${index}`} stop={stop} index={index} />
                ))}
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/route-management')}
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

export default EditRoute
