import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    VEHICLE_OPTIONS,
    VEHICLE_TYPES,
    SERVICE_TYPES,
    SERVICE_CENTERS,
    MAINTENANCE_STATUSES,
} from '../vehicleMaintenanceData'

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

const VehicleMaintenanceForm = ({ record }) => {
    const [lastServiceDate, setLastServiceDate] = useState(() => parseDate(record?.lastServiceDate))
    const [nextServiceDate, setNextServiceDate] = useState(() => parseDate(record?.nextServiceDate))
    const [vehicleNumber, setVehicleNumber] = useState(record?.vehicleNumber ?? '')
    const [vehicleType, setVehicleType] = useState(record?.vehicleType ?? '')

    const handleVehicleChange = (e) => {
        const selected = VEHICLE_OPTIONS.find((vehicle) => vehicle.label === e.target.value)
        setVehicleNumber(e.target.value)
        if (selected) {
            setVehicleType(selected.vehicleType)
        }
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <select id='vehicle-number' value={vehicleNumber} onChange={handleVehicleChange} className={selectClass}>
                    <option value=''>--Select--</option>
                    {VEHICLE_OPTIONS.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.label}>{vehicle.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-type' className='text-base font-medium text-[#1E1E1E]'>Vehicle Type:</label>
                <select id='vehicle-type' value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
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
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='service-type' className='text-base font-medium text-[#1E1E1E]'>Service Type:</label>
                <select id='service-type' defaultValue={record?.serviceType ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {SERVICE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='service-center' className='text-base font-medium text-[#1E1E1E]'>Service Center:</label>
                <select id='service-center' defaultValue={record?.serviceCenter ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {SERVICE_CENTERS.map((center) => (
                        <option key={center} value={center}>{center}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='estimated-cost' className='text-base font-medium text-[#1E1E1E]'>Estimated Cost:</label>
                <input type='text' id='estimated-cost' defaultValue={record?.estimatedCost ?? ''} placeholder='e.g. ₹12,500' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='status' className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                <select id='status' defaultValue={record?.status ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {MAINTENANCE_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export default VehicleMaintenanceForm
