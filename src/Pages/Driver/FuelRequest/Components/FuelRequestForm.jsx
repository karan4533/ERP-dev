import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext'
import { formatTransportDate } from '../../../TransportManager/transportCampus'
import { hydrateDriverProfileSources } from '../../driverProfileData'
import {
    FUEL_LEVEL_OPTIONS,
    getDefaultDriver,
} from '../fuelRequestData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = String(value).split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const FuelRequestForm = forwardRef(({ record, readOnly = false, showRequestId = false }, ref) => {
    const { email } = useAuth()
    const [defaults, setDefaults] = useState(() => record || getDefaultDriver(email))
    const [vehicleNumber, setVehicleNumber] = useState(record?.vehicleNumber || '')
    const [driverName, setDriverName] = useState(record?.driverName || '')
    const [driverId, setDriverId] = useState(record?.driverId || '')
    const [assignedRoute, setAssignedRoute] = useState(record?.assignedRoute || '')
    const [currentOdometerReading, setCurrentOdometerReading] = useState(record?.currentOdometerReading || '')
    const [currentFuelLevel, setCurrentFuelLevel] = useState(record?.currentFuelLevel || '')
    const [requestedQuantity, setRequestedQuantity] = useState(record?.requestedQuantity || '')
    const [requestDate, setRequestDate] = useState(() => parseDate(record?.requestDate))

    useEffect(() => {
        if (record) return undefined
        let cancelled = false
        hydrateDriverProfileSources().finally(() => {
            if (cancelled) return
            const next = getDefaultDriver(email)
            setDefaults(next)
            setVehicleNumber(next.vehicleNumber || '')
            setDriverName(next.driverName || '')
            setDriverId(next.driverId || '')
            setAssignedRoute(next.assignedRoute || '')
        })
        return () => { cancelled = true }
    }, [email, record])

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            vehicleNumber: String(vehicleNumber).trim(),
            driverName: String(driverName).trim(),
            driverId: String(driverId).trim(),
            assignedRoute: String(assignedRoute).trim(),
            currentOdometerReading: String(currentOdometerReading).trim(),
            currentFuelLevel: String(currentFuelLevel).trim(),
            requestedQuantity: String(requestedQuantity).trim(),
            requestDate: formatTransportDate(requestDate) || formatTransportDate(new Date()),
        }),
        validate: () => {
            if (!String(vehicleNumber).trim()) return 'Vehicle number is required.'
            if (!String(requestedQuantity).trim()) return 'Requested quantity is required.'
            return null
        },
    }))

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
            {renderField('Vehicle Number:', (
                <input type='text' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputClass} />
            ))}
            {renderField('Driver Name:', (
                <input type='text' value={driverName} onChange={(e) => setDriverName(e.target.value)} className={inputClass} />
            ))}
            {renderField('Driver ID:', (
                <input type='text' value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputClass} />
            ))}
            {renderField('Current Odometer Reading:', (
                <input
                    type='text'
                    value={currentOdometerReading}
                    onChange={(e) => setCurrentOdometerReading(e.target.value)}
                    placeholder='e.g. 45,250 KM'
                    className={inputClass}
                />
            ))}
            {renderField('Current Fuel Level:', (
                <select value={currentFuelLevel} onChange={(e) => setCurrentFuelLevel(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {FUEL_LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            ))}
            {renderField('Assigned Route:', (
                <input type='text' value={assignedRoute} onChange={(e) => setAssignedRoute(e.target.value)} className={inputClass} />
            ))}
            {renderField('Requested Quantity:', (
                <input
                    type='text'
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(e.target.value)}
                    placeholder='e.g. 60 Liters'
                    className={inputClass}
                />
            ))}
            {renderField('Request Date:', (
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
                </div>
            ))}
            {!record && !defaults.vehicleNumber && (
                <p className='sm:col-span-2 lg:col-span-3 text-sm text-[#667085]'>
                    Vehicle / route will auto-fill from your driver profile once Transport Manager assigns them.
                </p>
            )}
        </div>
    )
})

FuelRequestForm.displayName = 'FuelRequestForm'

export default FuelRequestForm
