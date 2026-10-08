import React from 'react'

const PagePlaceholder = ({ title, subtitle }) => (
    <section className='space-y-6'>
        <div className='bg-white rounded-2xl shadow-md p-8'>
            <h2 className='text-xl font-semibold text-black'>{title}</h2>
            {subtitle && <p className='text-sm text-[#667085] mt-2'>{subtitle}</p>}
            <p className='text-sm text-[#667085] mt-4'>This page will be implemented next.</p>
        </div>
    </section>
)

export default PagePlaceholder
