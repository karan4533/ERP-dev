import React from 'react'
import { X } from 'lucide-react'
import { getSopDetails } from '../executeAuditData'

const SopPopup = ({ sopCode, onClose }) => {
    if (!sopCode) return null
    const sop = getSopDetails(sopCode)

    return (
        <div className='fixed inset-0 z-[60] flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />
            <div className='relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10'>
                <div className='flex justify-between items-start mb-4'>
                    <div>
                        <p className='text-xs text-[#515DEF] font-semibold uppercase'>{sop.code}</p>
                        <h3 className='text-lg font-semibold text-black mt-1'>{sop.title}</h3>
                    </div>
                    <button type='button' onClick={onClose} className='text-[#808080] hover:text-[#FF0000] cursor-pointer'>
                        <X size={20} />
                    </button>
                </div>
                <div className='space-y-4'>
                    <div>
                        <p className='text-xs font-semibold text-[#808080] uppercase mb-1'>Objective</p>
                        <p className='text-sm text-[#1E1E1E]'>{sop.objective}</p>
                    </div>
                    <div>
                        <p className='text-xs font-semibold text-[#808080] uppercase mb-1'>Procedure</p>
                        <p className='text-sm text-[#1E1E1E]'>{sop.procedure}</p>
                    </div>
                    <div>
                        <p className='text-xs font-semibold text-[#808080] uppercase mb-1'>Reference</p>
                        <p className='text-sm text-[#1E1E1E]'>{sop.reference}</p>
                    </div>
                    <div>
                        <p className='text-xs font-semibold text-[#808080] uppercase mb-1'>Expected Result</p>
                        <p className='text-sm text-[#1E1E1E]'>{sop.expectedResult}</p>
                    </div>
                </div>
                <button
                    type='button'
                    onClick={onClose}
                    className='mt-6 w-full bg-[#515DEF] text-white text-sm py-2.5 rounded-md hover:opacity-90 cursor-pointer'
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export default SopPopup
