import React from 'react'
import BusTrackingMap from './Components/BusTrackingMap'
import BusRouteCard from './Components/BusRouteCard'
import IntegrationNotice from '../../../Common/ui/IntegrationNotice'

const TrackBus = ({ showRouteDetails = false }) => {
    return (
        <section>
            {showRouteDetails && <BusRouteCard title="Bus Route Details" />}

            <div className={`bg-white rounded-2xl shadow-md p-4 ${showRouteDetails ? 'mt-8' : ''}`}>
                <h2 className='text-xl font-medium text-black'>Track Bus Location</h2>
                <IntegrationNotice
                    state='demo'
                    title='Static route preview'
                    description='The bus position, speed, and arrival time are sample values. A GPS provider is not connected.'
                    className='mt-3'
                />
            </div>

            <div className='bg-white rounded-2xl shadow-md mt-8 overflow-hidden'>
                <BusTrackingMap />
            </div>
        </section>
    )
}

export default TrackBus
