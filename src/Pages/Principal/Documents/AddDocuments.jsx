import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import ProofUpload from './Components/ProofUpload'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AddDocuments = () => {
    const [scheduledDate, setScheduledDate] = useState(new Date())

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Documents Information</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="enquiry-name" className='text-base font-medium text-[#1E1E1E]'>Document ID:</label>
                        <input type="text" id="enquiry-name" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="enquiry-mobile" className='text-base font-medium text-[#1E1E1E]'>Document Name:</label>
                        <input type="tel" id="enquiry-mobile" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="enquiry-reason" className='text-base font-medium text-[#1E1E1E]'>Document Format:</label>
                        <input type="text" id="enquiry-reason" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="enquiry-reason" className='text-base font-medium text-[#1E1E1E]'>Document Category:</label>
                        <input type="text" id="enquiry-reason" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="enquiry-reason" className='text-base font-medium text-[#1E1E1E]'>Document Description:</label>
                        <input type="text" id="enquiry-reason" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="enquiry-reason" className='text-base font-medium text-[#1E1E1E]'>Uploaded By:</label>
                        <input type="text" id="enquiry-reason" className={inputClass} />
                    </div>
                    <div className='col-span-3 flex gap-2'>
                        <div className='flex flex-col gap-y-2 w-full'>
                            <label htmlFor="enquiry-scheduled-date" className='text-base font-medium text-[#1E1E1E]'>Upload Date:</label>
                            <div className='relative'>
                                <DatePicker
                                    id="enquiry-scheduled-date"
                                    selected={scheduledDate}
                                    onChange={(date) => setScheduledDate(date)}
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
                        <div className='flex flex-col gap-y-2 w-full'>
                            <label htmlFor="enquiry-reason" className='text-base font-medium text-[#1E1E1E]'>Visible To:</label>
                            <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                                <option value="">Select Visible To</option>
                                <option value="admin">Admin</option>
                                <option value="teacher">Teacher</option>
                                <option value="student">Student</option>
                                <option value="parent">Parent</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className='col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="enquiry-reason" className='text-base font-medium text-[#1E1E1E]'>Upload Document:</label>
                        <ProofUpload />
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

export default AddDocuments