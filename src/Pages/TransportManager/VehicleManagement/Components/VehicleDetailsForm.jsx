import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    BUS_TYPES,
    CAR_TYPES,
    VEHICLE_CATEGORIES,
    VEHICLE_TYPES,
} from '../vehicleManagementData'
import { getDriverOptions, hydrateDriversFromApi } from '../../DriverManagement/driverManagementData'
import { formatTransportDate, parseTransportDate } from '../../transportCampus'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const VehicleDetailsForm = forwardRef(({ vehicle }, ref) => {
    const [drivers, setDrivers] = useState(() => getDriverOptions())
    const [loadingDrivers, setLoadingDrivers] = useState(false)
    const [vehicleNumber, setVehicleNumber] = useState(vehicle?.vehicleNumber ?? '')
    const [category, setCategory] = useState(vehicle?.category ?? 'Bus')
    const [vehicleType, setVehicleType] = useState(vehicle?.vehicleType ?? '')
    const [capacity, setCapacity] = useState(vehicle?.capacity ?? '')
    const [driverName, setDriverName] = useState(vehicle?.driverName ?? '')
    const [driverContact, setDriverContact] = useState(vehicle?.driverContact ?? '')
    const [conductorName, setConductorName] = useState(vehicle?.conductorName ?? '')
    const [studentStrength, setStudentStrength] = useState(vehicle?.studentStrength ?? '')
    const [staffStrength, setStaffStrength] = useState(vehicle?.staffStrength ?? '')
    const [currentOdometer, setCurrentOdometer] = useState(vehicle?.currentOdometer ?? '')
    const [insuranceExpiryDate, setInsuranceExpiryDate] = useState(() => parseTransportDate(vehicle?.insuranceExpiryDate))
    const [lastServiceDate, setLastServiceDate] = useState(() => parseTransportDate(vehicle?.lastServiceDate))
    const [nextServiceDate, setNextServiceDate] = useState(() => parseTransportDate(vehicle?.nextServiceDate))

    useEffect(() => {
        let cancelled = false
        setLoadingDrivers(true)
        hydrateDriversFromApi()
            .finally(() => {
                if (!cancelled) {
                    setDrivers(getDriverOptions())
                    setLoadingDrivers(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    const typeOptions = useMemo(() => {
        if (category === 'Car') return CAR_TYPES
        if (category === 'Bus') return BUS_TYPES
        return VEHICLE_TYPES
    }, [category])

    useEffect(() => {
        if (vehicleType && !typeOptions.includes(vehicleType)) {
            setVehicleType('')
        }
    }, [typeOptions, vehicleType])

    const handleDriverChange = (event) => {
        const selected = drivers.find((driver) => driver.label === event.target.value)
        setDriverName(event.target.value)
        if (selected?.contact) setDriverContact(selected.contact)
    }

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            vehicleNumber: String(vehicleNumber).trim().toUpperCase(),
            category,
            vehicleType,
            capacity: capacity === '' ? '' : Number(capacity),
            driverName,
            driverContact: String(driverContact).trim(),
            conductorName: String(conductorName).trim(),
            studentStrength: studentStrength === '' ? '' : Number(studentStrength),
            staffStrength: staffStrength === '' ? '' : Number(staffStrength),
            currentOdometer: currentOdometer === '' ? '' : Number(currentOdometer),
            insuranceExpiryDate: formatTransportDate(insuranceExpiryDate),
            lastServiceDate: formatTransportDate(lastServiceDate),
            nextServiceDate: formatTransportDate(nextServiceDate),
        }),
        validate: () => {
            if (!String(vehicleNumber).trim()) return 'Vehicle number is required.'
            if (!vehicleType) return 'Vehicle type is required.'
            return null
        },
    }))

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <input
                    type='text'
                    id='vehicle-number'
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className={inputClass}
                    placeholder='e.g. TN-38-CJ-9008'
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-type' className='text-base font-medium text-[#1E1E1E]'>Vehicle Type:</label>
                <select
                    id='vehicle-type'
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className={selectClass}
                >
                    <option value=''>--Select--</option>
                    {typeOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='capacity' className='text-base font-medium text-[#1E1E1E]'>Capacity:</label>
                <input
                    type='number'
                    id='capacity'
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-name' className='text-base font-medium text-[#1E1E1E]'>Driver Name:</label>
                <select
                    id='driver-name'
                    value={driverName}
                    onChange={handleDriverChange}
                    className={selectClass}
                >
                    <option value=''>{loadingDrivers ? 'Loading drivers…' : '--Select--'}</option>
                    {driverName && !drivers.some((d) => d.label === driverName) && (
                        <option value={driverName}>{driverName}</option>
                    )}
                    {drivers.map((driver) => (
                        <option key={driver.id} value={driver.label}>{driver.label}</option>
                    ))}
                </select>
                {!loadingDrivers && drivers.length === 0 && (
                    <p className='text-xs text-[#667085]'>No active drivers yet — add them under Driver Management.</p>
                )}
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
                <label htmlFor='vehicle-category' className='text-base font-medium text-[#1E1E1E]'>Vehicle Category:</label>
                <select
                    id='vehicle-category'
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={selectClass}
                >
                    {VEHICLE_CATEGORIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='conductor-name' className='text-base font-medium text-[#1E1E1E]'>Conductor Name:</label>
                <input
                    type='text'
                    id='conductor-name'
                    value={conductorName}
                    onChange={(e) => setConductorName(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='student-strength' className='text-base font-medium text-[#1E1E1E]'>Student Strength:</label>
                <input
                    type='number'
                    id='student-strength'
                    value={studentStrength}
                    onChange={(e) => setStudentStrength(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='staff-strength' className='text-base font-medium text-[#1E1E1E]'>Staff Strength:</label>
                <input
                    type='number'
                    id='staff-strength'
                    value={staffStrength}
                    onChange={(e) => setStaffStrength(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='odometer' className='text-base font-medium text-[#1E1E1E]'>Current Odometer:</label>
                <input
                    type='number'
                    id='odometer'
                    value={currentOdometer}
                    onChange={(e) => setCurrentOdometer(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Insurance Expiry Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={insuranceExpiryDate}
                        onChange={(date) => setInsuranceExpiryDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Last Service Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={lastServiceDate}
                        onChange={(date) => setLastServiceDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Next Service Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={nextServiceDate}
                        onChange={(date) => setNextServiceDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
        </div>
    )
})

VehicleDetailsForm.displayName = 'VehicleDetailsForm'

export default VehicleDetailsForm
