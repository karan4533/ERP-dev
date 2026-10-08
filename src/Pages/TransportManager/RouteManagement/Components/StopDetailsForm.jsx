import React from 'react'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const StopDetailsForm = ({ stop, index = 0 }) => (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 ${index > 0 ? 'mt-8 pt-8 border-t border-[#EEF0F6]' : 'lg:mt-8 mt-2'}`}>
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>Start Location:</label>
            <input type='text' defaultValue={stop?.startLocation ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>End Location:</label>
            <input type='text' defaultValue={stop?.endLocation ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>Pick Up Time:</label>
            <input type='text' defaultValue={stop?.pickUpTime ?? ''} placeholder='e.g. 06:45 AM' className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>Drop Time:</label>
            <input type='text' defaultValue={stop?.dropTime ?? ''} placeholder='e.g. 07:00 AM' className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>Yearly Fees:</label>
            <input type='text' defaultValue={stop?.yearlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>Half Yearly Fees:</label>
            <input type='text' defaultValue={stop?.halfYearlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>Quarterly Fees:</label>
            <input type='text' defaultValue={stop?.quarterlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>Monthly Fees:</label>
            <input type='text' defaultValue={stop?.monthlyFees ?? ''} className={inputClass} />
        </div>
    </div>
)

export default StopDetailsForm
