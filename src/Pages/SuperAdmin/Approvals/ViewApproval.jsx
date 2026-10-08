import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    categoryBadgeColor,
    formatAmount,
    getApprovalRequestById,
    priorityBadgeColor,
    ROUTE_BASE,
    statusBadgeColor,
    updateApprovalRequestStatus,
} from './approvalsData'

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

const ViewApproval = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [request, setRequest] = useState(() => getApprovalRequestById(id))
    const [superAdminRemarks, setSuperAdminRemarks] = useState(request?.superAdminRemarks ?? '')

    const handleApprove = () => {
        const updated = updateApprovalRequestStatus(id, 'Approved', superAdminRemarks)
        if (updated) setRequest(updated)
    }

    const handleReject = () => {
        const updated = updateApprovalRequestStatus(id, 'Rejected', superAdminRemarks)
        if (updated) setRequest(updated)
    }

    if (!request) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Approval request not found.</div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(ROUTE_BASE)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-center gap-2 mb-3'>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryBadgeColor[request.category] ?? categoryBadgeColor['Finance Request']}`}>
                        {request.category}
                    </span>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityBadgeColor[request.priority] ?? priorityBadgeColor.Normal}`}>
                        {request.priority} Priority
                    </span>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[request.status]}`}>
                        {request.status}
                    </span>
                </div>
                <h1 className='text-2xl font-semibold text-black'>{request.requestId}</h1>
                <p className='text-lg text-[#1E1E1E] mt-2'>{request.title}</p>
                <p className='text-sm text-[#667085] mt-2'>
                    {request.requestedBy}
                    {' · '}
                    {request.role}
                    {' · '}
                    {request.department}
                    {' · '}
                    {request.requestDate}
                </p>
            </div>

            <Section title='Request information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Request ID' value={request.requestId} />
                    <Field label='Category' value={request.category} />
                    <Field label='Request date' value={request.requestDate} />
                    <Field label='Requested by' value={request.requestedBy} />
                    <Field label='Role' value={request.role} />
                    <Field label='Department' value={request.department} />
                    <Field label='Requested to' value={request.requestedTo} />
                    <Field label='Amount' value={formatAmount(request.amount)} />
                    <Field label='Priority' value={request.priority} />
                    <div className='lg:col-span-3'>
                        <Field label='Description' value={request.description} />
                    </div>
                </div>
            </Section>

            {request.financeDetails && (
                <Section title='Finance request details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <Field label='Expense type' value={request.financeDetails.expenseType} />
                        <Field label='Fiscal period' value={request.financeDetails.fiscalPeriod} />
                        <Field label='Payment mode' value={request.financeDetails.paymentMode} />
                        <Field label='Supporting document' value={request.financeDetails.supportingDoc} />
                        <Field label='Amount' value={formatAmount(request.amount)} />
                    </div>
                </Section>
            )}

            {request.dataChangeDetails && (
                <Section title='Data change details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <Field label='Module' value={request.dataChangeDetails.module} />
                        <Field label='Record ID' value={request.dataChangeDetails.recordId} />
                        <Field label='Record name' value={request.dataChangeDetails.recordName} />
                        <Field label='Field changed' value={request.dataChangeDetails.fieldChanged} />
                        <Field label='Old value' value={request.dataChangeDetails.oldValue} />
                        <Field label='New value' value={request.dataChangeDetails.newValue} />
                        <div className='lg:col-span-3'>
                            <Field label='Change reason' value={request.dataChangeDetails.changeReason} />
                        </div>
                    </div>
                </Section>
            )}

            {request.procurementDetails && (
                <Section title='Procurement details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <Field label='Vendor' value={request.procurementDetails.vendor} />
                        <Field label='Items' value={request.procurementDetails.items} />
                        <Field label='Delivery date' value={request.procurementDetails.deliveryDate} />
                        <Field label='Quote reference' value={request.procurementDetails.quoteRef} />
                        <Field label='Amount' value={formatAmount(request.amount)} />
                    </div>
                </Section>
            )}

            {request.budgetDetails && (
                <Section title='Budget request details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <Field label='Budget head' value={request.budgetDetails.budgetHead} />
                        <Field label='Fiscal year' value={request.budgetDetails.fiscalYear} />
                        <Field label='Previous allocation' value={request.budgetDetails.previousAllocation} />
                        <Field label='Requested increase' value={request.budgetDetails.requestedIncrease} />
                        <Field label='Total requested' value={formatAmount(request.amount)} />
                    </div>
                </Section>
            )}

            {request.policyDetails && (
                <Section title='Policy change details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <Field label='Policy area' value={request.policyDetails.policyArea} />
                        <Field label='Current rule' value={request.policyDetails.currentRule} />
                        <Field label='Proposed rule' value={request.policyDetails.proposedRule} />
                        <Field label='Effective from' value={request.policyDetails.effectiveFrom} />
                    </div>
                </Section>
            )}

            {request.hrDetails && (
                <Section title='HR request details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <Field label='Request type' value={request.hrDetails.requestType} />
                        <Field label='Affected department' value={request.hrDetails.affectedDepartment} />
                        <Field label='Headcount' value={request.hrDetails.headcount} />
                        <div className='lg:col-span-3'>
                            <Field label='Justification' value={request.hrDetails.justification} />
                        </div>
                    </div>
                </Section>
            )}

            {request.status === 'Pending' ? (
                <Section title='Super Admin decision'>
                    <div className='space-y-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='super-admin-remarks' className='text-base font-medium text-[#808080]'>Remarks</label>
                            <textarea
                                id='super-admin-remarks'
                                rows={3}
                                value={superAdminRemarks}
                                onChange={(e) => setSuperAdminRemarks(e.target.value)}
                                className='text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 w-full'
                                placeholder='Add approval or rejection remarks...'
                            />
                        </div>
                        <div className='flex sm:justify-end justify-center gap-x-4'>
                            <button
                                type='button'
                                onClick={handleReject}
                                className='bg-white text-[#FF0000] text-sm px-8 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                            >
                                Reject
                            </button>
                            <button
                                type='button'
                                onClick={handleApprove}
                                className='bg-[#4CAF50] text-white text-sm px-8 py-2 rounded-md border border-[#4CAF50] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </Section>
            ) : (
                request.superAdminRemarks && (
                    <Section title='Super Admin remarks'>
                        <Field label='Remarks' value={request.superAdminRemarks} />
                    </Section>
                )
            )}
        </section>
    )
}

export default ViewApproval
