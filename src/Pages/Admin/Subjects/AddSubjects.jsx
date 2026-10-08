import React from 'react'
import ProfileUpload from './Components/ProfileUpload'

const AddSubjects = () => {
    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Subject Information</h2>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">12th</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">A</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Assigned Teacher:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Sandy Selva</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Subject Name:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">English</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Subject Code:</label>
                        <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Education Board:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">CBSE</option>
                            <option value="">Matriculation</option>
                            <option value="">State Board</option>
                        </select>
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Subject Type:</label>
                        <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value="">Theory</option>
                            <option value="">Practical</option>
                        </select>
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Book Image:</label>
                        <ProfileUpload />
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

export default AddSubjects