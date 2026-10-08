import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Upload } from 'lucide-react'
import { CATEGORIES, UNITS } from '../inventoryData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const InventoryInfo = () => {
    const [purchaseDate, setPurchaseDate] = useState(null)

    return (
        <div className='space-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Item Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 flex flex-col gap-y-2'>
                        <label htmlFor="item-name" className='text-base font-medium text-[#1E1E1E]'>Item Name *</label>
                        <input type="text" id="item-name" placeholder="Enter item name" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="category" className='text-base font-medium text-[#1E1E1E]'>Category *</label>
                        <select id="category" className={selectClass} defaultValue="">
                            <option value="" disabled>Select category</option>
                            {CATEGORIES.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="item-code" className='text-base font-medium text-[#1E1E1E]'>Item Code *</label>
                        <input type="text" id="item-code" placeholder="e.g. PEN-BLU-001" className={inputClass} />
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="description" className='text-base font-medium text-[#1E1E1E]'>Description</label>
                        <textarea id="description" rows={3} placeholder="Brief description of the item" className={`${inputClass} resize-none`} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Stock Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="quantity" className='text-base font-medium text-[#1E1E1E]'>Quantity *</label>
                        <input type="number" id="quantity" placeholder="Enter quantity" className={inputClass} min={0} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="unit" className='text-base font-medium text-[#1E1E1E]'>Unit *</label>
                        <select id="unit" className={selectClass} defaultValue="">
                            <option value="" disabled>Select unit</option>
                            {UNITS.map((unit) => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="reorder-level" className='text-base font-medium text-[#1E1E1E]'>Reorder Level</label>
                        <input type="number" id="reorder-level" placeholder="Minimum stock level" className={inputClass} min={0} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="unit-cost" className='text-base font-medium text-[#1E1E1E]'>Unit Cost</label>
                        <input type="text" id="unit-cost" placeholder="e.g. ₹12" className={inputClass} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Supplier Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="supplier-name" className='text-base font-medium text-[#1E1E1E]'>Supplier Name</label>
                        <input type="text" id="supplier-name" placeholder="Enter supplier name" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="supplier-contact" className='text-base font-medium text-[#1E1E1E]'>Supplier Contact</label>
                        <input type="text" id="supplier-contact" placeholder="Phone or email" className={inputClass} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Purchase Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
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
                        <label htmlFor="invoice-number" className='text-base font-medium text-[#1E1E1E]'>Invoice Number</label>
                        <input type="text" id="invoice-number" placeholder="Enter invoice number" className={inputClass} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Attachments</h3>
                <div className='max-w-sm'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Invoice Upload</label>
                    <label className='flex flex-col items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors mt-2'>
                        <Upload size={20} className='text-[#808080]' />
                        <span className='text-xs text-[#667085]'>Click to upload invoice</span>
                        <input type="file" className='hidden' accept=".pdf,.doc,.docx,image/*" />
                    </label>
                </div>
            </div>
        </div>
    )
}

export default InventoryInfo
