import React, { useEffect, useState } from 'react'
import { InfoTile } from '../Components/VehicleShared'
import { useAuth } from '../../../context/AuthContext'
import { hydrateDriverProfileSources, resolveDriverProfile } from '../driverProfileData'
import { VEHICLE_INFO_TILES, vehicleStatusBadgeColor } from './vehicleDetailsData'

const emptyDetails = {
    vehicleId: '—',
    vehicleNumber: '—',
    vehicleType: '—',
    vehicleModel: '—',
    seatingCapacity: '—',
    assignedDriver: '—',
    driverContact: '—',
    assignedRoute: '—',
    status: '—',
}

const VehicleDetails = () => {
    const { email } = useAuth()
    const [details, setDetails] = useState(emptyDetails)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        hydrateDriverProfileSources().finally(() => {
            if (cancelled) return
            const ctx = resolveDriverProfile(email)
            if (!ctx.profile && !ctx.vehicle) {
                setDetails(emptyDetails)
                setError('No vehicle is assigned to this driver yet. Ask Transport Manager / HR to link your driver profile.')
                return
            }
            setError('')
            setDetails({
                vehicleId: ctx.vehicleId,
                vehicleNumber: ctx.vehicleNumber,
                vehicleType: ctx.vehicle?.vehicleType || ctx.profile?.vehicleType || '—',
                vehicleModel: ctx.vehicle?.vehicleModel || ctx.vehicle?.model || '—',
                seatingCapacity: ctx.vehicle?.seatingCapacity || ctx.vehicle?.capacity || '—',
                assignedDriver: ctx.driverName,
                driverContact: ctx.driverContact || '—',
                assignedRoute: ctx.routeName,
                status: ctx.vehicle?.status || ctx.profile?.status || 'Active',
            })
        })
        return () => { cancelled = true }
    }, [email])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <div className='mb-6'>
                    <h2 className='text-xl font-semibold text-[#515DEF]'>Vehicle Details</h2>
                    <p className='text-sm text-[#667085] mt-1'>Assigned vehicle information and specifications</p>
                </div>
                {error && <p className='text-sm text-[#667085] mb-4'>{error}</p>}
                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                    {VEHICLE_INFO_TILES.map((tile) => (
                        <InfoTile
                            key={tile.key}
                            icon={tile.icon}
                            label={tile.label}
                            value={details[tile.key]}
                            iconTone={tile.iconTone}
                            isStatus={tile.isStatus}
                            statusClassName={vehicleStatusBadgeColor[details.status]}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default VehicleDetails
