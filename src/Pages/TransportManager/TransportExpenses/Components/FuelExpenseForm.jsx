import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { VEHICLE_OPTIONS, FUEL_STATIONS, PAYMENT_MODES } from '../transportExpensesData'
import { addFuelEntry } from '../../../../Common/demoDomain/financeExtras'
import { toast } from 'react-toastify'

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

const FuelExpenseForm = ({ expense }) => {
    const [fuelDate, setFuelDate] = useState(() => parseDate(expense?.fuelDate))
    const [vehicleNumber, setVehicleNumber] = useState(expense?.vehicleNumber ?? '')
    const [driverName, setDriverName] = useState(expense?.driverName ?? '')

    const [entryType, setEntryType] = useState('Inside')
    const [quantity, setQuantity] = useState('')
    const [rate, setRate] = useState('')
    const [odometer, setOdometer] = useState('')
    const [station, setStation] = useState('')
    const [remarks, setRemarks] = useState('')

    const saveEntry = () => {
        if (!vehicleNumber || !quantity || !rate) {
            toast.error('Vehicle, quantity, and rate are required.')
            return
        }
        addFuelEntry({
            vehicle: vehicleNumber,
            quantity: Number(quantity),
            rate: Number(rate),
            odometer,
            station: document.getElementById('fuel-station')?.value || station,
            type: entryType,
            remarks,
            date: fuelDate ? fuelDate.toISOString().slice(0, 10) : '',
        })
        toast.success('Fuel entry saved locally.')
    }

    const handleVehicleChange = (e) => {
        const selected = VEHICLE_OPTIONS.find((vehicle) => vehicle.label === e.target.value)
        setVehicleNumber(e.target.value)
        if (selected) {
            setDriverName(selected.driverName)
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
                <label htmlFor='driver-name' className='text-base font-medium text-[#1E1E1E]'>Driver Name:</label>
                <input type='text' id='driver-name' value={driverName} onChange={(e) => setDriverName(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Fuel Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={fuelDate}
                        onChange={(date) => setFuelDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='fuel-station' className='text-base font-medium text-[#1E1E1E]'>Fuel Station:</label>
                <select id='fuel-station' defaultValue={expense?.fuelStation ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {FUEL_STATIONS.map((station) => (
                        <option key={station} value={station}>{station}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Inside / Outside:</label>
                <select value={entryType} onChange={(event) => setEntryType(event.target.value)} className={selectClass}>
                    <option>Inside</option>
                    <option>Outside</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Quantity:</label>
                <input value={quantity} onChange={(event) => setQuantity(event.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Rate:</label>
                <input value={rate} onChange={(event) => setRate(event.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Odometer:</label>
                <input value={odometer} onChange={(event) => setOdometer(event.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2 lg:col-span-3'>
                <label className='text-base font-medium text-[#1E1E1E]'>Remarks:</label>
                <input value={remarks} onChange={(event) => setRemarks(event.target.value)} className={inputClass} />
                <button type='button' onClick={() => { setStation(document.getElementById('fuel-station')?.value || ''); saveEntry() }} className='mt-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md w-fit cursor-pointer'>Add Entry</button>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='amount' className='text-base font-medium text-[#1E1E1E]'>Amount:</label>
                <input type='text' id='amount' defaultValue={expense?.amount ?? ''} placeholder='e.g. ₹12,480' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='payment-mode' className='text-base font-medium text-[#1E1E1E]'>Payment Mode:</label>
                <select id='payment-mode' defaultValue={expense?.paymentMode ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export default FuelExpenseForm
