import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    AUTO_FILLED,
    BUDGET_CATEGORIES,
    PRIORITY_OPTIONS,
    REQUEST_TYPE_OPTIONS,
} from '../requestsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9F9F9]'

const RequestInfo = () => {
    const [requiredByDate, setRequiredByDate] = useState(null)

    return (
        <div className='space-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Basic Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="request-type" className='text-base font-medium text-[#1E1E1E]'>Request Type *</label>
                        <select id="request-type" className={selectClass} defaultValue="">
                            <option value="" disabled>Select request type</option>
                            {REQUEST_TYPE_OPTIONS.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-2'>
                        <label htmlFor="request-title" className='text-base font-medium text-[#1E1E1E]'>Request Title *</label>
                        <input type="text" id="request-title" placeholder="Enter request title" className={inputClass} />
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="description" className='text-base font-medium text-[#1E1E1E]'>Description *</label>
                        <textarea id="description" rows={3} placeholder="Describe the request in detail" className={`${inputClass} resize-none`} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="priority" className='text-base font-medium text-[#1E1E1E]'>Priority *</label>
                        <select id="priority" className={selectClass} defaultValue="">
                            <option value="" disabled>Select priority</option>
                            {PRIORITY_OPTIONS.map((priority) => (
                                <option key={priority} value={priority}>{priority}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Required By Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={requiredByDate}
                                onChange={setRequiredByDate}
                                isClearable
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Select date"
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Amount Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="estimated-amount" className='text-base font-medium text-[#1E1E1E]'>Estimated Amount</label>
                        <input type="text" id="estimated-amount" placeholder="e.g. ₹45,000" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="budget-category" className='text-base font-medium text-[#1E1E1E]'>Budget Category</label>
                        <select id="budget-category" className={selectClass} defaultValue="">
                            <option value="">Select category</option>
                            {BUDGET_CATEGORIES.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Routing Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Requested By</label>
                        <input type="text" readOnly value={AUTO_FILLED.requestedBy} className={readOnlyClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Department</label>
                        <input type="text" readOnly value={AUTO_FILLED.department} className={readOnlyClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Sent To</label>
                        <input type="text" readOnly value={AUTO_FILLED.sentTo} className={readOnlyClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Status</label>
                        <input type="text" readOnly value={AUTO_FILLED.status} className={readOnlyClass} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RequestInfo
