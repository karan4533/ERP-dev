import React from 'react'
import hostel_img from "../../../assets/images/hostel-mock-img.png"
import { Building, CircleCheck, ShieldAlert } from 'lucide-react';

const HostelDetails = () => {
    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-x-6'>
                    <img src={hostel_img} alt="hostel-img" className='w-56 h-auto object-cover' />
                    <div className='flex flex-col gap-y-2'>
                        <h2 className='text-2xl font-semibold text-black'>QMIS Hostel</h2>
                        <div className='flex items-center gap-x-2'>
                            <span className='flex items-center gap-x-2 bg-[#EBF4FE] px-4 py-1.5 rounded-md'>
                                <Building className='w-6 h-6 text-[#0751E0]' />
                                <span className='text-lg font-medium text-[#0751E0]'>Block A</span>
                            </span>
                            <span className='flex items-center gap-x-2 bg-[#E7F7EE] px-4 py-1.5 rounded-md'>
                                <CircleCheck className='w-6 h-6 text-[#008000]' />
                                <span className='text-lg font-medium text-[#008000]'>Active</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-4'>
                <h2 className='text-xl font-semibold text-black'>Hostel Details</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4'>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Hostel Name</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>QMIS Hostel</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Building</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>Block - A</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Room Number</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>A - 203</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Floor Number</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>2nd Floor</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Bed Number</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>B2</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Warden Name</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>Mr. Kumar</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Warden Contact</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>+91 9944076993</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Check-in-Date</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>19/12/2026</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-base font-medium text-[#808080]'>Hostel Status</span>
                        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>Active</span>
                    </div>
                </div>

                <div className='flex justify-between items-center mt-4 bg-[#EDF4FE] p-3 rounded-md'>
                    <div className='flex gap-x-4 items-center'>
                        <ShieldAlert className='w-6 h-6 text-[#0A5DFE]' />
                        <span><strong className='text-[#00007A]'>Note:</strong>Please follow all hostel rules and maintain discipline.</span>
                    </div>
                    <button className='text-[#0A5DFE] text-sm font-medium bg-white px-4 py-2 rounded-md border border-[#0A5DFE] hover:bg-[#0A5DFE] hover:text-white hover:border-[#0A5DFE] transition-all duration-200 cursor-pointer'>View Hostel Rules</button>
                </div>

            </div>

        </section >
    )
}

export default HostelDetails