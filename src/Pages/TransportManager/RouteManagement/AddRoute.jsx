import React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import RouteDetailsForm from './Components/RouteDetailsForm'
import StopDetailsForm from './Components/StopDetailsForm'
import { getRoutes, hydrateRoutesFromApi, saveRoutes } from './routeManagementData'
import { getVehicles, hydrateVehiclesFromApi } from '../VehicleManagement/vehicleManagementData'
import { normalizePlate, routeStoredImei, vehicleStoredImei } from '../RouteData/routeCardGps'

const read = (id) => String(document.getElementById(id)?.value ?? '').trim()

const AddRoute = () => {
    const navigate = useNavigate()

    const save = async () => {
        const routeName = read('route-name')
        if (!routeName) {
            toast.error('Route name is required.')
            return
        }
        await Promise.all([hydrateRoutesFromApi(), hydrateVehiclesFromApi()])
        const current = getRoutes()
        const nameNorm = routeName.trim().toLowerCase()
        const nameClash = current.find((row) => String(row.routeName || '').trim().toLowerCase() === nameNorm)
        if (nameClash) {
            toast.error(`Route "${routeName}" already exists. Edit that record instead of adding a duplicate.`)
            return
        }
        const gpsImei = read('gps-imei').replace(/\s+/g, '')
        const vehicleId = read('vehicle-id')
        const vehicleNumber = read('vehicle-number')
        const plate = normalizePlate(vehicleNumber)
        const vehicleClash = current.find((row) => (
            (vehicleId && String(row.vehicleId) === vehicleId)
            || (plate && normalizePlate(row.vehicleNumber) === plate)
        ))
        if (vehicleClash) {
            toast.error(`Vehicle ${vehicleNumber || vehicleId} is already assigned to ${vehicleClash.routeName}. Edit that route instead of adding a duplicate.`)
            return
        }
        if (gpsImei) {
            const imeiClash = current.find((row) => routeStoredImei(row) === gpsImei)
            if (imeiClash) {
                toast.error(`GPS IMEI ${gpsImei} is already on ${imeiClash.routeName}. Edit that route instead of adding a duplicate.`)
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
        const id = `RT-${Date.now()}`
        const saved = await saveRoutes([{
            id,
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
            stops: [],
        }, ...current])
        if (!saved) {
            toast.error('The route could not be saved.')
            return
        }
        toast.success('Route saved.')
        navigate('/transport-manager/route-management')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Route Details Information</h2>
                <RouteDetailsForm />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Add Stops</h2>
                <StopDetailsForm />
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

export default AddRoute
