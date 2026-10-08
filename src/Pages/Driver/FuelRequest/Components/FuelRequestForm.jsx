import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    DEFAULT_DRIVER,
    FUEL_LEVEL_OPTIONS,
} from '../fuelRequestData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const FuelRequestForm = ({ record, readOnly = false, showRequestId = false }) => {
    const defaults = record ?? DEFAULT_DRIVER
    const [requestDate, setRequestDate] = useState(() => parseDate(record?.requestDate))

    const renderField = (label, content) => (
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>{label}</label>
            {content}
        </div>
    )

    if (readOnly) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                {showRequestId && renderField('Fuel Request ID:', <div className={inputClass}>{record?.fuelRequestId || '—'}</div>)}
                {renderField('Vehicle Number:', <div className={inputClass}>{record?.vehicleNumber || '—'}</div>)}
                {renderField('Driver Name:', <div className={inputClass}>{record?.driverName || '—'}</div>)}
                {renderField('Driver ID:', <div className={inputClass}>{record?.driverId || '—'}</div>)}
                {renderField('Current Odometer Reading:', <div className={inputClass}>{record?.currentOdometerReading || '—'}</div>)}
                {renderField('Current Fuel Level:', <div className={inputClass}>{record?.currentFuelLevel || '—'}</div>)}
                {renderField('Assigned Route:', <div className={inputClass}>{record?.assignedRoute || '—'}</div>)}
                {renderField('Requested Quantity:', <div className={inputClass}>{record?.requestedQuantity || '—'}</div>)}
                {renderField('Request Date:', <div className={inputClass}>{record?.requestDate || '—'}</div>)}
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            {renderField(
                'Vehicle Number:',
                <input type='text' defaultValue={defaults.vehicleNumber ?? ''} className={inputClass} />,
            )}
            {renderField(
                'Driver Name:',
                <input type='text' defaultValue={defaults.driverName ?? ''} className={inputClass} />,
            )}
            {renderField(
                'Driver ID:',
                <input type='text' defaultValue={defaults.driverId ?? ''} className={inputClass} />,
            )}
            {renderField(
                'Current Odometer Reading:',
                <input
                    type='text'
                    defaultValue={record?.currentOdometerReading ?? ''}
                    placeholder='e.g. 45,250 KM'
                    className={inputClass}
                />,
            )}
            {renderField(
                'Current Fuel Level:',
                <select defaultValue={record?.currentFuelLevel ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {FUEL_LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>,
            )}
            {renderField(
                'Assigned Route:',
                <input type='text' defaultValue={defaults.assignedRoute ?? ''} className={inputClass} />,
            )}
            {renderField(
                'Requested Quantity:',
                <input
                    type='text'
                    defaultValue={record?.requestedQuantity ?? ''}
                    placeholder='e.g. 60 Liters'
                    className={inputClass}
                />,
            )}
            {renderField(
                'Request Date:',
                <div className='relative'>
                    <DatePicker
                        selected={requestDate}
                        onChange={(date) => setRequestDate(date)}
                        dateFormat='dd-MM-yyyy'
                        isClearable
                        placeholderText='Select date'
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>,
            )}
        </div>
    )
}

export default FuelRequestForm
