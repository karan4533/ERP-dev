import React from 'react'
import { InfoTile } from '../Components/VehicleShared'
import {
    VEHICLE_DETAILS,
    VEHICLE_INFO_TILES,
    vehicleStatusBadgeColor,
} from './vehicleDetailsData'

const VehicleDetails = () => (
    <section className='space-y-6'>
        <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
            <div className='mb-6'>
                <h2 className='text-xl font-semibold text-[#515DEF]'>Vehicle Details</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Assigned vehicle information and specifications
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                {VEHICLE_INFO_TILES.map((tile) => (
                    <InfoTile
                        key={tile.key}
                        icon={tile.icon}
                        label={tile.label}
                        value={VEHICLE_DETAILS[tile.key]}
                        iconTone={tile.iconTone}
                        isStatus={tile.isStatus}
                        statusClassName={vehicleStatusBadgeColor[VEHICLE_DETAILS.status]}
                    />
                ))}
            </div>
        </div>
    </section>
)

export default VehicleDetails
