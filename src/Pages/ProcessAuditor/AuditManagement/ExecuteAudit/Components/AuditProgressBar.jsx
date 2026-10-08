import React from 'react'

const AuditProgressBar = ({ progress, scores }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 border border-[#EDEEF5]'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3'>
            <div>
                <p className='text-xs font-semibold text-[#808080] uppercase tracking-wide'>Audit Progress</p>
                <p className='text-lg font-bold text-[#1E1E1E] mt-0.5'>
                    Questions <span className='text-[#515DEF]'>{progress.answered}</span>
                    <span className='text-[#808080] font-normal'> / {progress.total}</span>
                    <span className='text-[#808080] font-normal text-sm ml-2'>Completed</span>
                </p>
            </div>
            <div className='flex gap-4 text-center'>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Compliance</p>
                    <p className='text-2xl font-bold text-[#515DEF] transition-all duration-500'>{scores.overallCompliance}%</p>
                </div>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Passed</p>
                    <p className='text-lg font-bold text-[#4CAF50]'>{scores.passed}</p>
                </div>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Failed</p>
                    <p className='text-lg font-bold text-[#FF0000]'>{scores.failed}</p>
                </div>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>NA</p>
                    <p className='text-lg font-bold text-[#667085]'>{scores.na}</p>
                </div>
            </div>
        </div>
        <div className='relative h-3 bg-[#EDEEF5] rounded-full overflow-hidden'>
            <div
                className='absolute left-0 top-0 h-full bg-gradient-to-r from-[#515DEF] to-[#7B83FF] rounded-full transition-all duration-500 ease-out'
                style={{ width: `${progress.progressPercent}%` }}
            />
        </div>
        <div className='flex justify-between mt-1.5 text-xs text-[#808080]'>
            <span>{progress.progressPercent}% questions answered</span>
            <span>{progress.unanswered} remaining</span>
        </div>
    </div>
)

export default AuditProgressBar
