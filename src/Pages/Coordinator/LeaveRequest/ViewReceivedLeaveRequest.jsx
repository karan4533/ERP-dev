import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getReceivedLeaveRequestById, statusBadgeColor } from './leaveRequestData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

const ViewReceivedLeaveRequest = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const request = getReceivedLeaveRequestById(id)

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate('/coordinator/leave-request/received')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                <ArrowLeft size={18} />
                Back to list
            </button>

            {!request ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Leave request not found.</div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <h1 className='text-2xl font-semibold text-black'>{request.leaveRequestId}</h1>
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>{request.status}</span>
                        </div>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{request.studentName}</span>
                            {' · '}
                            {request.classSection}
                            {' · '}
                            {request.role}
                        </p>
                    </div>

                    <Section title='Student Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Student Name' value={request.studentName} />
                            <Field label='Admission Number' value={request.admissionNumber} />
                            <Field label='Class & Section' value={request.classSection} />
                            <Field label='Parent Name' value={request.parentName} />
                            <Field label='Parent Contact' value={request.parentContact} />
                        </div>
                    </Section>

                    <Section title='Leave Request Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Leave Request ID' value={request.leaveRequestId} />
                            <Field label='Leave Type' value={request.leaveType} />
                            <Field label='From Date' value={request.fromDate} />
                            <Field label='To Date' value={request.toDate} />
                            <Field label='Total Days' value={String(request.totalDays)} />
                            <Field label='Applied Date' value={request.appliedDate} />
                            <Field label='Status' value={request.status} />
                            <Field label='Reason' value={request.reason} />
                        </div>
                    </Section>

                    {request.status === 'Pending' && (
                        <div className='flex sm:justify-end justify-center gap-x-4'>
                            <button type='button' className='bg-white text-[#FF0000] text-sm px-8 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'>Reject</button>
                            <button type='button' className='bg-[#4CAF50] text-white text-sm px-8 py-2 rounded-md border border-[#4CAF50] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>Approve</button>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}

export default ViewReceivedLeaveRequest
