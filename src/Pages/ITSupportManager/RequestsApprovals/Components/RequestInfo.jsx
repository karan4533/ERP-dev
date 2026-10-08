import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import { downloadQuotationTemplate } from '../../../../Common/demoDomain/procurement'
import {
    AUTO_FILLED,
    BUDGET_CATEGORIES,
    REQUEST_TYPE_OPTIONS,
} from '../requestsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9F9F9]'

const RequestInfo = () => {
    const [quotation, setQuotation] = useState(null)
    return (
    <div className='space-y-8 lg:mt-8 mt-2'>
        <div>
            <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Request Details</h3>
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
            </div>
        </div>

        <div>
            <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Financial Details</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor="estimated-cost" className='text-base font-medium text-[#1E1E1E]'>Estimated Cost</label>
                    <input type="text" id="estimated-cost" placeholder="e.g. ₹3,42,000" className={inputClass} />
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
            <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Attachments</h3>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
                <div className='flex flex-col gap-y-2'>
                    <span className='text-base font-medium text-[#1E1E1E]'>Comparative Quotation Upload</span>
                    <button type='button' onClick={downloadQuotationTemplate} className='text-sm text-[#515DEF] underline text-left cursor-pointer'>Download demo comparative quotation template (CSV, not an official QMIS form)</button>
                    <label className='flex flex-col items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'>
                        <Upload size={20} className='text-[#808080]' />
                        <span className='text-xs text-[#667085]'>{quotation ? `${quotation.name} · ${Math.ceil(quotation.size / 1024)} KB` : 'Click to upload or replace'}</span>
                        <input type="file" className='hidden' accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*" onChange={(event) => setQuotation(event.target.files?.[0] || null)} />
                    </label>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <span className='text-base font-medium text-[#1E1E1E]'>Supporting Documents</span>
                    <label className='flex flex-col items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'>
                        <Upload size={20} className='text-[#808080]' />
                        <span className='text-xs text-[#667085]'>Click to upload</span>
                        <input type="file" className='hidden' accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" />
                    </label>
                </div>
            </div>
        </div>

        <div>
            <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Workflow</h3>
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
