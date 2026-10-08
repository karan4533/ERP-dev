import React, { useState } from 'react'
import ProfileUpload from './Components/ProfileUpload'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'

const AddIssueBook = () => {

    const [issuedDate, setIssuedDate] = useState(new Date());
    const [returnedDate, setReturnedDate] = useState(new Date());

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Issued Book Information</h2>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Book ID:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Admission Number:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Book Name:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Mathematics</option>
                            <option value="">Physics</option>
                            <option value="">Chemistry</option>
                            <option value="">Biology</option>
                            <option value="">Computer Science</option>
                            <option value="">English</option>
                            <option value="">Tamil</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Issued To:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Student</option>
                            <option value="">Teacher</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Name:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Issued Date:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={issuedDate}
                                onChange={(date) => setIssuedDate(date)}
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
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Return Date:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={returnedDate}
                                onChange={(date) => setReturnedDate(date)}
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
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Late Fees:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Return Comment:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Issued</option>
                            <option value="">Returned</option>
                        </select>
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Book Image:</label>
                        <ProfileUpload />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddIssueBook