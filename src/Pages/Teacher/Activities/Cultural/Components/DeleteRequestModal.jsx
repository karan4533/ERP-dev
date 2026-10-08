import React from 'react'
import { X, CircleAlert } from 'lucide-react'

const DeleteRequestModal = ({ deleteRequestModal, setDeleteRequestModal }) => {
    return (
        <div>
            {/* Edit Request Modal */}
            {deleteRequestModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center'>
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDeleteRequestModal(false)}
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5 py-4">
                        <div className='flex justify-end items-center'>
                            <button onClick={() => setDeleteRequestModal(false)} className='hover:text-red-500 cursor-pointer'>
                                <X />
                            </button>
                        </div>
                        <div className='pt-4 text-center'>

                            <div className='flex justify-center items-center mb-4'>
                                <CircleAlert size={70} strokeWidth={1.5} className='text-[#515DEF]' />
                            </div>
                            <h3 className='text-xl font-medium text-[#77767A]'>Send Delete Request?</h3>
                            <p className='text-base text-[#77767A] font-medium mt-2'>Do you want to send this delete request to the Super Admin for approval?</p>

                            <div className='flex gap-x-4 mt-10'>
                                <button onClick={() => setDeleteRequestModal(false)} className='bg-white text-[#77767A] text-sm text-center px-4 py-2.5 rounded-md border border-[#77767A] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer w-full'>
                                    Cancel
                                </button>
                                <button className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full'>
                                    Send Request
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default DeleteRequestModal