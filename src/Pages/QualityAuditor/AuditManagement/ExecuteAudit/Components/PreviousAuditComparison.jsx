import React from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { getDepartmentInfo } from '../executeAuditData'

const PreviousAuditComparison = ({ department, currentScore }) => {
    const dept = getDepartmentInfo(department)
    const diff = currentScore - dept.previousScore
    const isDecline = diff < 0
    const isImprovement = diff > 0

    return (
        <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
            <h3 className='text-base font-semibold text-black mb-4'>Previous Audit Comparison</h3>
            <div className='grid grid-cols-3 gap-4 items-center'>
                <div className='text-center'>
                    <p className='text-xs text-[#808080] mb-1'>Last Audit</p>
                    <p className='text-3xl font-bold text-[#667085]'>{dept.previousScore}%</p>
                    <p className='text-[10px] text-[#808080] mt-1'>{dept.previousAuditDate}</p>
                </div>
                <div className='text-center'>
                    <p className='text-xs text-[#808080] mb-1'>Current</p>
                    <p className='text-3xl font-bold text-[#515DEF]'>{currentScore}%</p>
                    <p className='text-[10px] text-[#808080] mt-1'>Live score</p>
                </div>
                <div className='text-center'>
                    <p className='text-xs text-[#808080] mb-1'>Difference</p>
                    <div className={`flex items-center justify-center gap-1 text-2xl font-bold ${
                        isDecline ? 'text-[#FF0000]' : isImprovement ? 'text-[#4CAF50]' : 'text-[#667085]'
                    }`}>
                        {isDecline && <TrendingDown size={22} />}
                        {isImprovement && <TrendingUp size={22} />}
                        {!isDecline && !isImprovement && <Minus size={22} />}
                        {diff > 0 ? `+${diff}` : diff}%
                    </div>
                    {isDecline && (
                        <p className='text-[10px] text-[#FF0000] mt-1 font-medium'>Decline detected</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PreviousAuditComparison
