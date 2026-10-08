import React from 'react'

const AccountInfo = () => {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>User Name:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Password:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Role:</label>
                <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                    <option value="">Teacher</option>
                </select>
            </div>
        </div>
    )
}

export default AccountInfo