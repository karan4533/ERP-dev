import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { VEHICLE_TYPES } from '../vehicleManagementData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const parseDate = (value) => {
    if (!value) return null
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const VehicleDetailsForm = ({ vehicle }) => {
    const [insuranceExpiryDate, setInsuranceExpiryDate] = useState(() => parseDate(vehicle?.insuranceExpiryDate) ?? new Date())
    const [lastServiceDate, setLastServiceDate] = useState(() => parseDate(vehicle?.lastServiceDate) ?? new Date())
    const [nextServiceDate, setNextServiceDate] = useState(() => parseDate(vehicle?.nextServiceDate) ?? new Date())
    const [fcExpiryDate, setFcExpiryDate] = useState(() => parseDate(vehicle?.fcExpiryDate) ?? new Date())
    const [rcExpiryDate, setRcExpiryDate] = useState(() => parseDate(vehicle?.rcExpiryDate) ?? new Date())
    const [permitExpiryDate, setPermitExpiryDate] = useState(() => parseDate(vehicle?.permitExpiryDate) ?? new Date())
    const [puccExpiryDate, setPuccExpiryDate] = useState(() => parseDate(vehicle?.puccExpiryDate) ?? new Date())

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <input type='text' id='vehicle-number' defaultValue={vehicle?.vehicleNumber ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-type' className='text-base font-medium text-[#1E1E1E]'>Vehicle Type:</label>
                <select id='vehicle-type' defaultValue={vehicle?.vehicleType ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='capacity' className='text-base font-medium text-[#1E1E1E]'>Capacity:</label>
                <input type='number' id='capacity' defaultValue={vehicle?.capacity ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-name' className='text-base font-medium text-[#1E1E1E]'>Driver Name:</label>
                <input type='text' id='driver-name' defaultValue={vehicle?.driverName ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-contact' className='text-base font-medium text-[#1E1E1E]'>Driver Contact:</label>
                <input type='text' id='driver-contact' defaultValue={vehicle?.driverContact ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-category' className='text-base font-medium text-[#1E1E1E]'>Vehicle Category:</label>
                <select id='vehicle-category' defaultValue={vehicle?.category ?? 'Bus'} className={selectClass}>
                    <option value='Bus'>Bus</option>
                    <option value='Car'>Car</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='conductor-name' className='text-base font-medium text-[#1E1E1E]'>Conductor Name:</label>
                <input type='text' id='conductor-name' defaultValue={vehicle?.conductorName ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='student-strength' className='text-base font-medium text-[#1E1E1E]'>Student Strength:</label>
                <input type='number' id='student-strength' defaultValue={vehicle?.studentStrength ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='staff-strength' className='text-base font-medium text-[#1E1E1E]'>Staff Strength:</label>
                <input type='number' id='staff-strength' defaultValue={vehicle?.staffStrength ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='odometer' className='text-base font-medium text-[#1E1E1E]'>Current Odometer:</label>
                <input type='number' id='odometer' defaultValue={vehicle?.currentOdometer ?? ''} className={inputClass} />
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
            {/* Compliance Documentation Fields per Client Review #2 */}
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='rc-number' className='text-base font-medium text-[#1E1E1E]'>RC Number:</label>
                <input type='text' id='rc-number' defaultValue={vehicle?.rcNumber ?? ''} placeholder='e.g. RC-TN-09-4521' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>FC (Fitness) Expiry Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={fcExpiryDate}
                        onChange={(date) => setFcExpiryDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='permit-number' className='text-base font-medium text-[#1E1E1E]'>Road Permit Number:</label>
                <input type='text' id='permit-number' defaultValue={vehicle?.permitNumber ?? ''} placeholder='e.g. PER-2026-992' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Road Permit Expiry Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={permitExpiryDate}
                        onChange={(date) => setPermitExpiryDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='fastag-id' className='text-base font-medium text-[#1E1E1E]'>FASTag Tag ID / Account:</label>
                <input type='text' id='fastag-id' defaultValue={vehicle?.fastagId ?? ''} placeholder='e.g. NETC-3412-9901' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>PUCC Expiry Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={puccExpiryDate}
                        onChange={(date) => setPuccExpiryDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
        </div>
    )
}

export default VehicleDetailsForm
