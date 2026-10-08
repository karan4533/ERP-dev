import React from 'react'
import { useNavigate } from 'react-router-dom'
import AuditPlanForm from './Components/AuditPlanForm'

const AddAuditPlan = () => {
    const navigate = useNavigate()

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Audit Plan</h2>
                <p className='text-sm text-[#667085] mt-1'>Create and schedule a new audit for a target department.</p>
                <div className='lg:mt-8 mt-4'>
                    <AuditPlanForm submitLabel='Save Changes' />
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director-audit/audit-planning')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddAuditPlan
