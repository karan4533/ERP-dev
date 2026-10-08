import React from 'react'

const AssignRoute = () => {
    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Assign Route Information</h2>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Student Name:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Route Name:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Select Driver:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Bus</option>
                            <option value="">Van</option>
                            <option value="">Mini Bus</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Driver Contact:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Select Class:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Bus</option>
                            <option value="">Van</option>
                            <option value="">Mini Bus</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Start Location:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>End Location:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Pick Up Time:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Drop Time:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Fees Structure:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Monthly</option>
                            <option value="">Yearly</option>
                            <option value="">One Time</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Support Staff:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                </div>
            </div>


            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AssignRoute