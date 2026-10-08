import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LeaveRequestForm from './Components/LeaveRequestForm'
import { getLeaveRequestById } from './leaveRequestData'

const EditLeaveRequest = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getLeaveRequestById(id)

    if (!record) {
        return (
            <section className='space-y-6'>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Leave request not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <h2 className='text-xl font-semibold text-black'>Leave Request Information</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Leave Request ID:
                    {' '}
                    <span className='font-medium text-[#1E1E1E]'>{record.leaveRequestId}</span>
                </p>
                <LeaveRequestForm record={record} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4'>
                <button
                    type='button'
                    onClick={() => navigate('/driver/leave-request')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={() => navigate('/driver/leave-request')}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default EditLeaveRequest
