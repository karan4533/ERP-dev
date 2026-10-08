import React from 'react'

const AuditAssignmentPlaceholder = ({ title, description }) => (
    <section>
        <div className='bg-white rounded-2xl shadow-md p-8 text-center'>
            <h2 className='text-xl font-semibold text-black'>{title}</h2>
            <p className='text-sm text-[#667085] mt-2'>{description}</p>
        </div>
    </section>
)

export default AuditAssignmentPlaceholder
