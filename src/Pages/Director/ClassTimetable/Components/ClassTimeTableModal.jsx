import React from 'react'
import { X } from 'lucide-react'
import ClassTimeTableGrid from './ClassTimeTableGrid'

const ClassTimeTableModal = ({ open, onClose, title = 'Class Timetable' }) => {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} />
            <div className='relative z-10 w-full max-w-5xl rounded-xl bg-white shadow-lg p-5 py-4'>
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-xl font-medium text-[#1E1E1E]'>{title}</h3>
                    <button type='button' onClick={onClose} className='hover:text-red-500 cursor-pointer'>
                        <X />
                    </button>
                </div>
                <ClassTimeTableGrid />
            </div>
        </div>
    )
}

export default ClassTimeTableModal
