import React, { useState } from 'react'
import { X, CircleCheck } from 'lucide-react'

const MarkAsDoneConfirmModal = ({ open, plan, onCancel, onConfirm }) => {
    const [remarks, setRemarks] = useState('')

    if (!open || !plan) return null

    const handleConfirm = () => {
        onConfirm(remarks)
        setRemarks('')
    }

    const handleCancel = () => {
        setRemarks('')
        onCancel()
    }

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center'>
            <div className='absolute inset-0 bg-black/40' onClick={handleCancel} />

            <div className='relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5 py-4'>
                <div className='flex justify-end items-center'>
                    <button type='button' onClick={handleCancel} className='hover:text-red-500 cursor-pointer'>
                        <X />
                    </button>
                </div>
                <div className='pt-4 text-center'>
                    <div className='flex justify-center items-center mb-4'>
                        <CircleCheck size={70} strokeWidth={1.5} className='text-[#515DEF]' />
                    </div>
                    <h3 className='text-xl font-medium text-[#77767A]'>Mark as Done?</h3>
                    <p className='text-base text-[#77767A] font-medium mt-2'>
                        Confirm that you have completed teaching this lesson plan for{' '}
                        <span className='text-[#1E1E1E]'>{plan.subject}</span>
                        {' '}(Class {plan.className}, Section {plan.section})?
                    </p>

                    <div className='mt-6 text-left'>
                        <label htmlFor='completion-remarks' className='block text-sm font-medium text-[#1E1E1E] mb-2'>
                            Remarks <span className='text-[#808080] font-normal'>(optional)</span>
                        </label>
                        <textarea
                            id='completion-remarks'
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            placeholder='Add a note about how this went…'
                            className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 focus:outline-none focus:border-[#515DEF] resize-none'
                        />
                    </div>

                    <div className='flex gap-x-4 mt-8'>
                        <button
                            type='button'
                            onClick={handleCancel}
                            className='bg-white text-[#77767A] text-sm text-center px-4 py-2.5 rounded-md border border-[#77767A] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer w-full'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={handleConfirm}
                            className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full'
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarkAsDoneConfirmModal
