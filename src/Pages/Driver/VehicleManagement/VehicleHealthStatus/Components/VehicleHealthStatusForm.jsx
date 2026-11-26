import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    CONDITION_OPTIONS,
    FUEL_LEVEL_OPTIONS,
    VEHICLE_NUMBERS,
} from '../vehicleHealthStatusData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const parseDate = (value) => {
    if (!value) return null
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const VehicleHealthStatusForm = ({ record, readOnly = false }) => {
    const [lastServiceDate, setLastServiceDate] = useState(() => parseDate(record?.lastServiceDate))
    const [nextServiceDate, setNextServiceDate] = useState(() => parseDate(record?.nextServiceDate))

    const renderField = (label, content) => (
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>{label}</label>
            {content}
        </div>
    )

    if (readOnly) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                {renderField('Vehicle Number:', <div className={inputClass}>{record?.vehicleNumber || '—'}</div>)}
                {renderField('Last Service Date:', <div className={inputClass}>{record?.lastServiceDate || '—'}</div>)}
                {renderField('Next Service Date:', <div className={inputClass}>{record?.nextServiceDate || '—'}</div>)}
                {renderField('Odometer Reading:', <div className={inputClass}>{record?.odometerReading || '—'}</div>)}
                {renderField('Fuel Level:', <div className={inputClass}>{record?.fuelLevel || '—'}</div>)}
                {renderField('Tyre Condition:', <div className={inputClass}>{record?.tyreCondition || '—'}</div>)}
                {renderField('Battery Status:', <div className={inputClass}>{record?.batteryStatus || '—'}</div>)}
                {renderField('Engine Status:', <div className={inputClass}>{record?.engineStatus || '—'}</div>)}
                {renderField('Remarks:', <div className={`${inputClass} min-h-[48px]`}>{record?.remarks || '—'}</div>)}
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            {renderField(
                'Vehicle Number:',
                <select defaultValue={record?.vehicleNumber ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {VEHICLE_NUMBERS.map((number) => (
                        <option key={number} value={number}>{number}</option>
                    ))}
                </select>,
            )}
            {renderField(
                'Last Service Date:',
                <div className='relative'>
                    <DatePicker
                        selected={lastServiceDate}
                        onChange={(date) => setLastServiceDate(date)}
                        dateFormat='dd-MM-yyyy'
                        isClearable
                        placeholderText='Select date'
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>,
            )}
            {renderField(
                'Next Service Date:',
                <div className='relative'>
                    <DatePicker
                        selected={nextServiceDate}
                        onChange={(date) => setNextServiceDate(date)}
                        dateFormat='dd-MM-yyyy'
                        isClearable
                        placeholderText='Select date'
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>,
            )}
            {renderField(
                'Odometer Reading:',
                <input
                    type='text'
                    defaultValue={record?.odometerReading ?? ''}
                    placeholder='e.g. 45,250 KM'
                    className={inputClass}
                />,
            )}
            {renderField(
                'Fuel Level:',
                <select defaultValue={record?.fuelLevel ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {FUEL_LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>,
            )}
            {renderField(
                'Tyre Condition:',
                <select defaultValue={record?.tyreCondition ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {CONDITION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>,
            )}
            {renderField(
                'Battery Status:',
                <select defaultValue={record?.batteryStatus ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {CONDITION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>,
            )}
            {renderField(
                'Engine Status:',
                <select defaultValue={record?.engineStatus ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {CONDITION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>,
            )}
            {renderField(
                'Remarks:',
                <input
                    type='text'
                    defaultValue={record?.remarks ?? ''}
                    placeholder='Enter remarks'
                    className={inputClass}
                />,
            )}
        </div>
    )
}

export default VehicleHealthStatusForm
