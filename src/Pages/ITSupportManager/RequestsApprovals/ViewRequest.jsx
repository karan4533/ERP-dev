import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import pdf_icon from '../../../assets/images/pdf-icon.png'
import { getRequestById, approvalStatusBadgeColor, stageBadgeColor } from './requestsData'

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
    const request = getRequestById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button type='button' onClick={() => navigate('/it-support-manager/requests-approvals')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!request ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Request not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                            <div>
                                <h1 className='text-2xl font-semibold text-black'>{request.requestId}</h1>
                                <p className='text-sm text-[#667085] mt-1'>{request.title}</p>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${approvalStatusBadgeColor[request.approvalStatus]}`}>{request.approvalStatus}</span>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${stageBadgeColor[request.currentStage]}`}>{request.currentStage}</span>
                            </div>
                        </div>
                    </div>

                    <Section title='Request Details'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Request ID' value={request.requestId} />
                            <Field label='Request Type' value={request.requestTypeFull} />
                            <Field label='Title' value={request.title} />
                            <Field label='Submitted Date' value={request.submittedDate} />
                            <div className='lg:col-span-3'>
                                <Field label='Description' value={request.description} />
                            </div>
                        </div>
                    </Section>

                    <Section title='Financial Details'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Estimated Cost' value={request.estimatedCost} />
                            <Field label='Budget Category' value={request.budgetCategory} />
                            <Field label='Amount' value={request.amount} />
                        </div>
                    </Section>

                    <Section title='Vendor Details'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Vendor Name' value={request.vendor} />
                            <Field label='Vendor Contact' value={request.vendorContact} />
                        </div>
                    </Section>

                    <Section title='Workflow'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                            <Field label='Requested By' value={request.requestedBy} />
                            <Field label='Department' value={request.department} />
                            <Field label='Sent To' value={request.sentTo} />
                            <Field label='Status' value={request.status} />
                            <Field label='Current Stage' value={request.currentStage} />
                            <Field label='Approval Status' value={request.approvalStatus} />
                        </div>
                    </Section>

                    {request.attachments?.length > 0 && (
                        <Section title='Attachments'>
                            <div className='flex flex-col gap-y-3'>
                                {request.attachments.map((file) => (
                                    <div key={file} className='flex items-center gap-x-2 text-sm text-[#1E1E1E]'>
                                        <img src={pdf_icon} alt='file-icon' className='w-6 h-6' />
                                        <span>{file}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                </>
            )}
        </section>
    )
}

export default ViewRequest
