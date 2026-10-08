import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AuditPlanForm from './Components/AuditPlanForm'
import { getAuditPlanById } from './auditPlanningData'

const EditAuditPlan = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const plan = getAuditPlanById(id)

    if (!plan) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director-audit/audit-planning')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Audit plan not found or could not be loaded.
                </div>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Edit Audit Plan</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Update audit plan <span className='font-medium text-[#1E1E1E]'>{plan.id}</span> — {plan.title}
                </p>
                <div className='lg:mt-8 mt-4'>
                    <AuditPlanForm initialData={plan} submitLabel='Update Changes' />
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
                    Update Changes
                </button>
            </div>
        </section>
    )
}

export default EditAuditPlan
