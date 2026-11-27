import React, { useEffect, useState } from 'react'
import { InfoTile } from '../Components/VehicleShared'
import { useAuth } from '../../../context/AuthContext'
import { hydrateDriverProfileSources } from '../driverProfileData'
import {
    getMyRouteDetails,
    ROUTE_INFO_TILES,
    routeStatusBadgeColor,
} from './routeDetailsData'

const RouteDetails = () => {
    const { email } = useAuth()
    const [details, setDetails] = useState(() => getMyRouteDetails(email))

    useEffect(() => {
        hydrateDriverProfileSources().finally(() => setDetails(getMyRouteDetails(email)))
    }, [email])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <div className='mb-6'>
                    <h2 className='text-xl font-semibold text-[#515DEF]'>Route Details</h2>
                    <p className='text-sm text-[#667085] mt-1'>
                        Assigned route information, coverage, and student summary
                    </p>
                    {details.startLocation && details.startLocation !== '—' && (
                        <p className='text-sm text-[#0C1E5B] mt-2'>
                            {details.startLocation}
                            {' → '}
                            {details.endLocation}
                        </p>
                    )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                    {ROUTE_INFO_TILES.map((tile) => (
                        <InfoTile
                            key={tile.key}
                            icon={tile.icon}
                            label={tile.label}
                            value={details[tile.key]}
                            iconTone={tile.iconTone}
                            isStatus={tile.isStatus}
                            statusClassName={routeStatusBadgeColor[details.status]}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default RouteDetails
