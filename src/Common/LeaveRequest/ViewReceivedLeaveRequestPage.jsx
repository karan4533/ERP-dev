import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import ConfirmAction from '../ui/ConfirmAction'
import FeedbackState from '../ui/FeedbackState'
import FormField from '../ui/FormField'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import Surface from '../ui/Surface'
import WorkflowContextBar from '../ui/WorkflowContextBar'
import WorkflowTimeline from '../ui/WorkflowTimeline'
import { buildWorkflowEvents, getWorkflowState } from '../ui/workflow'
import {
    canApproverAccessRequest,
    getLeaveRequestById,
    updateLeaveRequestStatus,
} from './leaveRequestData'
import { APPROVER_DECISION_TITLES, getLeaveRoutes, resolveRoleKey } from './leaveRequestConfigs'

const Field = ({ label, value }) => (
    <div>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[var(--erp-ink)]'>{value || '—'}</dd>
    </div>
)

export default function ViewReceivedLeaveRequestPage({ roleKey: roleKeyProp }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role: authRole } = useAuth()
    const roleKey = resolveRoleKey(authRole || roleKeyProp)
    const routes = getLeaveRoutes(roleKey)
    const [request, setRequest] = useState(() => {
        const item = getLeaveRequestById(id)
        return canApproverAccessRequest(item, roleKey) ? item : null
    })
    const [approverRemarks, setApproverRemarks] = useState(request?.approverRemarks ?? '')
    const [pendingDecision, setPendingDecision] = useState('')
    const decisionTitle = APPROVER_DECISION_TITLES[roleKey] || 'Approver decision'

    const commitDecision = () => {
        const updated = updateLeaveRequestStatus(id, pendingDecision, approverRemarks, roleKey)
        if (!updated) {
            toast.error(`Unable to record the ${pendingDecision.toLowerCase()} decision.`)
            return
        }
        setRequest(updated)
        setPendingDecision('')
        toast.success(`Leave request ${pendingDecision.toLowerCase()}.`)
    }

    if (!request) {
        return (
            <section className='space-y-5'>
                <button type='button' onClick={() => navigate(routes.receivedList)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--erp-ink)]'>
                    <ArrowLeft aria-hidden='true' size={17} /> Back to approvals
                </button>
                <FeedbackState kind='permission' title='Leave request unavailable' description='This request does not exist or is outside your approval scope.' />
            </section>
        )
    }

    const workflowState = getWorkflowState(request.status)
    const timelineEvents = buildWorkflowEvents({
        status: request.status,
        submittedLabel: 'Leave request submitted',
        submittedBy: request.requestedBy,
        submittedAt: request.appliedDate,
        owner: request.requestedTo,
        remarks: request.approverRemarks,
        decisionAt: request.decisionAt,
    })

    return (
        <section className='space-y-5'>
            <PageHeader
                title={request.leaveRequestId}
                description={`${request.requestedBy} · ${request.role}${request.department ? ` · ${request.department}` : ''}`}
                status={workflowState.key}
                context={request.status === 'Pending' ? 'Awaiting your decision' : `Decision recorded: ${request.status}`}
                actions={(
                    <button type='button' onClick={() => navigate(routes.receivedList)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--erp-ink)]'>
                        <ArrowLeft aria-hidden='true' size={17} /> Back to approvals
                    </button>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Browser-stored approval'
                description='Decisions are saved locally for this prototype. Staff notifications and the production leave API are not connected.'
            />

            <WorkflowContextBar
                owner={request.requestedTo}
                due={`${request.fromDate} to ${request.toDate}`}
                nextAction={request.status === 'Pending' ? 'Review details and record a decision' : 'Decision complete'}
            />

            <div className='grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]'>
                <div className='space-y-5'>
                    <Surface title='Request details' description='Verify the dates, requester and reason before deciding.' contentClassName='p-4 sm:p-5'>
                        <dl className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                            <Field label='Requested by' value={request.requestedBy} />
                            <Field label='Role' value={request.role} />
                            <Field label='Department' value={request.department} />
                            <Field label='Leave type' value={request.leaveType} />
                            <Field label='From date' value={request.fromDate} />
                            <Field label='To date' value={request.toDate} />
                            <Field label='Total days' value={String(request.totalDays)} />
                            <Field label='Applied date' value={request.appliedDate} />
                            <div className='sm:col-span-2 lg:col-span-3'><Field label='Reason' value={request.reason} /></div>
                        </dl>
                    </Surface>

                    {request.status === 'Pending' ? (
                        <Surface title={decisionTitle} description='Add context for the requester, then review the confirmation before recording your decision.' contentClassName='p-4 sm:p-5'>
                            <FormField id='approver-remarks' label='Decision remarks' hint='Remarks are shown to the requester and should explain the decision.'>
                                <textarea
                                    rows={4}
                                    value={approverRemarks}
                                    onChange={(event) => setApproverRemarks(event.target.value)}
                                    className='w-full rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 text-sm text-[var(--erp-ink)]'
                                    placeholder='Add concise approval or rejection context…'
                                />
                            </FormField>
                            <div className='mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                                <button type='button' onClick={() => setPendingDecision('Rejected')} className='min-h-10 rounded-lg border border-[var(--erp-red)] px-4 text-sm font-semibold text-[var(--erp-red)]'>Reject request</button>
                                <button type='button' onClick={() => setPendingDecision('Approved')} className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>Approve request</button>
                            </div>
                        </Surface>
                    ) : request.approverRemarks ? (
                        <Surface title='Decision remarks' contentClassName='p-4 sm:p-5'>
                            <p className='whitespace-pre-wrap text-sm text-[var(--erp-slate)]'>{request.approverRemarks}</p>
                        </Surface>
                    ) : null}
                </div>

                <WorkflowTimeline events={timelineEvents} description='Only timestamps present in the stored request are shown.' />
            </div>

            {workflowState.terminal && (
                <IntegrationNotice
                    state='disconnected'
                    title='Reopen and complaint routing not connected'
                    description='A production service must enforce who can reopen a decision, capture the reason and notify the next owner.'
                />
            )}

            <ConfirmAction
                open={Boolean(pendingDecision)}
                onClose={() => setPendingDecision('')}
                onConfirm={commitDecision}
                title={`${pendingDecision || 'Record'} leave request?`}
                description='This changes the request state for everyone using this browser demo.'
                confirmLabel={pendingDecision === 'Approved' ? 'Approve request' : 'Reject request'}
                tone={pendingDecision === 'Rejected' ? 'danger' : 'primary'}
            >
                <p>
                    {pendingDecision === 'Approved'
                        ? 'The request will be marked approved. Confirm that coverage and dates have been checked.'
                        : 'The request will be marked rejected. Add a clear remark so the requester understands the decision.'}
                </p>
            </ConfirmAction>
        </section>
    )
}

