import React, { useState } from 'react'
import { X } from 'lucide-react'

const ExportModal = ({ exportModal, setExportModal }) => {

    return (
        <div>
            {/* Review Your Booking Modal */}
            {exportModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center'>
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setExportModal(false)}
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5 py-4">
                        <div className='flex justify-between items-center'>
                            <h2 className='text-xl font-semibold text-black'>Export List</h2>
                            <button onClick={() => setExportModal(false)} className='hover:text-red-500 cursor-pointer'>
                                <X />
                            </button>
                        </div>
                        <div className='pt-4'>
                            <p className='text-sm font-normal'>You are exporting 05 Leave Request details <span className='text-[#515DEF]'>( Filtered: Due in 7 Days )</span></p>

                            <div className='flex flex-col gap-x-2'>
                                <label htmlFor="" className='text-base font-medium text-[#1E1E1E] my-4'>Choose Format</label>
                                <div className='flex justify-between w-full items-center gap-x-2'>
                                    <div className='flex items-center gap-x-2'>
                                        <input type="radio" name="format" id="csv" className='w-4 h-4 cursor-pointer border-[#515DEF] text-[#515DEF]' />
                                        <label htmlFor="csv">CSV</label>
                                    </div>
                                    <div className='flex items-center gap-x-2'>
                                        <input type="radio" name="format" id="excel" className='w-4 h-4 cursor-pointer border-[#515DEF] text-[#515DEF]' />
                                        <label htmlFor="excel">Excel (XLSX)</label>
                                    </div>
                                    <div className='flex items-center gap-x-2'>
                                        <input type="radio" name="format" id="pdf" className='w-4 h-4 cursor-pointer border-[#515DEF] text-[#515DEF]' />
                                        <label htmlFor="pdf">PDF</label>
                                    </div>
                                </div>
                            </div>

                            <div className='flex gap-x-4 mt-10'>
                                <button onClick={() => setExportModal(false)} className='bg-white text-[#77767A] text-sm text-center px-4 py-2.5 rounded-md border border-[#77767A] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer w-full'>
                                    Cancel
                                </button>
                                <button className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full'>
                                    Export
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default ExportModal