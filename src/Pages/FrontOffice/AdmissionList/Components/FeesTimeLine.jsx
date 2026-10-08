import React from 'react'

const FeesTimeLine = () => {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 lg:mt-6 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Select Fees:</label>
                <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                    <option value="">Select Fees Group</option>
                </select>
            </div>
        </div>
    )
}

export default FeesTimeLine