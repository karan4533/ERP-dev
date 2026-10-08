import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react'

const AdmissionInfo = () => {

    const [startYear, setStartYear] = useState(new Date());
    const [endYear, setEndYear] = useState(new Date());
    const [admissionDate, setAdmissionDate] = useState(new Date());

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Admission Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={admissionDate}
                        onChange={(date) => setAdmissionDate(date)}
                        dateFormat="dd/MM/yyyy"
                        isClearable
                        className="w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none"
                    />

                    <Calendar
                        size={16}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                    />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                    <option value="">Select Class</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Registration Fees:</label>
                <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Batch Start Year:</label>
                <div className='relative'>
                    <DatePicker
                        selected={startYear}
                        onChange={(date) => setStartYear(date)}
                        showYearPicker
                        dateFormat="yyyy"
                        isClearable
                        yearItemNumber={12}
                        className="w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none"
                    />

                    <Calendar
                        size={16}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                    />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Batch End Year:</label>
                <div className='relative'>
                    <DatePicker
                        selected={endYear}
                        onChange={(date) => setEndYear(date)}
                        showYearPicker
                        dateFormat="yyyy"
                        isClearable
                        yearItemNumber={12}
                        className="w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none"
                    />

                    <Calendar
                        size={16}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                    />
                </div>
            </div>
        </div>
    )
}

export default AdmissionInfo