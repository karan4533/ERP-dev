import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { CLASS_LEVEL_OPTIONS } from '../../../Class/ClassDetails/classDetailsOptions'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AdmissionInfo = ({ form, onChange }) => {
    const update = (key, value) => onChange?.(key, value)

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='admissionDate' className='text-base font-medium text-[#1E1E1E]'>Admission Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={form.admissionDate}
                        onChange={(date) => update('admissionDate', date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='admissionClass' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                <select
                    id='admissionClass'
                    value={form.className}
                    onChange={(e) => update('className', e.target.value)}
                    className={inputClass}
                >
                    <option value=''>Select Class</option>
                    {CLASS_LEVEL_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='registrationFees' className='text-base font-medium text-[#1E1E1E]'>Registration Fees:</label>
                <input
                    id='registrationFees'
                    type='text'
                    value={form.registrationFees}
                    onChange={(e) => update('registrationFees', e.target.value)}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='batchStartYear' className='text-base font-medium text-[#1E1E1E]'>Batch Start Year:</label>
                <div className='relative'>
                    <DatePicker
                        selected={form.batchStartYear}
                        onChange={(date) => update('batchStartYear', date)}
                        showYearPicker
                        dateFormat='yyyy'
                        isClearable
                        yearItemNumber={12}
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='batchEndYear' className='text-base font-medium text-[#1E1E1E]'>Batch End Year:</label>
                <div className='relative'>
                    <DatePicker
                        selected={form.batchEndYear}
                        onChange={(date) => update('batchEndYear', date)}
                        showYearPicker
                        dateFormat='yyyy'
                        isClearable
                        yearItemNumber={12}
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
        </div>
    )
}

export default AdmissionInfo
