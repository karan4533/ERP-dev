import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BusTrackingMap from './Components/BusTrackingMap'
import { getRouteById } from '../RouteManagement/routeManagementData'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-xs font-medium uppercase tracking-wide text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] font-medium'>{value || '—'}</span>
    </div>
)

const TRACKING_PRESETS = [
    { busIndex: 54, stats: { progress: '~55%', distanceLeft: '3.2 km', eta: '~8 min', speed: '32 km/h' } },
    { busIndex: 38, stats: { progress: '~40%', distanceLeft: '4.1 km', eta: '~11 min', speed: '28 km/h' } },
    { busIndex: 62, stats: { progress: '~65%', distanceLeft: '2.4 km', eta: '~6 min', speed: '35 km/h' } },
    { busIndex: 28, stats: { progress: '~30%', distanceLeft: '5.0 km', eta: '~14 min', speed: '26 km/h' } },
]

const TrackBus = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const route = getRouteById(id)
    const trackingPreset = TRACKING_PRESETS[(parseInt(route?.id?.split('-')[1] ?? '1', 10) - 1) % TRACKING_PRESETS.length]

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/route-data')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to Route Data
                </button>
            </div>

            {!route ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Route not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{route.routeName}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>Route ID: {route.id}</span>
                            {' · '}
                            <span>{route.distance} · {route.estimatedTime}</span>
                        </p>
                    </div>

                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-lg font-semibold text-black mb-4'>Route Details</h2>
                        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
                            <Field label='Vehicle Number' value={route.vehicleNumber} />
                            <Field label='Vehicle ID' value={route.vehicleId} />
                            <Field label='Driver Name' value={route.driverName} />
                            <Field label='Driver Contact' value={route.driverContact} />
                            <Field label='Start Location' value={route.startLocation} />
                            <Field label='End Location' value={route.endLocation} />
                            <Field label='Pick Up Time' value={route.pickUpTime} />
                            <Field label='Drop Time' value={route.dropTime} />
                            <Field label='Total Stops' value={route.totalStops} />
                            <Field label='Support Staff' value={route.supportStaff} />
                        </div>
                    </div>

                    <div className='bg-white rounded-2xl shadow-md overflow-hidden'>
                        <BusTrackingMap
                            routeName={route.routeName}
                            vehicleNumber={route.vehicleNumber}
                            driverName={route.driverName}
                            driverContact={route.driverContact}
                            startLocation={route.startLocation}
                            startSubtitle='Pickup Point'
                            endLocation={route.endLocation}
                            endSubtitle='School Campus'
                            busLabel={route.vehicleId}
                            stats={trackingPreset.stats}
                            busIndex={trackingPreset.busIndex}
                        />
                    </div>
                </>
            )}
        </section>
    )
}

export default TrackBus
