import React, { useEffect, useState } from 'react'
import { loadTransportChoices } from '../../liveTransportOptions'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const RouteDetailsForm = ({ route }) => {
    const [vehicles, setVehicles] = useState([])
    const [drivers, setDrivers] = useState([])
    const [selectedDriver, setSelectedDriver] = useState(route?.driverName ?? '')
    const [driverContact, setDriverContact] = useState(route?.driverContact ?? '')
    const [vehicleNumber, setVehicleNumber] = useState(route?.vehicleNumber ?? '')
    const [vehicleId, setVehicleId] = useState(route?.vehicleId ?? '')

    useEffect(() => {
        let active = true
        loadTransportChoices().then((choices) => {
            if (!active) return
            setVehicles(choices.vehicles)
            setDrivers(choices.drivers)
        }).catch(() => {
            if (!active) return
            setVehicles([])
            setDrivers([])
        })
        return () => { active = false }
    }, [])

    const onDriverChange = (label) => {
        setSelectedDriver(label)
        const match = drivers.find((driver) => driver.label === label)
        // Only copy a contact that already exists on the saved driver record.
        if (match?.contact) setDriverContact(match.contact)
        else if (!label) setDriverContact('')
    }

    const onVehicleNumberChange = (nextNumber) => {
        setVehicleNumber(nextNumber)
        const match = vehicles.find((vehicle) => vehicle.vehicleNumber === nextNumber)
        if (match?.id) setVehicleId(match.id)
        if (match?.driverName && !selectedDriver) {
            setSelectedDriver(match.driverName)
            if (match.driverContact) setDriverContact(match.driverContact)
        }
    }

    return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='route-name' className='text-base font-medium text-[#1E1E1E]'>Route Name:</label>
            <input type='text' id='route-name' defaultValue={route?.routeName ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
            <select
                id='vehicle-number'
                value={vehicleNumber}
                onChange={(e) => onVehicleNumberChange(e.target.value)}
                className={selectClass}
            >
                <option value=''>--Select--</option>
                {vehicles.length === 0 && <option value='' disabled>No saved vehicles</option>}
                {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.vehicleNumber}>{vehicle.vehicleNumber}</option>
                ))}
            </select>
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='gps-imei' className='text-base font-medium text-[#1E1E1E]'>GPS IMEI (optional override):</label>
            <input
                type='text'
                id='gps-imei'
                inputMode='numeric'
                autoComplete='off'
                placeholder='Usually taken from the vehicle record'
                defaultValue={route?.gpsImei || route?.imei || ''}
                className={inputClass}
            />
            <span className='text-xs text-[#667085]'>Prefer storing IMEI on the vehicle. Set here only if this route needs a temporary override.</span>
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='select-driver' className='text-base font-medium text-[#1E1E1E]'>Select Driver:</label>
            <select
                id='select-driver'
                value={selectedDriver}
                onChange={(e) => onDriverChange(e.target.value)}
                className={selectClass}
            >
                <option value=''>--Select--</option>
                {drivers.length === 0 && <option value='' disabled>No saved drivers</option>}
                {drivers.map((driver) => (
                    <option key={driver.id} value={driver.label}>{driver.label}</option>
                ))}
            </select>
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='driver-contact' className='text-base font-medium text-[#1E1E1E]'>Driver Contact:</label>
            <input
                type='text'
                id='driver-contact'
                value={driverContact}
                onChange={(e) => setDriverContact(e.target.value)}
                placeholder='Saved driver mobile only'
                className={inputClass}
            />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='vehicle-id' className='text-base font-medium text-[#1E1E1E]'>Vehicle ID:</label>
            <select
                id='vehicle-id'
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className={selectClass}
            >
                <option value=''>--Select--</option>
                {vehicles.map((vehicle) => (
                    <option key={`${vehicle.id}-id`} value={vehicle.id}>{vehicle.id}</option>
                ))}
            </select>
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='start-location' className='text-base font-medium text-[#1E1E1E]'>Start Location:</label>
            <input type='text' id='start-location' defaultValue={route?.startLocation ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='end-location' className='text-base font-medium text-[#1E1E1E]'>End Location:</label>
            <input type='text' id='end-location' defaultValue={route?.endLocation ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='pick-up-time' className='text-base font-medium text-[#1E1E1E]'>Pick Up Time:</label>
            <input type='text' id='pick-up-time' defaultValue={route?.pickUpTime ?? ''} placeholder='e.g. 06:45 AM' className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='drop-time' className='text-base font-medium text-[#1E1E1E]'>Drop Time:</label>
            <input type='text' id='drop-time' defaultValue={route?.dropTime ?? ''} placeholder='e.g. 07:30 AM' className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='yearly-fees' className='text-base font-medium text-[#1E1E1E]'>Yearly Fees:</label>
            <input type='text' id='yearly-fees' defaultValue={route?.yearlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='half-yearly-fees' className='text-base font-medium text-[#1E1E1E]'>Half Yearly Fees:</label>
            <input type='text' id='half-yearly-fees' defaultValue={route?.halfYearlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='quarterly-fees' className='text-base font-medium text-[#1E1E1E]'>Quarterly Fees:</label>
            <input type='text' id='quarterly-fees' defaultValue={route?.quarterlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='monthly-fees' className='text-base font-medium text-[#1E1E1E]'>Monthly Fees:</label>
            <input type='text' id='monthly-fees' defaultValue={route?.monthlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='support-staff' className='text-base font-medium text-[#1E1E1E]'>Support Staff:</label>
            <input type='text' id='support-staff' defaultValue={route?.supportStaff ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='total-stops' className='text-base font-medium text-[#1E1E1E]'>Total Stops:</label>
            <input type='number' id='total-stops' defaultValue={route?.totalStops ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='distance' className='text-base font-medium text-[#1E1E1E]'>Distance:</label>
            <input type='text' id='distance' defaultValue={route?.distance ?? ''} placeholder='e.g. 18.5 km' className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='estimated-time' className='text-base font-medium text-[#1E1E1E]'>Estimated Time:</label>
            <input type='text' id='estimated-time' defaultValue={route?.estimatedTime ?? ''} placeholder='e.g. 45 mins' className={inputClass} />
        </div>
    </div>
    )
}

export default RouteDetailsForm
