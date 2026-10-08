import React, { useState } from 'react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react'

const ProfessionalInfo = () => {

    const [joinDate, setJoinDate] = useState(new Date());

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Qualification:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                    <option value="">Select Subject</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Years of Experience:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Previous School:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Date of Birth:</label>
                <div className='relative'>
                    <DatePicker
                        selected={joinDate}
                        onChange={(date) => setJoinDate(date)}
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
        </div>
    )
}

export default ProfessionalInfo