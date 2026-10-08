import React from 'react'
import ProfileUpload from './ProfileUpload';

const AddGatePass = () => {

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Gate Pass Information</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Gate Pass ID:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Pass Type:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Visitor</option>
                            <option value="">Parent</option>
                            <option value="">Vendor</option>
                            <option value="">Other</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Name:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Mobile Number:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Purpose of Visit:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>In Time:</label>
                        <input type="time" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex gap-2 col-span-1 md:col-span-3 lg:col-span-3'>
                        <div className='flex flex-col gap-y-2 w-full'>
                            <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Out Time:</label>
                            <input type="time" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                        </div>

                        <div className='flex flex-col gap-y-2 w-full'>
                            <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Approved By:</label>
                            <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                                <option value="">Principal</option>
                                <option value="">Admin</option>
                                <option value="">Warden</option>
                                <option value="">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className='cols-span-1 md:col-span-3 lg:col-span-3'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Upload Image:</label>
                            <ProfileUpload />
                        </div>
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

export default AddGatePass
