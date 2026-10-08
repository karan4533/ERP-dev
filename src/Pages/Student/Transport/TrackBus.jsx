import React from 'react'
import BusTrackingMap from './Components/BusTrackingMap'
import BusRouteCard from './Components/BusRouteCard'

const TrackBus = ({ showRouteDetails = false }) => {
    return (
        <section>
            {showRouteDetails && <BusRouteCard title="Bus Route Details" />}

            <div className={`bg-white rounded-2xl shadow-md p-4 ${showRouteDetails ? 'mt-8' : ''}`}>
                <h2 className='text-xl font-medium text-black'>Track Bus Location</h2>
            </div>

            <div className='bg-white rounded-2xl shadow-md mt-8 overflow-hidden'>
                <BusTrackingMap />
            </div>
        </section>
    )
}

export default TrackBus
