import React from 'react'
import ProofUpload from './ProofUpload'

const UploadDocuments = () => {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>ID Proof</label>
                <ProofUpload />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Driving License Copy </label>
                <ProofUpload />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Address Proof</label>
                <ProofUpload />
            </div>
        </div>
    )
}

export default UploadDocuments