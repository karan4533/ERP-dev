import React from 'react'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const MenuItemInfo = () => {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="menu-id" className='text-base font-medium text-[#1E1E1E]'>Menu ID:</label>
                <input type="text" id="menu-id" placeholder="Auto-generated" readOnly className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="item-name" className='text-base font-medium text-[#1E1E1E]'>Item Name:</label>
                <input type="text" id="item-name" placeholder="Enter item name" className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="category" className='text-base font-medium text-[#1E1E1E]'>Category:</label>
                <select id="category" className={selectClass} defaultValue="">
                    <option value="" disabled>Select category</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="item-code" className='text-base font-medium text-[#1E1E1E]'>Item Code:</label>
                <input type="text" id="item-code" placeholder="e.g. VC-BIR-001" className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="price" className='text-base font-medium text-[#1E1E1E]'>Price:</label>
                <input type="text" id="price" placeholder="e.g. ₹60" className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="availability" className='text-base font-medium text-[#1E1E1E]'>Availability:</label>
                <select id="availability" className={selectClass} defaultValue="Available">
                    <option value="Available">Available</option>
                    <option value="Out of Stock">Out of Stock</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="is-combo" className='text-base font-medium text-[#1E1E1E]'>Is Combo:</label>
                <select id="is-combo" className={selectClass} defaultValue="No">
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="status" className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                <select id="status" className={selectClass} defaultValue="Active">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <div className='lg:col-span-3'>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor="description" className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                    <textarea
                        id="description"
                        rows={3}
                        placeholder="Brief description of the menu item"
                        className={`${inputClass} resize-none`}
                    />
                </div>
            </div>
        </div>
    )
}

export default MenuItemInfo
