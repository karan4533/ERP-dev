import React from 'react'
import { X, CircleAlert } from 'lucide-react'

const RemoveAllocationModal = ({ open, teacherName, onCancel, onConfirm }) => {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center'>
            <div className='absolute inset-0 bg-black/40' onClick={onCancel} />
            <div className='relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5 py-4'>
                <div className='flex justify-end items-center'>
                    <button type='button' onClick={onCancel} className='hover:text-red-500 cursor-pointer'>
                        <X />
                    </button>
                </div>
                <div className='pt-4 text-center'>
                    <div className='flex justify-center items-center mb-4'>
                        <CircleAlert size={70} strokeWidth={1.5} className='text-[#515DEF]' />
                    </div>
                    <h3 className='text-xl font-medium text-[#77767A]'>Remove Allocation?</h3>
                    <p className='text-base text-[#77767A] font-medium mt-2'>
                        This will remove all class, subject, and mapping assignments for{' '}
                        <span className='text-[#1E1E1E]'>{teacherName}</span>.
                    </p>
                    <div className='flex gap-x-4 mt-10'>
                        <button
                            type='button'
                            onClick={onCancel}
                            className='bg-white text-[#77767A] text-sm text-center px-4 py-2.5 rounded-md border border-[#77767A] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer w-full'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={onConfirm}
                            className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full'
                        >
                            Remove Allocation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RemoveAllocationModal
