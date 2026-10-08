import React from 'react'

const FindingsPanel = ({ findings }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-lg font-semibold text-black mb-4'>Findings Summary</h3>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <div className='rounded-xl bg-[#515DEF]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Total Findings</p>
                <p className='text-xl font-bold text-[#515DEF] mt-1'>{findings.totalFindings}</p>
            </div>
            <div className='rounded-xl bg-[#4CAF50]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Yes</p>
                <p className='text-xl font-bold text-[#4CAF50] mt-1'>{findings.yes}</p>
            </div>
            <div className='rounded-xl bg-[#FF0000]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>No</p>
                <p className='text-xl font-bold text-[#FF0000] mt-1'>{findings.no}</p>
            </div>
            <div className='rounded-xl bg-[#FF9800]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Critical Answered</p>
                <p className='text-xl font-bold text-[#FF9800] mt-1'>{findings.criticalAnswered}</p>
            </div>
        </div>
    </div>
)

export default FindingsPanel
