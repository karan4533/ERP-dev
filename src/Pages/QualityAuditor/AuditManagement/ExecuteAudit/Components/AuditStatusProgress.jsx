import React from 'react'
import { AUDIT_STATUS_STAGES, getStatusProgressIndex } from '../executeAuditData'

const AuditStatusProgress = ({ status }) => {
    const activeIndex = getStatusProgressIndex(status)
    const progressPercent = (activeIndex / (AUDIT_STATUS_STAGES.length - 1)) * 100

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4'>
                <h3 className='text-base font-semibold text-black'>Audit Status</h3>
                <span className='text-sm font-semibold text-[#515DEF] px-3 py-1 rounded-lg bg-[#515DEF]/10'>
                    {status}
                </span>
            </div>

            <div className='relative h-2 bg-[#EDEEF5] rounded-full mb-6'>
                <div
                    className='absolute left-0 top-0 h-full bg-[#515DEF] rounded-full transition-all duration-500'
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2'>
                {AUDIT_STATUS_STAGES.map((stage, index) => {
                    const isDone = index <= activeIndex
                    const isCurrent = index === activeIndex

                    return (
                        <div key={stage} className='flex flex-col items-center text-center gap-1'>
                            <div
                                className={`size-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                                    isCurrent
                                        ? 'bg-[#515DEF] text-white border-[#515DEF]'
                                        : isDone
                                          ? 'bg-[#4CAF50] text-white border-[#4CAF50]'
                                          : 'bg-white text-[#808080] border-[#D9D9D9]'
                                }`}
                            >
                                {isDone && !isCurrent ? '✓' : index + 1}
                            </div>
                            <span className={`text-[10px] leading-tight ${isCurrent ? 'text-[#515DEF] font-semibold' : 'text-[#667085]'}`}>
                                {stage}
                            </span>
                            {index < AUDIT_STATUS_STAGES.length - 1 && (
                                <span className='hidden lg:block text-[#D9D9D9] text-xs mt-1'>↓</span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default AuditStatusProgress
