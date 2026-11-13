import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ConfirmAction,
    FeedbackState,
    IntegrationNotice,
    PageHeader,
    StatusBadge,
    Surface,
    WorkflowTimeline,
} from '../../../Common/ui'
import {
    formatAmount,
    getApprovalRequestById,
    ROUTE_BASE,
    updateApprovalRequestStatus,
} from './approvalsData'

const Field = ({ label, value }) => (
    <div className='min-w-0'>
        <dt className='text-xs font-medium uppercase tracking-wide text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 break-words text-sm text-[var(--erp-ink)]'>{value || '—'}</dd>
    </div>
)

const DetailGrid = ({ children }) => (
    <dl className='grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5'>{children}</dl>
)

const requestDateToIso = (value) => {
    const match = String(value || '').match(/^(\d{2})-(\d{2})-(\d{4})$/)
    return match ? `${match[3]}-${match[2]}-${match[1]}T09:00:00.000Z` : undefined
}

const ViewApproval = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [request, setRequest] = useState(() => getApprovalRequestById(id))
    const [remarks, setRemarks] = useState(request?.superAdminRemarks ?? '')
    const [pendingDecision, setPendingDecision] = useState('')
    const [validationMessage, setValidationMessage] = useState('')
    const [confirmationMessage, setConfirmationMessage] = useState('')

    const timeline = useMemo(() => request ? [
        {
            id: 'submitted',
            label: 'Submitted for governance review',
            actor: `${request.requestedBy} · ${request.role}`,
            timestamp: requestDateToIso(request.requestDate),
            description: `${request.category} routed to ${request.requestedTo}.`,
            tone: 'info',
        },
        request.status === 'Pending'
            ? {
                id: 'pending',
                label: 'Awaiting Super Admin decision',
                actor: 'Super Admin',
                current: true,
                description: 'Review the request context and record an accountable decision.',
                tone: 'pending',
            }
            : {
                id: 'decision',
                label: request.status,
                actor: request.decidedBy || 'Super Admin',
                timestamp: request.decidedAt,
                description: request.superAdminRemarks || 'No decision remarks recorded.',
                tone: request.status,
            },
    ] : [], [request])

    const beginDecision = (decision) => {
        if (decision === 'Rejected' && !remarks.trim()) {
            setValidationMessage('Rejection remarks are required so the requester knows what to correct.')
            return
        }
        setValidationMessage('')
        setPendingDecision(decision)
    }

    const confirmDecision = () => {
        const updated = updateApprovalRequestStatus(id, pendingDecision, remarks.trim())
        if (updated) {
            setRequest(updated)
            setConfirmationMessage(`Request ${updated.requestId} was ${pendingDecision.toLowerCase()} in this demo workspace.`)
        }
        setPendingDecision('')
    }

    if (!request) {
        return (
            <section className='space-y-5'>
                <button type='button' onClick={() => navigate(ROUTE_BASE)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-ink)]'>
                    <ArrowLeft aria-hidden='true' size={17} /> Back to approvals
                </button>
                <FeedbackState kind='empty' title='Approval request not found' description='This request may no longer exist in the local demonstration queue.' />
            </section>
        )
    }

    return (
        <section className='space-y-5'>
            <PageHeader
                title={request.title}
                description={`${request.requestId} · ${request.category}`}
                context={`${request.requestedBy} · ${request.department} · received ${request.requestDate}`}
                status={request.status}
                actions={(
                    <button type='button' onClick={() => navigate(ROUTE_BASE)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-ink)]'>
                        <ArrowLeft aria-hidden='true' size={17} /> Back to approvals
                    </button>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Frontend-only approval decision'
                description='This action updates browser session data only. The production API must validate approver authority, enforce segregation of duties, create an immutable audit event and notify the requester.'
            />

            {confirmationMessage && (
                <div role='status' className='rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800'>
                    {confirmationMessage}
                </div>
            )}

            <div className='grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]'>
                <div className='space-y-5'>
                    <Surface title='Request information' description='Verify the requester, ownership and financial impact before deciding.'>
                        <DetailGrid>
                            <Field label='Request ID' value={request.requestId} />
                            <Field label='Category' value={<StatusBadge status='info' label={request.category} />} />
                            <Field label='Priority' value={<StatusBadge status={request.priority === 'High' ? 'overdue' : 'info'} label={request.priority} />} />
                            <Field label='Requested by' value={request.requestedBy} />
                            <Field label='Role' value={request.role} />
                            <Field label='Department' value={request.department} />
                            <Field label='Requested to' value={request.requestedTo} />
                            <Field label='Amount' value={formatAmount(request.amount)} />
                            <Field label='Request date' value={request.requestDate} />
                            <div className='sm:col-span-2 lg:col-span-3'><Field label='Description' value={request.description} /></div>
                        </DetailGrid>
                    </Surface>

                    {request.financeDetails && (
                        <Surface title='Finance request details'>
                            <DetailGrid>
                                <Field label='Expense type' value={request.financeDetails.expenseType} />
                                <Field label='Fiscal period' value={request.financeDetails.fiscalPeriod} />
                                <Field label='Payment mode' value={request.financeDetails.paymentMode} />
                                <Field label='Supporting document' value={request.financeDetails.supportingDoc} />
                                <Field label='Amount' value={formatAmount(request.amount)} />
                            </DetailGrid>
                        </Surface>
                    )}

                    {request.dataChangeDetails && (
                        <Surface title='Data change details'>
                            <DetailGrid>
                                <Field label='Module' value={request.dataChangeDetails.module} />
                                <Field label='Record ID' value={request.dataChangeDetails.recordId} />
                                <Field label='Record name' value={request.dataChangeDetails.recordName} />
                                <Field label='Field changed' value={request.dataChangeDetails.fieldChanged} />
                                <Field label='Old value' value={request.dataChangeDetails.oldValue} />
                                <Field label='New value' value={request.dataChangeDetails.newValue} />
                                <div className='sm:col-span-2 lg:col-span-3'><Field label='Change reason' value={request.dataChangeDetails.changeReason} /></div>
                            </DetailGrid>
                        </Surface>
                    )}

                    {request.procurementDetails && (
                        <Surface title='Procurement details'>
                            <DetailGrid>
                                <Field label='Vendor' value={request.procurementDetails.vendor} />
                                <Field label='Items' value={request.procurementDetails.items} />
                                <Field label='Delivery date' value={request.procurementDetails.deliveryDate} />
                                <Field label='Quote reference' value={request.procurementDetails.quoteRef} />
                                <Field label='Amount' value={formatAmount(request.amount)} />
                            </DetailGrid>
                        </Surface>
                    )}

                    {request.budgetDetails && (
                        <Surface title='Budget request details'>
                            <DetailGrid>
                                <Field label='Budget head' value={request.budgetDetails.budgetHead} />
                                <Field label='Fiscal year' value={request.budgetDetails.fiscalYear} />
                                <Field label='Previous allocation' value={request.budgetDetails.previousAllocation} />
                                <Field label='Requested increase' value={request.budgetDetails.requestedIncrease} />
                                <Field label='Total requested' value={formatAmount(request.amount)} />
                            </DetailGrid>
                        </Surface>
                    )}

                    {request.policyDetails && (
                        <Surface title='Policy change details'>
                            <DetailGrid>
                                <Field label='Policy area' value={request.policyDetails.policyArea} />
                                <Field label='Current rule' value={request.policyDetails.currentRule} />
                                <Field label='Proposed rule' value={request.policyDetails.proposedRule} />
                                <Field label='Effective from' value={request.policyDetails.effectiveFrom} />
                            </DetailGrid>
                        </Surface>
                    )}

                    {request.hrDetails && (
                        <Surface title='HR request details'>
                            <DetailGrid>
                                <Field label='Request type' value={request.hrDetails.requestType} />
                                <Field label='Affected department' value={request.hrDetails.affectedDepartment} />
                                <Field label='Headcount' value={request.hrDetails.headcount} />
                                <div className='sm:col-span-2 lg:col-span-3'><Field label='Justification' value={request.hrDetails.justification} /></div>
                            </DetailGrid>
                        </Surface>
                    )}
                </div>

                <div className='space-y-5'>
                    <WorkflowTimeline events={timeline} description='Submission and decision history available in this workspace.' />

                    {request.status === 'Pending' ? (
                        <Surface title='Record a decision' description='Remarks are mandatory for rejection and recommended for approval.' contentClassName='space-y-4 p-4 sm:p-5'>
                            <label className='grid gap-1.5 text-sm font-medium text-[var(--erp-ink)]' htmlFor='super-admin-remarks'>
                                Decision remarks
                                <textarea
                                    id='super-admin-remarks'
                                    rows={5}
                                    value={remarks}
                                    onChange={(event) => { setRemarks(event.target.value); setValidationMessage('') }}
                                    className='w-full rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 text-sm font-normal'
                                    placeholder='State the reason, conditions or corrective action…'
                                />
                            </label>
                            {validationMessage && <p role='alert' className='text-sm font-medium text-[var(--erp-red)]'>{validationMessage}</p>}
                            <div className='grid gap-2 sm:grid-cols-2'>
                                <button type='button' onClick={() => beginDecision('Rejected')} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--erp-red)] px-4 text-sm font-semibold text-[var(--erp-red)]'>
                                    <XCircle aria-hidden='true' size={17} /> Reject
                                </button>
                                <button type='button' onClick={() => beginDecision('Approved')} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                                    <CheckCircle2 aria-hidden='true' size={17} /> Approve
                                </button>
                            </div>
                        </Surface>
                    ) : (
                        <Surface title='Decision record' contentClassName='p-4 sm:p-5'>
                            <Field label='Super Admin remarks' value={request.superAdminRemarks || 'No remarks recorded'} />
                        </Surface>
                    )}
                </div>
            </div>

            <ConfirmAction
                open={Boolean(pendingDecision)}
                onClose={() => setPendingDecision('')}
                onConfirm={confirmDecision}
                title={`${pendingDecision === 'Rejected' ? 'Reject' : 'Approve'} request?`}
                description='This changes the request state for everyone using this browser session.'
                confirmLabel={pendingDecision === 'Rejected' ? 'Confirm rejection' : 'Confirm approval'}
                tone={pendingDecision === 'Rejected' ? 'danger' : 'primary'}
            >
                <p><strong>{request.requestId}</strong> will be marked <strong>{pendingDecision}</strong>. Production must repeat permission and conflict-of-interest checks on the server.</p>
                {remarks.trim() && <p className='mt-2 rounded-md bg-[var(--erp-canvas)] p-2'>Remarks: {remarks.trim()}</p>}
            </ConfirmAction>
        </section>
    )
}

export default ViewApproval
