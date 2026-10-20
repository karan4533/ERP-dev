import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    OTHER_EXPENSE_TYPES,
    PAYMENT_MODES,
    getExpenseVehicleOptions,
} from '../transportExpensesData'
import { hydrateVehiclesFromApi } from '../../VehicleManagement/vehicleManagementData'
import { formatTransportDate, parseTransportDate } from '../../transportCampus'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const OtherExpenseForm = forwardRef(({ expense }, ref) => {
    const [vehicles, setVehicles] = useState(() => getExpenseVehicleOptions())
    const [loadingVehicles, setLoadingVehicles] = useState(false)

    const [expenseDate, setExpenseDate] = useState(() => parseTransportDate(expense?.expenseDate))
    const [vehicleNumber, setVehicleNumber] = useState(expense?.vehicleNumber ?? '')
    const [expenseType, setExpenseType] = useState(expense?.expenseType ?? '')
    const [amount, setAmount] = useState(expense?.amount ?? '')
    const [paidTo, setPaidTo] = useState(expense?.paidTo ?? '')
    const [description, setDescription] = useState(expense?.description ?? '')
    const [paymentMode, setPaymentMode] = useState(expense?.paymentMode ?? '')

    useEffect(() => {
        let cancelled = false
        setLoadingVehicles(true)
        hydrateVehiclesFromApi()
            .finally(() => {
                if (!cancelled) {
                    setVehicles(getExpenseVehicleOptions())
                    setLoadingVehicles(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            vehicleNumber,
            expenseType,
            expenseDate: formatTransportDate(expenseDate),
            amount: String(amount).trim(),
            paidTo: String(paidTo).trim(),
            description: String(description).trim(),
            paymentMode,
        }),
        validate: () => {
            if (!String(vehicleNumber).trim()) return 'Vehicle is required.'
            if (!expenseType) return 'Expense type is required.'
            if (!String(amount).trim()) return 'Amount is required.'
            return null
        },
    }))

    const loadingLabel = loadingVehicles ? 'Loading vehicles…' : '--Select--'

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <select id='vehicle-number' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={selectClass}>
                    <option value=''>{loadingLabel}</option>
                    {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.label}>{vehicle.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='expense-type' className='text-base font-medium text-[#1E1E1E]'>Expense Type:</label>
                <select id='expense-type' value={expenseType} onChange={(e) => setExpenseType(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {OTHER_EXPENSE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Expense Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={expenseDate}
                        onChange={(date) => setExpenseDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='amount' className='text-base font-medium text-[#1E1E1E]'>Amount:</label>
                <input type='text' id='amount' value={amount} onChange={(e) => setAmount(e.target.value)} placeholder='e.g. ₹850' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='paid-to' className='text-base font-medium text-[#1E1E1E]'>Paid To:</label>
                <input type='text' id='paid-to' value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder='e.g. NHAI Toll Plaza' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                <textarea id='description' value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Brief description of the expense...' className={textareaClass} />
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

OtherExpenseForm.displayName = 'OtherExpenseForm'

export default OtherExpenseForm
