import React from 'react'

/**
 * Honest placeholder for PRO menu items that have no backend API yet.
 * Does not invent records, saves, or metrics.
 */
const PendingFeature = ({ title, description }) => (
    <section className='bg-white rounded-2xl shadow-md p-6 max-w-3xl'>
        <h2 className='text-xl font-semibold text-black'>{title}</h2>
        <p className='mt-3 text-sm text-[#667085] leading-relaxed'>
            {description
                || 'This screen is pending implementation. No actions are available here until a backed API is delivered.'}
        </p>
        <p className='mt-4 inline-flex items-center rounded-md bg-[#FFFAEB] text-[#B54708] text-xs font-semibold px-3 py-1.5'>
            Not yet available
        </p>
    </section>
)

export default PendingFeature
