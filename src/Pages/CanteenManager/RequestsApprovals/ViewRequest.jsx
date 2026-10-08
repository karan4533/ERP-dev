import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { REQUESTS, priorityBadgeColor, statusBadgeColor } from './requestsData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const ViewRequest = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const request = REQUESTS.find((entry) => entry.requestId === id) ?? REQUESTS[0]

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button type='button' onClick={() => navigate('/canteen-manager/requests-approvals')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{request.requestId}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{request.title}</p>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${priorityBadgeColor[request.priority]}`}>{request.priority}</span>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>{request.status}</span>
                    </div>
                </div>
            </div>

            <Section title='Request details'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Request ID' value={request.requestId} />
                    <Field label='Request type' value={request.requestType} />
                    <Field label='Title' value={request.title} />
                    <Field label='Requested amount' value={request.requestedAmount} />
                    <Field label='Priority' value={request.priority} />
                    <Field label='Submitted date' value={request.submittedDate} />
                    <Field label='Required by date' value={request.requiredByDate} />
                    <Field label='Budget category' value={request.budgetCategory} />
                    <Field label='Approval date' value={request.approvalDate} />
                    <div className='lg:col-span-3'>
                        <Field label='Description' value={request.description} />
                    </div>
                </div>
            </Section>

            <Section title='Routing information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Requested by' value={request.requestedBy} />
                    <Field label='Department' value={request.department} />
                    <Field label='Sent to' value={request.sentTo} />
                    <Field label='Status' value={request.status} />
                </div>
            </Section>
        </section>
    )
}

export default ViewRequest
