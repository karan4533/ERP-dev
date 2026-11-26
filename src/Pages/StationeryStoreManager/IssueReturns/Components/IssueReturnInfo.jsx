import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    ACTIVITY_TYPES,
    DEPARTMENTS,
    ITEM_OPTIONS,
    PURPOSE_OPTIONS,
    CONDITION_OPTIONS,
    getAvailableStock,
} from '../issueReturnsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9F9F9]'

const IssueReturnInfo = () => {
    const [activityType, setActivityType] = useState('Issue')
    const [selectedItem, setSelectedItem] = useState('')
    const [issueDate, setIssueDate] = useState(null)
    const [returnDate, setReturnDate] = useState(null)

    const availableStock = selectedItem ? getAvailableStock(selectedItem) : '—'

    return (
        <div className='space-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Activity Type</h3>
                <select
                    className={`${selectClass} max-w-xs`}
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                >
                    {ACTIVITY_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Common Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="employee-name" className='text-base font-medium text-[#1E1E1E]'>Employee Name *</label>
                        <input type="text" id="employee-name" placeholder="Enter employee name" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="employee-id" className='text-base font-medium text-[#1E1E1E]'>Employee ID *</label>
                        <input type="text" id="employee-id" placeholder="e.g. EMP-1042" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="department" className='text-base font-medium text-[#1E1E1E]'>Department *</label>
                        <select id="department" className={selectClass} defaultValue="">
                            <option value="" disabled>Select department</option>
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="item-name" className='text-base font-medium text-[#1E1E1E]'>Item Name *</label>
                        <select
                            id="item-name"
                            className={selectClass}
                            value={selectedItem}
                            onChange={(e) => setSelectedItem(e.target.value)}
                        >
                            <option value="" disabled>Select item</option>
                            {ITEM_OPTIONS.map((item) => (
                                <option key={item.name} value={item.name}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="quantity" className='text-base font-medium text-[#1E1E1E]'>
                            {activityType === 'Return' ? 'Quantity Returned *' : 'Quantity *'}
                        </label>
                        <input type="number" id="quantity" placeholder="Enter quantity" className={inputClass} min={1} />
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="remarks" className='text-base font-medium text-[#1E1E1E]'>Remarks</label>
                        <textarea id="remarks" rows={2} placeholder="Optional remarks" className={`${inputClass} resize-none`} />
                    </div>
                </div>
            </div>

            {activityType === 'Issue' && (
                <div>
                    <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Issue Details</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Available Stock</label>
                            <input type="text" readOnly value={availableStock} className={readOnlyClass} />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Issue Date *</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={issueDate}
                                    onChange={setIssueDate}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Select issue date"
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor="purpose" className='text-base font-medium text-[#1E1E1E]'>Purpose</label>
                            <select id="purpose" className={selectClass} defaultValue="">
                                <option value="">Select purpose</option>
                                {PURPOSE_OPTIONS.map((purpose) => (
                                    <option key={purpose} value={purpose}>{purpose}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {activityType === 'Return' && (
                <div>
                    <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Return Details</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor="original-issue-ref" className='text-base font-medium text-[#1E1E1E]'>Original Issue Reference *</label>
                            <input type="text" id="original-issue-ref" placeholder="e.g. IR-2026-0035" className={inputClass} />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Return Date *</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={returnDate}
                                    onChange={setReturnDate}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Select return date"
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                        <div className='lg:col-span-3'>
                            <span className='text-base font-medium text-[#1E1E1E]'>Item Condition *</span>
                            <div className='flex flex-wrap gap-4 mt-3'>
                                {CONDITION_OPTIONS.map((condition) => (
                                    <label key={condition} className='flex items-center gap-x-2 text-sm text-[#1E1E1E] cursor-pointer border border-[#D9D9D9] rounded-md px-4 py-2.5 hover:border-[#515DEF]'>
                                        <input type="radio" name="condition" value={condition} defaultChecked={condition === 'Good'} className='accent-[#515DEF]' />
                                        {condition}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default IssueReturnInfo
