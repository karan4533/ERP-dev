import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import RouteDetailsForm from './Components/RouteDetailsForm'
import StopDetailsForm from './Components/StopDetailsForm'
import { getRouteById, getRoutes, hydrateRoutesFromApi, saveRoutes } from './routeManagementData'
import { getVehicles, hydrateVehiclesFromApi } from '../VehicleManagement/vehicleManagementData'
import { normalizePlate, routeStoredImei, vehicleStoredImei } from '../RouteData/routeCardGps'

const read = (id) => String(document.getElementById(id)?.value ?? '').trim()

const EditRoute = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [route, setRoute] = useState(() => getRouteById(id))
    const [ready, setReady] = useState(() => Boolean(getRouteById(id)))

    useEffect(() => {
        let active = true
        hydrateRoutesFromApi().finally(() => {
            if (!active) return
            setRoute(getRouteById(id))
            setReady(true)
        })
        return () => { active = false }
    }, [id])

    const save = async () => {
        const routeName = read('route-name')
        if (!routeName) {
            toast.error('Route name is required.')
            return
        }
        await Promise.all([hydrateRoutesFromApi(), hydrateVehiclesFromApi()])
        const gpsImei = read('gps-imei').replace(/\s+/g, '')
        const vehicleId = read('vehicle-id')
        const vehicleNumber = read('vehicle-number')
        const plate = normalizePlate(vehicleNumber)
        const existing = getRoutes().filter((row) => String(row.id) !== String(id))
        const vehicleClash = existing.find((row) => (
            (vehicleId && String(row.vehicleId) === vehicleId)
            || (plate && normalizePlate(row.vehicleNumber) === plate)
        ))
        if (vehicleClash) {
            toast.error(`Vehicle ${vehicleNumber || vehicleId} is already assigned to ${vehicleClash.routeName}.`)
            return
        }
        if (gpsImei) {
            const imeiClash = existing.find((row) => routeStoredImei(row) === gpsImei)
            if (imeiClash) {
                toast.error(`GPS IMEI ${gpsImei} is already on ${imeiClash.routeName}.`)
                return
            }
            const vehicleImeiClash = getVehicles().find((row) => (
                vehicleStoredImei(row) === gpsImei
                && String(row.id) !== vehicleId
                && normalizePlate(row.vehicleNumber) !== plate
            ))
            if (vehicleImeiClash) {
                toast.error(`GPS IMEI ${gpsImei} is already on vehicle ${vehicleImeiClash.vehicleNumber}.`)
                return
            }
        }
        const saved = await saveRoutes([{
            ...route,
            id: route.id,
            routeName,
            vehicleNumber: read('vehicle-number'),
            gpsImei,
            imei: gpsImei,
            driverName: read('select-driver'),
            driverContact: read('driver-contact'),
            vehicleId: read('vehicle-id'),
            startLocation: read('start-location'),
            endLocation: read('end-location'),
            pickUpTime: read('pick-up-time'),
            dropTime: read('drop-time'),
            yearlyFees: read('yearly-fees'),
            halfYearlyFees: read('half-yearly-fees'),
            quarterlyFees: read('quarterly-fees'),
            monthlyFees: read('monthly-fees'),
            supportStaff: read('support-staff'),
            totalStops: Number(read('total-stops') || 0),
            distance: read('distance'),
            estimatedTime: read('estimated-time'),
            stops: route.stops || [],
        }, ...existing])
        if (!saved) {
            toast.error('The route could not be saved.')
            return
        }
        toast.success('Route updated.')
        navigate('/transport-manager/route-management')
    }

    if (!ready) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Loading route…
                </div>
            </section>
        )
    }

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
                {(route.stops || []).map((stop, index) => (
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
                    onClick={save}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default EditRoute
