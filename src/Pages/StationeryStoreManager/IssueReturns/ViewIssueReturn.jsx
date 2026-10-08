import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getIssueReturnById, activityTypeBadgeColor, statusBadgeColor } from './issueReturnsData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value ?? '—'}</span>
    </div>
)

const ViewIssueReturn = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const record = getIssueReturnById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button type='button' onClick={() => navigate('/stationery-store-manager/issue-returns')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                            <div>
                                <h1 className='text-2xl font-semibold text-black'>{record.id}</h1>
                                <p className='text-sm text-[#667085] mt-1'>{record.itemName} · {record.requestedBy}</p>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${activityTypeBadgeColor[record.activityType]}`}>{record.activityType}</span>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>{record.status}</span>
                            </div>
                        </div>
                    </div>

                    <Section title='Common Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Issue/Return ID' value={record.id} />
                            <Field label='Activity Type' value={record.activityType} />
                            <Field label='Employee Name' value={record.requestedBy} />
                            <Field label='Employee ID' value={record.employeeId} />
                            <Field label='Department' value={record.department} />
                            <Field label='Item Name' value={record.itemName} />
                            <Field label='Quantity' value={record.quantity} />
                            <div className='lg:col-span-3'>
                                <Field label='Remarks' value={record.remarks} />
                            </div>
                        </div>
                    </Section>

                    {record.activityType === 'Issue' && (
                        <Section title='Issue Details'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                                <Field label='Available Stock' value={record.availableStock} />
                                <Field label='Issue Date' value={record.issueDate} />
                                <Field label='Purpose' value={record.purpose} />
                            </div>
                        </Section>
                    )}

                    {record.activityType === 'Return' && (
                        <Section title='Return Details'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                                <Field label='Original Issue Reference' value={record.originalIssueRef} />
                                <Field label='Return Date' value={record.returnDate} />
                                <Field label='Item Condition' value={record.condition} />
                            </div>
                        </Section>
                    )}

                    <Section title='Dates & Status'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Issue Date' value={record.issueDate} />
                            <Field label='Return Date' value={record.returnDate} />
                            <Field label='Status' value={record.status} />
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewIssueReturn
