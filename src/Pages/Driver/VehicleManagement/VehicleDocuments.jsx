import React from 'react'
import UploadDocuments from './Components/UploadDocuments'

const VehicleDocuments = () => (
    <section className='space-y-6'>
        <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
            <div className='mb-6'>
                <h2 className='text-xl font-semibold text-[#1E1E1E]'>
                    Documents Upload
                    {' '}
                    <span className='text-sm font-normal text-[#667085]'>
                        — Upload the document file as image or Pdf with high resolution. Max file Size 2Mb
                    </span>
                </h2>
            </div>

            <UploadDocuments />
        </div>
    </section>
)

export default VehicleDocuments
