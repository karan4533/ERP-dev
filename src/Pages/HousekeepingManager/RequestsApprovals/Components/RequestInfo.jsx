import React, { useState } from 'react'
import { Upload, Plus, Trash2 } from 'lucide-react'
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

const emptyLineItem = () => ({ item: '', quantity: '', estimatedCost: '' })

const RequestInfo = () => {
    const [lineItems, setLineItems] = useState([emptyLineItem(), emptyLineItem()])

    const updateLineItem = (index, field, value) => {
        setLineItems((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
    }

    const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()])

    const removeLineItem = (index) => {
        if (lineItems.length <= 1) return
        setLineItems((prev) => prev.filter((_, i) => i !== index))
    }

    return (
        <div className='space-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Request Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="request-type" className='text-base font-medium text-[#1E1E1E]'>Request Type *</label>
                        <select id="request-type" className={selectClass} defaultValue="">
                            <option value="" disabled>Select request type</option>
                            {REQUEST_TYPE_OPTIONS.map((type) => (
                                <option key={type} value={type}>{type}</option>
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
                </div>

                <div className='mt-6'>
                    <div className='flex justify-between items-center mb-3'>
                        <span className='text-sm font-medium text-[#1E1E1E]'>Line Items</span>
                        <button type='button' onClick={addLineItem} className='inline-flex items-center gap-1 text-sm text-[#515DEF] hover:opacity-80 cursor-pointer'>
                            <Plus size={16} />
                            Add Row
                        </button>
                    </div>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr>
                                    <th className="px-2 py-3 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Item</th>
                                    <th className="px-2 py-3 text-[#0C1E5B] font-medium uppercase w-32">Quantity</th>
                                    <th className="px-2 py-3 text-[#0C1E5B] font-medium uppercase w-40">Estimated Cost</th>
                                    <th className="px-2 py-3 w-12 rounded-e-lg" />
                                </tr>
                            </thead>
                            <tbody>
                                {lineItems.map((row, index) => (
                                    <tr key={index} className="border-b border-[#f2f4f7]">
                                        <td className="px-2 py-2">
                                            <input type="text" placeholder="Item name" value={row.item} onChange={(e) => updateLineItem(index, 'item', e.target.value)} className={inputClass} />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" placeholder="Qty" value={row.quantity} onChange={(e) => updateLineItem(index, 'quantity', e.target.value)} className={inputClass} min={1} />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="text" placeholder="e.g. ₹1,200" value={row.estimatedCost} onChange={(e) => updateLineItem(index, 'estimatedCost', e.target.value)} className={inputClass} />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button type='button' onClick={() => removeLineItem(index)} className='text-[#667085] hover:text-red-500 cursor-pointer' aria-label="Remove row">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Vendor Details</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="vendor-name" className='text-base font-medium text-[#1E1E1E]'>Vendor Name</label>
                        <input type="text" id="vendor-name" placeholder="Enter vendor name" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="vendor-contact" className='text-base font-medium text-[#1E1E1E]'>Vendor Contact</label>
                        <input type="text" id="vendor-contact" placeholder="Phone or email" className={inputClass} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Financial Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="estimated-amount" className='text-base font-medium text-[#1E1E1E]'>Estimated Amount</label>
                        <input type="text" id="estimated-amount" placeholder="e.g. ₹15,400" className={inputClass} />
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
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Attachments</h3>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
                    {['Comparative Quotation Upload', 'Supporting Documents'].map((label) => (
                        <div key={label} className='flex flex-col gap-y-2'>
                            <span className='text-base font-medium text-[#1E1E1E]'>{label}</span>
                            <label className='flex flex-col items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'>
                                <Upload size={20} className='text-[#808080]' />
                                <span className='text-xs text-[#667085]'>Click to upload</span>
                                <input type="file" className='hidden' accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" />
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Workflow</h3>
                <p className='text-xs text-[#667085] mb-4'>Housekeeping Manager → JD Operations → Finance Team → Approved / Rejected</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
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
