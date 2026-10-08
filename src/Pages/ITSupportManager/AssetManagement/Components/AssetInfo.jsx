import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Upload } from 'lucide-react'
import {
    ASSET_CATEGORIES,
    BRAND_OPTIONS,
    ADD_ASSET_STATUSES,
} from '../assetData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const AssetInfo = () => {
    const [purchaseDate, setPurchaseDate] = useState(null)
    const [warrantyStartDate, setWarrantyStartDate] = useState(null)
    const [warrantyEndDate, setWarrantyEndDate] = useState(null)

    return (
        <div className='space-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Asset Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 flex flex-col gap-y-2'>
                        <label htmlFor="asset-name" className='text-base font-medium text-[#1E1E1E]'>Asset Name *</label>
                        <input type="text" id="asset-name" name="assetName" placeholder="Enter asset name" className={inputClass} required />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="asset-category" className='text-base font-medium text-[#1E1E1E]'>Asset Category *</label>
                        <select id="asset-category" name="category" className={selectClass} defaultValue="" required>
                            <option value="" disabled>Select category</option>
                            {ASSET_CATEGORIES.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="brand" className='text-base font-medium text-[#1E1E1E]'>Brand *</label>
                        <select id="brand" name="brand" className={selectClass} defaultValue="">
                            <option value="" disabled>Select brand</option>
                            {BRAND_OPTIONS.map((brand) => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="model" className='text-base font-medium text-[#1E1E1E]'>Model *</label>
                        <input type="text" id="model" name="model" placeholder="Enter model number" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="serial-number" className='text-base font-medium text-[#1E1E1E]'>Serial Number *</label>
                        <input type="text" id="serial-number" name="serialNumber" placeholder="Enter serial number" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="asset-tag" className='text-base font-medium text-[#1E1E1E]'>Asset Tag Number *</label>
                        <input type="text" id="asset-tag" name="assetTag" placeholder="e.g. TAG-IT-0142" className={inputClass} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Purchase Details</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="vendor-name" className='text-base font-medium text-[#1E1E1E]'>Vendor Name</label>
                        <input type="text" id="vendor-name" name="vendorName" placeholder="Enter vendor name" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Purchase Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={purchaseDate}
                                onChange={setPurchaseDate}
                                isClearable
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Select purchase date"
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="purchase-cost" className='text-base font-medium text-[#1E1E1E]'>Purchase Cost</label>
                        <input type="text" id="purchase-cost" name="purchaseCost" placeholder="e.g. ₹68,500" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="invoice-number" className='text-base font-medium text-[#1E1E1E]'>Invoice Number</label>
                        <input type="text" id="invoice-number" name="invoiceNumber" placeholder="Enter invoice number" className={inputClass} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Warranty</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Warranty Start Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={warrantyStartDate}
                                onChange={setWarrantyStartDate}
                                isClearable
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Select start date"
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Warranty End Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={warrantyEndDate}
                                onChange={setWarrantyEndDate}
                                isClearable
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Select end date"
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Status</h3>
                <div className='flex flex-wrap gap-3'>
                    {ADD_ASSET_STATUSES.map((status) => (
                        <label key={status} className='flex items-center gap-x-2 text-sm text-[#1E1E1E] cursor-pointer border border-[#D9D9D9] rounded-md px-4 py-2.5 hover:border-[#515DEF]'>
                            <input type="radio" name="status" value={status} defaultChecked={status === 'Active'} className='accent-[#515DEF]' />
                            {status}
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Attachments</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    {['Invoice Upload', 'Warranty Document Upload'].map((label) => (
                        <div key={label} className='flex flex-col gap-y-2'>
                            <span className='text-base font-medium text-[#1E1E1E]'>{label}</span>
                            <label className='flex flex-col items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'>
                                <Upload size={20} className='text-[#808080]' />
                                <span className='text-xs text-[#667085]'>Click to upload file</span>
                                <input type="file" className='hidden' accept=".pdf,.doc,.docx,image/*" />
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AssetInfo
