import React from 'react'

/**
 * Honest placeholder for CCTV menu items with no backend / video integration.
 * Never invents feeds, recordings, incidents, or alert counts.
 */
const PendingFeature = ({ title, description }) => (
    <section className='bg-white rounded-2xl shadow-md p-6 max-w-3xl'>
        <h2 className='text-xl font-semibold text-black'>{title}</h2>
        <p className='mt-3 text-sm text-[#667085] leading-relaxed'>
            {description
                || 'This capability is not configured in the ERP. No live video, recordings, or security events are available here.'}
        </p>
        <p className='mt-4 inline-flex items-center rounded-md bg-[#FFFAEB] text-[#B54708] text-xs font-semibold px-3 py-1.5'>
            Not yet available / unconfigured
        </p>
    </section>
)

export default PendingFeature
