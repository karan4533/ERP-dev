import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    VEHICLE_OPTIONS,
    OTHER_EXPENSE_TYPES,
    PAYMENT_MODES,
} from '../transportExpensesData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const OtherExpenseForm = ({ expense }) => {
    const [expenseDate, setExpenseDate] = useState(() => parseDate(expense?.expenseDate))
    const [vehicleNumber, setVehicleNumber] = useState(expense?.vehicleNumber ?? '')

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <select id='vehicle-number' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {VEHICLE_OPTIONS.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.label}>{vehicle.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='expense-type' className='text-base font-medium text-[#1E1E1E]'>Expense Type:</label>
                <select id='expense-type' defaultValue={expense?.expenseType ?? ''} className={selectClass}>
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
                <input type='text' id='amount' defaultValue={expense?.amount ?? ''} placeholder='e.g. ₹850' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='paid-to' className='text-base font-medium text-[#1E1E1E]'>Paid To:</label>
                <input type='text' id='paid-to' defaultValue={expense?.paidTo ?? ''} placeholder='e.g. NHAI Toll Plaza' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                <textarea id='description' defaultValue={expense?.description ?? ''} placeholder='Brief description of the expense...' className={textareaClass} />
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

export default OtherExpenseForm
