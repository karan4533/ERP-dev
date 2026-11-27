import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
    getRouteDriverOptions,
    getRouteVehicleOptions,
    hydrateRoutesFromApi,
} from '../routeManagementData'
import { hydrateDriversFromApi } from '../../DriverManagement/driverManagementData'
import { hydrateVehiclesFromApi } from '../../VehicleManagement/vehicleManagementData'
import { deriveFeesFromYearly } from '../feeHelpers'
import { looksLikeGoogleMapsUrl, resolveGoogleMapsUrl } from '../../../../services/geoApi'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const RouteDetailsForm = forwardRef(({ route }, ref) => {
    const [drivers, setDrivers] = useState(() => getRouteDriverOptions())
    const [vehicles, setVehicles] = useState(() => getRouteVehicleOptions())
    const [loadingOptions, setLoadingOptions] = useState(false)

    const [routeName, setRouteName] = useState(route?.routeName ?? '')
    const [vehicleNumber, setVehicleNumber] = useState(route?.vehicleNumber ?? '')
    const [vehicleId, setVehicleId] = useState(route?.vehicleId ?? '')
    const [gpsImei, setGpsImei] = useState(route?.gpsImei || route?.imei || '')
    const [driverName, setDriverName] = useState(route?.driverName ?? '')
    const [driverContact, setDriverContact] = useState(route?.driverContact ?? '')
    const [startLocation, setStartLocation] = useState(route?.startLocation ?? '')
    const [endLocation, setEndLocation] = useState(route?.endLocation ?? '')
    const [startMapsUrl, setStartMapsUrl] = useState(route?.startMapsUrl ?? '')
    const [endMapsUrl, setEndMapsUrl] = useState(route?.endMapsUrl ?? '')
    const [startLat, setStartLat] = useState(route?.startLat ?? '')
    const [startLng, setStartLng] = useState(route?.startLng ?? '')
    const [endLat, setEndLat] = useState(route?.endLat ?? '')
    const [endLng, setEndLng] = useState(route?.endLng ?? '')
    const [startMapsStatus, setStartMapsStatus] = useState('')
    const [endMapsStatus, setEndMapsStatus] = useState('')
    const [resolvingStart, setResolvingStart] = useState(false)
    const [resolvingEnd, setResolvingEnd] = useState(false)
    const resolvedCoordsRef = useRef({
        startMapsUrl: route?.startMapsUrl ?? '',
        endMapsUrl: route?.endMapsUrl ?? '',
        startLat: route?.startLat ?? '',
        startLng: route?.startLng ?? '',
        endLat: route?.endLat ?? '',
        endLng: route?.endLng ?? '',
        startLocation: route?.startLocation ?? '',
        endLocation: route?.endLocation ?? '',
    })
    const [pickUpTime, setPickUpTime] = useState(route?.pickUpTime ?? '')
    const [dropTime, setDropTime] = useState(route?.dropTime ?? '')

    useEffect(() => {
        resolvedCoordsRef.current = {
            startMapsUrl,
            endMapsUrl,
            startLat,
            startLng,
            endLat,
            endLng,
            startLocation,
            endLocation,
        }
    }, [startMapsUrl, endMapsUrl, startLat, startLng, endLat, endLng, startLocation, endLocation])
    const [yearlyFees, setYearlyFees] = useState(route?.yearlyFees ?? '')
    const [halfYearlyFees, setHalfYearlyFees] = useState(route?.halfYearlyFees ?? '')
    const [quarterlyFees, setQuarterlyFees] = useState(route?.quarterlyFees ?? '')
    const [monthlyFees, setMonthlyFees] = useState(route?.monthlyFees ?? '')
    const [supportStaff, setSupportStaff] = useState(route?.supportStaff ?? '')
    const [totalStops, setTotalStops] = useState(route?.totalStops ?? '')
    const [distance, setDistance] = useState(route?.distance ?? '')
    const [estimatedTime, setEstimatedTime] = useState(route?.estimatedTime ?? '')

    useEffect(() => {
        let cancelled = false
        setLoadingOptions(true)
        Promise.all([hydrateDriversFromApi(), hydrateVehiclesFromApi(), hydrateRoutesFromApi()])
            .finally(() => {
                if (!cancelled) {
                    setDrivers(getRouteDriverOptions())
                    setVehicles(getRouteVehicleOptions())
                    setLoadingOptions(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    const syncFromVehicle = (vehicle) => {
        if (!vehicle) return
        setVehicleId(vehicle.id)
        setVehicleNumber(vehicle.vehicleNumber)
        if (vehicle.driverName) setDriverName(vehicle.driverName)
        if (vehicle.driverContact) setDriverContact(vehicle.driverContact)
        const imei = vehicle.gpsImei || vehicle.imei || ''
        if (imei) setGpsImei(imei)
    }

    const handleVehicleNumberChange = (event) => {
        const value = event.target.value
        setVehicleNumber(value)
        const selected = vehicles.find((item) => item.vehicleNumber === value)
        if (selected) syncFromVehicle(selected)
    }

    const handleVehicleIdChange = (event) => {
        const value = event.target.value
        setVehicleId(value)
        const selected = vehicles.find((item) => item.id === value)
        if (selected) syncFromVehicle(selected)
    }

    const handleDriverChange = (event) => {
        const value = event.target.value
        setDriverName(value)
        const selected = drivers.find((driver) => driver.label === value)
        if (selected?.contact) setDriverContact(selected.contact)
    }

    const resolveMapsLink = useCallback(async (which, url) => {
        const trimmed = String(url || '').trim()
        if (!trimmed) {
            if (which === 'start') setStartMapsStatus('')
            else setEndMapsStatus('')
            return null
        }
        if (!looksLikeGoogleMapsUrl(trimmed)) {
            const msg = 'Paste a Google Maps link (Share → Copy link).'
            if (which === 'start') setStartMapsStatus(msg)
            else setEndMapsStatus(msg)
            return null
        }
        if (which === 'start') setResolvingStart(true)
        else setResolvingEnd(true)
        try {
            const resolved = await resolveGoogleMapsUrl(trimmed)
            const lat = Number(resolved?.lat)
            const lng = Number(resolved?.lng)
            const name = String(resolved?.name || '').trim()
            if (which === 'start') {
                const nextName = name && (!startLocation || looksLikeGoogleMapsUrl(startLocation)) ? name : startLocation
                setStartLat(lat)
                setStartLng(lng)
                setStartMapsUrl(String(resolved?.sourceUrl || trimmed))
                if (nextName && nextName !== startLocation) setStartLocation(nextName)
                resolvedCoordsRef.current = {
                    ...resolvedCoordsRef.current,
                    startLat: lat,
                    startLng: lng,
                    startMapsUrl: String(resolved?.sourceUrl || trimmed),
                    startLocation: nextName || startLocation,
                }
                setStartMapsStatus(`Pickup pin set: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
            } else {
                const nextName = name && (!endLocation || looksLikeGoogleMapsUrl(endLocation) || /^school/i.test(endLocation))
                    ? name
                    : endLocation
                setEndLat(lat)
                setEndLng(lng)
                setEndMapsUrl(String(resolved?.sourceUrl || trimmed))
                if (nextName && nextName !== endLocation) setEndLocation(nextName)
                resolvedCoordsRef.current = {
                    ...resolvedCoordsRef.current,
                    endLat: lat,
                    endLng: lng,
                    endMapsUrl: String(resolved?.sourceUrl || trimmed),
                    endLocation: nextName || endLocation,
                }
                setEndMapsStatus(`Destination pin set: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
            }
            return resolved
        } catch (err) {
            const msg = err?.message || 'Could not read that Google Maps link.'
            if (which === 'start') setStartMapsStatus(msg)
            else setEndMapsStatus(msg)
            return null
        } finally {
            if (which === 'start') setResolvingStart(false)
            else setResolvingEnd(false)
        }
    }, [startLocation, endLocation])

    useImperativeHandle(ref, () => ({
        getValues: () => {
            const imei = String(gpsImei).trim()
            const pinned = resolvedCoordsRef.current
            const numOrEmpty = (value) => (value === '' || value == null ? '' : Number(value))
            return {
                routeName: String(routeName).trim(),
                vehicleId,
                vehicleNumber,
                gpsImei: imei,
                imei,
                driverName,
                driverContact: String(driverContact).trim(),
                startLocation: String(pinned.startLocation || startLocation).trim(),
                endLocation: String(pinned.endLocation || endLocation).trim(),
                startMapsUrl: String(pinned.startMapsUrl || startMapsUrl).trim(),
                endMapsUrl: String(pinned.endMapsUrl || endMapsUrl).trim(),
                startLat: numOrEmpty(pinned.startLat !== '' && pinned.startLat != null ? pinned.startLat : startLat),
                startLng: numOrEmpty(pinned.startLng !== '' && pinned.startLng != null ? pinned.startLng : startLng),
                endLat: numOrEmpty(pinned.endLat !== '' && pinned.endLat != null ? pinned.endLat : endLat),
                endLng: numOrEmpty(pinned.endLng !== '' && pinned.endLng != null ? pinned.endLng : endLng),
                pickUpTime: String(pickUpTime).trim(),
                dropTime: String(dropTime).trim(),
                yearlyFees: String(yearlyFees).trim(),
                halfYearlyFees: String(halfYearlyFees).trim(),
                quarterlyFees: String(quarterlyFees).trim(),
                monthlyFees: String(monthlyFees).trim(),
                supportStaff: String(supportStaff).trim(),
                totalStops: totalStops === '' ? '' : Number(totalStops),
                distance: String(distance).trim(),
                estimatedTime: String(estimatedTime).trim(),
            }
        },
        validate: async () => {
            if (!String(routeName).trim()) return 'Route name is required.'
            if (!String(vehicleNumber).trim()) return 'Vehicle number is required.'
            if (!String(driverName).trim()) return 'Driver is required.'
            const imei = String(gpsImei).trim()
            if (imei && !/^\d{10,20}$/.test(imei)) {
                return 'GPS IMEI must be 10–20 digits (not the vehicle registration number).'
            }
            if (looksLikeGoogleMapsUrl(endMapsUrl) && (endLat === '' || endLng === '')) {
                const ok = await resolveMapsLink('end', endMapsUrl)
                if (!ok) return endMapsStatus || 'Could not read destination Google Maps link.'
            }
            return null
        },
        getDestinationLabel: () => String(endLocation || '').trim() || 'Queen Mira International School',
        getDestinationCoords: () => ({
            lat: endLat === '' ? '' : Number(endLat),
            lng: endLng === '' ? '' : Number(endLng),
            name: String(endLocation || '').trim(),
            mapsUrl: String(endMapsUrl || '').trim(),
        }),
        applyRouteMetrics: ({ distance: nextDistance, estimatedTime: nextEta, totalStops: nextStops } = {}) => {
            if (nextDistance != null && nextDistance !== '') setDistance(String(nextDistance))
            if (nextEta != null && nextEta !== '') setEstimatedTime(String(nextEta))
            if (nextStops != null && nextStops !== '') setTotalStops(nextStops)
        },
    }))

    const loadingLabel = loadingOptions ? 'Loading…' : '--Select--'

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='route-name' className='text-base font-medium text-[#1E1E1E]'>Route Name:</label>
                <input
                    type='text'
                    id='route-name'
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <select
                    id='vehicle-number'
                    value={vehicleNumber}
                    onChange={handleVehicleNumberChange}
                    className={selectClass}
                >
                    <option value=''>{loadingLabel}</option>
                    {vehicleNumber && !vehicles.some((v) => v.vehicleNumber === vehicleNumber) && (
                        <option value={vehicleNumber}>{vehicleNumber}</option>
                    )}
                    {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.vehicleNumber}>{vehicle.vehicleNumber}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='select-driver' className='text-base font-medium text-[#1E1E1E]'>Select Driver:</label>
                <select
                    id='select-driver'
                    value={driverName}
                    onChange={handleDriverChange}
                    className={selectClass}
                >
                    <option value=''>{loadingLabel}</option>
                    {driverName && !drivers.some((d) => d.label === driverName) && (
                        <option value={driverName}>{driverName}</option>
                    )}
                    {drivers.map((driver) => (
                        <option key={driver.id} value={driver.label}>{driver.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='route-gps-imei' className='text-base font-medium text-[#1E1E1E]'>GPS IMEI (ProTrack):</label>
                <input
                    type='text'
                    id='route-gps-imei'
                    value={gpsImei}
                    onChange={(e) => setGpsImei(e.target.value.replace(/[^\d]/g, ''))}
                    className={inputClass}
                    placeholder='Filled from vehicle, or enter IMEI'
                    inputMode='numeric'
                    autoComplete='off'
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-contact' className='text-base font-medium text-[#1E1E1E]'>Driver Contact:</label>
                <input
                    type='text'
                    id='driver-contact'
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-id' className='text-base font-medium text-[#1E1E1E]'>Vehicle ID:</label>
                <select
                    id='vehicle-id'
                    value={vehicleId}
                    onChange={handleVehicleIdChange}
                    className={selectClass}
                >
                    <option value=''>{loadingLabel}</option>
                    {vehicleId && !vehicles.some((v) => v.id === vehicleId) && (
                        <option value={vehicleId}>{vehicleId}</option>
                    )}
                    {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.id}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='start-location' className='text-base font-medium text-[#1E1E1E]'>Start Location:</label>
                <input
                    type='text'
                    id='start-location'
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='end-location' className='text-base font-medium text-[#1E1E1E]'>End Location:</label>
                <input
                    type='text'
                    id='end-location'
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='end-maps-url' className='text-base font-medium text-[#1E1E1E]'>
                    Destination Google Maps link (school):
                </label>
                <input
                    type='url'
                    id='end-maps-url'
                    value={endMapsUrl}
                    onChange={(e) => {
                        setEndMapsUrl(e.target.value)
                        setEndMapsStatus('')
                    }}
                    onBlur={() => {
                        if (looksLikeGoogleMapsUrl(endMapsUrl)) {
                            resolveMapsLink('end', endMapsUrl)
                        }
                    }}
                    className={inputClass}
                    placeholder='e.g. https://maps.app.goo.gl/…'
                    autoComplete='off'
                />
                <p className={`text-xs ${endMapsStatus.includes('set:') ? 'text-emerald-600' : 'text-[#667085]'}`}>
                    {resolvingEnd
                        ? 'Reading destination from Google Maps…'
                        : (endMapsStatus
                            || (endLat !== '' && endLng !== ''
                                ? `Saved school pin: ${Number(endLat).toFixed(5)}, ${Number(endLng).toFixed(5)}`
                                : 'Paste the school Maps link once here. Per-stop pickup links are added under Add Stops below.'))}
                </p>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='pick-up-time' className='text-base font-medium text-[#1E1E1E]'>Pick Up Time:</label>
                <input
                    type='text'
                    id='pick-up-time'
                    value={pickUpTime}
                    onChange={(e) => setPickUpTime(e.target.value)}
                    placeholder='e.g. 06:45 AM'
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='drop-time' className='text-base font-medium text-[#1E1E1E]'>Drop Time:</label>
                <input
                    type='text'
                    id='drop-time'
                    value={dropTime}
                    onChange={(e) => setDropTime(e.target.value)}
                    placeholder='e.g. 07:30 AM'
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2 lg:col-span-3'>
                <p className='text-sm text-[#667085] bg-[#F8FAFC] border border-[#E4E7EC] rounded-xl px-3 py-2'>
                    Set the route fee once — the same amount applies to every stop on this route (stops can still override if needed).
                    After Account Head creates <span className='font-medium text-[#1E1E1E]'>Transport Fee</span> in Fee Management,
                    enrolled students are billed from this route amount into Fee Collection.
                </p>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='yearly-fees' className='text-base font-medium text-[#1E1E1E]'>Yearly Fees:</label>
                <input
                    type='text'
                    id='yearly-fees'
                    value={yearlyFees}
                    onChange={(e) => {
                        const value = e.target.value
                        setYearlyFees(value)
                        const derived = deriveFeesFromYearly(value)
                        setHalfYearlyFees(derived.halfYearlyFees)
                        setQuarterlyFees(derived.quarterlyFees)
                        setMonthlyFees(derived.monthlyFees)
                    }}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='half-yearly-fees' className='text-base font-medium text-[#1E1E1E]'>Half Yearly Fees:</label>
                <input
                    type='text'
                    id='half-yearly-fees'
                    value={halfYearlyFees}
                    onChange={(e) => setHalfYearlyFees(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='quarterly-fees' className='text-base font-medium text-[#1E1E1E]'>Quarterly Fees:</label>
                <input
                    type='text'
                    id='quarterly-fees'
                    value={quarterlyFees}
                    onChange={(e) => setQuarterlyFees(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='monthly-fees' className='text-base font-medium text-[#1E1E1E]'>Monthly Fees:</label>
                <input
                    type='text'
                    id='monthly-fees'
                    value={monthlyFees}
                    onChange={(e) => setMonthlyFees(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='support-staff' className='text-base font-medium text-[#1E1E1E]'>Support Staff:</label>
                <input
                    type='text'
                    id='support-staff'
                    value={supportStaff}
                    onChange={(e) => setSupportStaff(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='total-stops' className='text-base font-medium text-[#1E1E1E]'>Total Stops:</label>
                <input
                    type='number'
                    id='total-stops'
                    value={totalStops}
                    onChange={(e) => setTotalStops(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='distance' className='text-base font-medium text-[#1E1E1E]'>Distance:</label>
                <input
                    type='text'
                    id='distance'
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder='Auto from pickup Maps pins'
                    className={inputClass}
                />
                <p className='text-xs text-[#667085]'>Auto-filled from stop Google Maps pins → school (you can still edit).</p>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='estimated-time' className='text-base font-medium text-[#1E1E1E]'>Estimated Time:</label>
                <input
                    type='text'
                    id='estimated-time'
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder='Auto from distance'
                    className={inputClass}
                />
            </div>
        </div>
    )
})

RouteDetailsForm.displayName = 'RouteDetailsForm'

export default RouteDetailsForm
