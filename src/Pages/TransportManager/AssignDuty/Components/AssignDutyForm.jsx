import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { DRIVER_OPTIONS, ROUTE_OPTIONS, SHIFTS } from '../assignDutyData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const AssignDutyForm = ({ duty }) => {
    const [dutyDate, setDutyDate] = useState(() => parseDate(duty?.dutyDate))
    const [driverName, setDriverName] = useState(duty?.driverName ?? '')
    const [driverId, setDriverId] = useState(duty?.driverId ?? '')
    const [vehicleNumber, setVehicleNumber] = useState(duty?.vehicleNumber ?? '')
    const [routeName, setRouteName] = useState(duty?.routeName ?? '')

    const handleDriverChange = (e) => {
        const selected = DRIVER_OPTIONS.find((driver) => driver.label === e.target.value)
        setDriverName(e.target.value)
        if (selected) {
            setDriverId(selected.id)
            setVehicleNumber(selected.vehicleNumber)
            setRouteName(selected.routeName)
        }
    }

    const handleRouteChange = (e) => {
        const selected = ROUTE_OPTIONS.find((route) => route.label === e.target.value)
        setRouteName(e.target.value)
        if (selected) {
            setVehicleNumber(selected.vehicleNumber)
        }
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Vehicle Type:</label>
                <select defaultValue={duty?.vehicleType ?? 'Bus'} className={selectClass}>
                    <option>Bus</option>
                    <option>Car</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Duty Type:</label>
                <select defaultValue={duty?.dutyType ?? 'Pickup'} className={selectClass}>
                    <option>Pickup</option>
                    <option>Drop</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-name' className='text-base font-medium text-[#1E1E1E]'>Driver Name:</label>
                <select id='driver-name' value={driverName} onChange={handleDriverChange} className={selectClass}>
                    <option value=''>--Select--</option>
                    {DRIVER_OPTIONS.map((driver) => (
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
                    <option value=''>--Select--</option>
                    {ROUTE_OPTIONS.map((route) => (
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
                <select id='shift' defaultValue={duty?.shift ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {SHIFTS.map((shift) => (
                        <option key={shift} value={shift}>{shift}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='start-time' className='text-base font-medium text-[#1E1E1E]'>Start Time:</label>
                <input type='text' id='start-time' defaultValue={duty?.startTime ?? ''} placeholder='e.g. 06:30 AM' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='end-time' className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                <input type='text' id='end-time' defaultValue={duty?.endTime ?? ''} placeholder='e.g. 02:00 PM' className={inputClass} />
            </div>
        </div>
    )
}

export default AssignDutyForm
