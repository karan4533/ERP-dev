import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    REQUESTS,
    statusBadgeColor,
    requestTypeBadgeColor,
    formatAmount,
    BUDGET_THRESHOLD,
} from './requestApprovalData'

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

const ViewRequestApproval = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const requestId = searchParams.get('requestId')
    const request = REQUESTS.find((item) => item.requestId === requestId) ?? REQUESTS[0]
    const isFinancial = request.requestType === 'Financial Request'

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director/request-approvals')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>

                {request.status === 'Pending' && (
                    <div className='flex flex-wrap gap-2'>
                        <button type='button' className='bg-[#4CAF50] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer'>
                            Approve
                        </button>
                        <button type='button' className='bg-[#FF0000] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer'>
                            Reject
                        </button>
                    </div>
                )}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <div className='flex flex-wrap items-center gap-2 mb-2'>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${requestTypeBadgeColor[request.requestType]}`}>
                                {request.requestType}
                            </span>
                        </div>
                        <h1 className='text-2xl font-semibold text-black'>{request.requestId}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{request.purpose}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap self-start ${statusBadgeColor[request.status]}`}>
                        {request.status}
                    </span>
                </div>
            </div>

            <Section title='Request information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Request ID' value={request.requestId} />
                    <Field label='Request type' value={request.requestType} />
                    <Field label='Request date' value={request.requestDate} />
                    <Field label='Status' value={request.status} />
                    <Field label='Requested by' value={request.requestedBy} />
                    <Field label='Department' value={request.department} />
                    {isFinancial && (
                        <Field label='Requested amount' value={formatAmount(request.requestedAmount)} />
                    )}
                    <div className='lg:col-span-3'>
                        <Field label='Purpose' value={request.purpose} />
                    </div>
                    <div className='lg:col-span-3'>
                        <Field label='Description' value={request.description} />
                    </div>
                </div>
            </Section>

            {isFinancial ? (
                <Section title='Financial request details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <div className='lg:col-span-3'>
                            <Field label='Items / materials' value={request.items} />
                        </div>
                        <div className='lg:col-span-3'>
                            <Field label='Remarks' value={request.remarks} />
                        </div>
                        <Field label='Budget threshold' value={formatAmount(BUDGET_THRESHOLD)} />
                        <Field
                            label='Over budget'
                            value={request.exceedsBudget ? 'Yes — exceeds approved limit' : 'No — within approved limit'}
                        />
                        <Field label='Amount summary' value={formatAmount(request.requestedAmount)} />
                    </div>
                </Section>
            ) : (
                <Section title='General request details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <div className='lg:col-span-3'>
                            <Field label='Request specifics' value={request.generalDetails} />
                        </div>
                        <div className='lg:col-span-3'>
                            <Field label='Remarks' value={request.remarks} />
                        </div>
                    </div>
                </Section>
            )}
        </section>
    )
}

export default ViewRequestApproval
