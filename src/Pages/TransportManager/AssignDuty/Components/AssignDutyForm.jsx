import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    SHIFTS,
    getAssignDutyDriverOptions,
    getAssignDutyRouteOptions,
} from '../assignDutyData'
import { hydrateDriversFromApi } from '../../DriverManagement/driverManagementData'
import { hydrateRoutesFromApi } from '../../RouteManagement/routeManagementData'
import { hydrateVehiclesFromApi } from '../../VehicleManagement/vehicleManagementData'
import { formatTransportDate, parseTransportDate } from '../../transportCampus'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const AssignDutyForm = forwardRef(({ duty }, ref) => {
    const [driverOptions, setDriverOptions] = useState(() => getAssignDutyDriverOptions())
    const [routeOptions, setRouteOptions] = useState(() => getAssignDutyRouteOptions())
    const [loadingOptions, setLoadingOptions] = useState(false)

    const [vehicleType, setVehicleType] = useState(duty?.vehicleType ?? 'Bus')
    const [dutyType, setDutyType] = useState(duty?.dutyType ?? 'Pickup')
    const [dutyDate, setDutyDate] = useState(() => parseTransportDate(duty?.dutyDate))
    const [driverName, setDriverName] = useState(duty?.driverName ?? '')
    const [driverId, setDriverId] = useState(duty?.driverId ?? '')
    const [vehicleNumber, setVehicleNumber] = useState(duty?.vehicleNumber ?? '')
    const [routeName, setRouteName] = useState(duty?.routeName ?? '')
    const [shift, setShift] = useState(duty?.shift ?? '')
    const [startTime, setStartTime] = useState(duty?.startTime ?? '')
    const [endTime, setEndTime] = useState(duty?.endTime ?? '')

    useEffect(() => {
        let cancelled = false
        setLoadingOptions(true)
        Promise.all([hydrateDriversFromApi(), hydrateVehiclesFromApi(), hydrateRoutesFromApi()])
            .finally(() => {
                if (!cancelled) {
                    setDriverOptions(getAssignDutyDriverOptions())
                    setRouteOptions(getAssignDutyRouteOptions())
                    setLoadingOptions(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    const handleDriverChange = (e) => {
        const selected = driverOptions.find((driver) => driver.label === e.target.value)
        setDriverName(e.target.value)
        if (selected) {
            setDriverId(selected.id)
            if (selected.vehicleNumber) setVehicleNumber(selected.vehicleNumber)
            if (selected.routeName) setRouteName(selected.routeName)
        }
    }

    const handleRouteChange = (e) => {
        const selected = routeOptions.find((route) => route.label === e.target.value)
        setRouteName(e.target.value)
        if (selected?.vehicleNumber) {
            setVehicleNumber(selected.vehicleNumber)
        }
    }

    useImperativeHandle(ref, () => ({
        getValues: () => {
            const selectedRoute = routeOptions.find((route) => route.label === routeName)
            // Pickup = morning to school; Drop = school back to pickup points.
            const normalizedType = String(dutyType || 'Pickup').trim() === 'Drop' ? 'Drop' : 'Pickup'
            return {
                vehicleType,
                dutyType: normalizedType,
                driverName,
                driverId: String(driverId).trim(),
                vehicleNumber: String(vehicleNumber).trim(),
                routeName,
                routeId: selectedRoute?.id || duty?.routeId || '',
                dutyDate: formatTransportDate(dutyDate),
                shift: shift || (normalizedType === 'Drop' ? 'Afternoon' : 'Morning'),
                startTime: String(startTime).trim(),
                endTime: String(endTime).trim(),
                status: duty?.status || duty?.dutyStatus || 'Assigned',
                dutyStatus: duty?.dutyStatus || duty?.status || 'Assigned',
                trackingActive: duty?.trackingActive !== false,
                assignedBy: duty?.assignedBy || 'Transport Manager',
            }
        },
        validate: () => {
            if (!String(driverName).trim()) return 'Driver is required.'
            if (!String(routeName).trim()) return 'Route is required.'
            if (!formatTransportDate(dutyDate)) return 'Duty date is required.'
            return null
        },
    }))

    const loadingLabel = loadingOptions ? 'Loading…' : '--Select--'

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Vehicle Type:</label>
                <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={selectClass}>
                    <option>Bus</option>
                    <option>Car</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Duty Type:</label>
                <select value={dutyType} onChange={(e) => setDutyType(e.target.value)} className={selectClass}>
                    <option>Pickup</option>
                    <option>Drop</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-name' className='text-base font-medium text-[#1E1E1E]'>Driver Name:</label>
                <select id='driver-name' value={driverName} onChange={handleDriverChange} className={selectClass}>
                    <option value=''>{loadingLabel}</option>
                    {driverName && !driverOptions.some((d) => d.label === driverName) && (
                        <option value={driverName}>{driverName}</option>
                    )}
                    {driverOptions.map((driver) => (
                        <option key={driver.id} value={driver.label}>{driver.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-id' className='text-base font-medium text-[#1E1E1E]'>Driver ID:</label>
                <input type='text' id='driver-id' value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <input type='text' id='vehicle-number' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='route-name' className='text-base font-medium text-[#1E1E1E]'>Route Name:</label>
                <select id='route-name' value={routeName} onChange={handleRouteChange} className={selectClass}>
                    <option value=''>{loadingLabel}</option>
                    {routeName && !routeOptions.some((r) => r.label === routeName) && (
                        <option value={routeName}>{routeName}</option>
                    )}
                    {routeOptions.map((route) => (
                        <option key={route.id} value={route.label}>{route.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Duty Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={dutyDate}
                        onChange={(date) => setDutyDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='shift' className='text-base font-medium text-[#1E1E1E]'>Shift:</label>
                <select id='shift' value={shift} onChange={(e) => setShift(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {SHIFTS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='start-time' className='text-base font-medium text-[#1E1E1E]'>Start Time:</label>
                <input
                    type='text'
                    id='start-time'
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder='e.g. 06:30 AM'
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='end-time' className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                <input
                    type='text'
                    id='end-time'
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder='e.g. 02:00 PM'
                    className={inputClass}
                />
            </div>
        </div>
    )
})

AssignDutyForm.displayName = 'AssignDutyForm'

export default AssignDutyForm
