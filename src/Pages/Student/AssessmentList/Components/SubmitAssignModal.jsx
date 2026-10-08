import React from 'react'
import { X, MessageCircleCheck, Eye, Download } from 'lucide-react'
import ProofUpload from './ProofUpload'

const SubmitAssignModal = ({ submitAssignModal, setSubmitAssignModal }) => {
    return (
        <div>
            {submitAssignModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center'>
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setSubmitAssignModal(false)}
                    />

                    <div className="relative z-10 w-full max-w-3xl rounded-xl bg-white shadow-lg p-5 py-4">
                        <div className='flex justify-end items-center'>
                            <button onClick={() => setSubmitAssignModal(false)} className='hover:text-red-500 cursor-pointer'>
                                <X />
                            </button>
                        </div>
                        <div className=''>
                            <h3 className='text-2xl font-medium text-[#343338]'>Submit Assignment</h3>
                            <p className='text-base text-[#515DEF] font-medium mt-4 flex items-center gap-x-2'>
                                <MessageCircleCheck size={24} className='text-[#515DEF]' />
                                Upload your completed assignment file and click on submit button.
                            </p>

                            <div className='mt-6 flex flex-col gap-y-2'>
                                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Upload Your Answer ( Documents / Image ):</label>
                                <ProofUpload />
                            </div>

                            <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm p-4 border border-[#c9c7ce] rounded-lg'>
                                <div className='flex flex-col gap-y-2'>
                                    <span className='text-[#77767A]'>File Name</span>
                                    <span>Maths-Assignment</span>
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <span className='text-[#77767A]'>Size</span>
                                    <span>851 Kb</span>
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <span className='text-[#77767A]'>Date</span>
                                    <span>Updated: 15-sep-2025</span>
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <span className='text-[#77767A]'>Actions</span>
                                    <span className='flex items-center gap-x-6'>
                                        <button className='cursor-pointer'>
                                            <Eye size={16} />
                                        </button>
                                        <button className='cursor-pointer'>
                                            <Download size={16} />
                                        </button>
                                        <button className='cursor-pointer'>
                                            <X size={16} />
                                        </button>
                                    </span>
                                </div>
                            </div>

                            <div className='mt-6 flex flex-col gap-y-2'>
                                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Additional Note (Optional):</label>
                                <textarea rows={4} className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' placeholder='Write any additional notes for your teacher' />
                            </div>

                            <div className='flex gap-x-4 mt-6'>
                                <button onClick={() => setSubmitAssignModal(false)} className='bg-white text-[#77767A] text-sm text-center px-4 py-2.5 rounded-md border border-[#77767A] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer w-full'>
                                    Cancel
                                </button>
                                <button className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full'>
                                    Submit
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SubmitAssignModal