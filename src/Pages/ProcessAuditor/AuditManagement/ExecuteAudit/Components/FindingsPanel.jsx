import React from 'react'

const FindingsPanel = ({ findings }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-lg font-semibold text-black mb-4'>Findings Summary</h3>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
            <div className='rounded-xl bg-[#515DEF]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Total Findings</p>
                <p className='text-xl font-bold text-[#515DEF] mt-1'>{findings.totalFindings}</p>
            </div>
            <div className='rounded-xl bg-[#4CAF50]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Compliant</p>
                <p className='text-xl font-bold text-[#4CAF50] mt-1'>{findings.compliant ?? findings.yes ?? 0}</p>
            </div>
            <div className='rounded-xl bg-[#FF9800]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Minor NC</p>
                <p className='text-xl font-bold text-[#FF9800] mt-1'>{findings.minorNc ?? 0}</p>
            </div>
            <div className='rounded-xl bg-[#FF0000]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Major NC</p>
                <p className='text-xl font-bold text-[#FF0000] mt-1'>{findings.majorNc ?? 0}</p>
            </div>
            <div className='rounded-xl bg-[#2196F3]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Yes / No</p>
                <p className='text-xl font-bold text-[#2196F3] mt-1'>
                    {findings.yes ?? 0}/{findings.no ?? 0}
                </p>
            </div>
            <div className='rounded-xl bg-[#9C27B0]/10 p-3 text-center'>
                <p className='text-[10px] text-[#808080] uppercase'>Observations</p>
                <p className='text-xl font-bold text-[#9C27B0] mt-1'>{findings.observationsRaised ?? 0}</p>
            </div>
        </div>
    </div>
)

export default FindingsPanel
