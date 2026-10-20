import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { FUEL_STATIONS, PAYMENT_MODES, getExpenseVehicleOptions } from '../transportExpensesData'
import { getDriverOptions, hydrateDriversFromApi } from '../../DriverManagement/driverManagementData'
import { hydrateVehiclesFromApi } from '../../VehicleManagement/vehicleManagementData'
import { formatTransportDate, parseTransportDate } from '../../transportCampus'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const parseQty = (value) => {
    const match = String(value || '').match(/[\d.]+/)
    return match ? match[0] : ''
}

const FuelExpenseForm = forwardRef(({ expense }, ref) => {
    const [vehicles, setVehicles] = useState(() => getExpenseVehicleOptions())
    const [drivers, setDrivers] = useState(() => getDriverOptions({ activeOnly: true }))
    const [loadingOptions, setLoadingOptions] = useState(false)

    const [fuelDate, setFuelDate] = useState(() => parseTransportDate(expense?.fuelDate))
    const [vehicleNumber, setVehicleNumber] = useState(expense?.vehicleNumber ?? '')
    const [driverName, setDriverName] = useState(expense?.driverName ?? '')
    const [fuelStation, setFuelStation] = useState(expense?.fuelStation ?? '')
    const [entryType, setEntryType] = useState(expense?.entryType ?? 'Inside')
    const [quantity, setQuantity] = useState(() => (
        expense?.quantity != null ? String(expense.quantity) : parseQty(expense?.fuelQuantity)
    ))
    const [rate, setRate] = useState(() => (expense?.rate != null ? String(expense.rate) : ''))
    const [odometer, setOdometer] = useState(expense?.odometer ?? '')
    const [remarks, setRemarks] = useState(expense?.remarks ?? '')
    const [amount, setAmount] = useState(expense?.amount ?? '')
    const [paymentMode, setPaymentMode] = useState(expense?.paymentMode ?? '')

    useEffect(() => {
        let cancelled = false
        setLoadingOptions(true)
        Promise.all([hydrateVehiclesFromApi(), hydrateDriversFromApi()])
            .finally(() => {
                if (!cancelled) {
                    setVehicles(getExpenseVehicleOptions())
                    setDrivers(getDriverOptions({ activeOnly: true }))
                    setLoadingOptions(false)
                }
            })
        return () => { cancelled = true }
    }, [])

    const computedAmount = useMemo(() => {
        const qty = Number(quantity)
        const unit = Number(rate)
        if (!Number.isFinite(qty) || !Number.isFinite(unit) || qty <= 0 || unit <= 0) return ''
        return `₹${(qty * unit).toLocaleString('en-IN')}`
    }, [quantity, rate])

    useEffect(() => {
        if (computedAmount) setAmount(computedAmount)
    }, [computedAmount])

    const handleVehicleChange = (e) => {
        const selected = vehicles.find((vehicle) => vehicle.label === e.target.value)
        setVehicleNumber(e.target.value)
        if (selected?.driverName) setDriverName(selected.driverName)
    }

    useImperativeHandle(ref, () => ({
        getValues: () => {
            const qty = quantity === '' ? '' : Number(quantity)
            const finalAmount = String(amount || computedAmount || '').trim()
            return {
                vehicleNumber,
                driverName: String(driverName).trim(),
                fuelDate: formatTransportDate(fuelDate),
                fuelStation,
                fuelQuantity: qty === '' ? '' : `${qty} L`,
                amount: finalAmount,
                paymentMode,
                entryType,
                quantity: qty,
                rate: rate === '' ? '' : Number(rate),
                odometer: String(odometer).trim(),
                remarks: String(remarks).trim(),
            }
        },
        validate: () => {
            if (!String(vehicleNumber).trim()) return 'Vehicle is required.'
            if (!formatTransportDate(fuelDate)) return 'Fuel date is required.'
            if (!String(amount || computedAmount).trim()) return 'Amount is required (enter quantity & rate, or amount).'
            if (!paymentMode) return 'Payment mode is required.'
            return null
        },
    }))

    const loadingLabel = loadingOptions ? 'Loading…' : '--Select--'
    const driverLabels = drivers.map((d) => d.label)
    const showCustomDriver = driverName && !driverLabels.includes(driverName)

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <select id='vehicle-number' value={vehicleNumber} onChange={handleVehicleChange} className={selectClass}>
                    <option value=''>{loadingLabel}</option>
                    {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.label}>{vehicle.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-name' className='text-base font-medium text-[#1E1E1E]'>Driver Name:</label>
                <select
                    id='driver-name'
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className={selectClass}
                >
                    <option value=''>{loadingLabel}</option>
                    {showCustomDriver && <option value={driverName}>{driverName}</option>}
                    {drivers.map((driver) => (
                        <option key={driver.id} value={driver.label}>{driver.label}</option>
                    ))}
                </select>
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
                <select id='fuel-station' value={fuelStation} onChange={(e) => setFuelStation(e.target.value)} className={selectClass}>
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
                <label className='text-base font-medium text-[#1E1E1E]'>Quantity (L):</label>
                <input value={quantity} onChange={(event) => setQuantity(event.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Rate (₹/L):</label>
                <input value={rate} onChange={(event) => setRate(event.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Odometer:</label>
                <input value={odometer} onChange={(event) => setOdometer(event.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2 lg:col-span-3'>
                <label className='text-base font-medium text-[#1E1E1E]'>Remarks:</label>
                <input value={remarks} onChange={(event) => setRemarks(event.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='amount' className='text-base font-medium text-[#1E1E1E]'>Amount:</label>
                <input
                    type='text'
                    id='amount'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder='Auto from qty × rate'
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='payment-mode' className='text-base font-medium text-[#1E1E1E]'>Payment Mode:</label>
                <select id='payment-mode' value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                    ))}
                </select>
            </div>
        </div>
    )
})

FuelExpenseForm.displayName = 'FuelExpenseForm'

export default FuelExpenseForm
