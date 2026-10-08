import React from 'react'
import { Cloud, CloudOff } from 'lucide-react'
import { formatRelativeTime } from '../executeAuditData'

const StickyAuditFooter = ({ scores, progress, findings, lastSavedAt, onSaveDraft, onSubmit }) => (
    <div className='fixed bottom-0 left-0 right-0 lg:left-[280px] bg-white/95 backdrop-blur-md border-t border-[#E0E0E0] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 sm:px-6 py-3 z-30'>
        <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Compliance</p>
                    <p className='text-xl font-bold text-[#515DEF] transition-all duration-300'>{scores.overallCompliance}%</p>
                </div>
                <div className='h-8 w-px bg-[#E0E0E0] hidden sm:block' />
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Passed</p>
                    <p className='text-base font-bold text-[#4CAF50]'>{scores.passed}</p>
                </div>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Failed</p>
                    <p className='text-base font-bold text-[#FF0000]'>{scores.failed}</p>
                </div>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>NA</p>
                    <p className='text-base font-bold text-[#667085]'>{scores.na}</p>
                </div>
                <div className='h-8 w-px bg-[#E0E0E0] hidden md:block' />
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Questions Left</p>
                    <p className='text-base font-bold text-[#667085]'>{progress.unanswered}</p>
                </div>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Findings</p>
                    <p className='text-base font-bold text-[#FF0000]'>{findings.totalFindings}</p>
                </div>
                <div>
                    <p className='text-[10px] text-[#808080] uppercase'>Observations</p>
                    <p className='text-base font-bold text-[#FF9800]'>{findings.observationsRaised}</p>
                </div>
                <div className='flex items-center gap-1.5 text-xs text-[#667085]'>
                    {lastSavedAt ? <Cloud size={14} className='text-[#4CAF50]' /> : <CloudOff size={14} />}
                    <span>{formatRelativeTime(lastSavedAt)}</span>
                </div>
            </div>

            <div className='flex gap-3 shrink-0'>
                <button
                    type='button'
                    onClick={onSaveDraft}
                    className='flex-1 xl:flex-none bg-white text-[#515DEF] text-sm px-6 py-2.5 rounded-lg border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'
                >
                    Save Draft
                </button>
                <button
                    type='button'
                    onClick={onSubmit}
                    className='flex-1 xl:flex-none bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer shadow-sm'
                >
                    Submit Audit
                </button>
            </div>
        </div>
    </div>
)

export default StickyAuditFooter
