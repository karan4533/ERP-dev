import React from 'react'

const FindingsPanel = ({ findings }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-lg font-semibold text-black mb-4'>Findings Summary</h3>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <div className='rounded-xl bg-[#515DEF]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Average Rating</p>
                <p className='text-xl font-bold text-[#515DEF] mt-1'>
                    {findings.averageRating ? `${findings.averageRating} / 5` : '— / 5'}
                </p>
            </div>
            <div className='rounded-xl bg-[#515DEF]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Quality Score</p>
                <p className='text-xl font-bold text-[#515DEF] mt-1'>{findings.overallQualityScore}%</p>
            </div>
            <div className='rounded-xl bg-[#4CAF50]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Excellent</p>
                <p className='text-xl font-bold text-[#4CAF50] mt-1'>{findings.excellent}</p>
            </div>
            <div className='rounded-xl bg-[#2196F3]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Good</p>
                <p className='text-xl font-bold text-[#2196F3] mt-1'>{findings.good}</p>
            </div>
            <div className='rounded-xl bg-[#FFC107]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Average</p>
                <p className='text-xl font-bold text-[#FFC107] mt-1'>{findings.average}</p>
            </div>
            <div className='rounded-xl bg-[#FF9800]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Needs Improvement</p>
                <p className='text-xl font-bold text-[#FF9800] mt-1'>{findings.needsImprovement}</p>
            </div>
            <div className='rounded-xl bg-[#FF0000]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Critical Findings</p>
                <p className='text-xl font-bold text-[#FF0000] mt-1'>{findings.criticalFindings}</p>
            </div>
            <div className='rounded-xl bg-[#FF9800]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Observations Raised</p>
                <p className='text-xl font-bold text-[#FF9800] mt-1'>{findings.observationsRaised}</p>
            </div>
        </div>
    </div>
)

export default FindingsPanel
