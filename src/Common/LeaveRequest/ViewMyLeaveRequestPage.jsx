import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import FeedbackState from '../ui/FeedbackState'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import StatusBadge from '../ui/StatusBadge'
import Surface from '../ui/Surface'
import WorkflowContextBar from '../ui/WorkflowContextBar'
import WorkflowTimeline from '../ui/WorkflowTimeline'
import { buildWorkflowEvents, getWorkflowState } from '../ui/workflow'
import { canSubmitterAccessRequest, getLeaveRequestById } from './leaveRequestData'
import { getLeaveRoutes, resolveRoleKey } from './leaveRequestConfigs'

const Field = ({ label, value }) => (
    <div>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[var(--erp-ink)]'>{value || '—'}</dd>
    </div>
)

const getSubmitterNextAction = (request) => {
    if (request.status === 'Pending') return `Await decision from ${request.requestedTo}`
    if (request.status === 'Rejected') return 'Review remarks; appeals require the case service'
    return 'No action required'
}

export default function ViewMyLeaveRequestPage({ roleKey: roleKeyProp }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role: authRole } = useAuth()
    const roleKey = resolveRoleKey(authRole || roleKeyProp)
    const routes = getLeaveRoutes(roleKey)
    const request = getLeaveRequestById(id)
    const isOwnRequest = canSubmitterAccessRequest(request, roleKey)

    if (!request || !isOwnRequest) {
        return (
            <section className='space-y-5'>
                <button type='button' onClick={() => navigate(routes.myList)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--erp-ink)]'>
                    <ArrowLeft aria-hidden='true' size={17} /> Back to requests
                </button>
                <FeedbackState kind='permission' title='Leave request unavailable' description='This request does not exist or is outside your role scope.' />
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
                description={`${request.leaveType} request sent to ${request.requestedTo}.`}
                status={workflowState.key}
                actions={(
                    <button type='button' onClick={() => navigate(routes.myList)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--erp-ink)]'>
                        <ArrowLeft aria-hidden='true' size={17} /> Back to requests
                    </button>
                )}
                meta={<StatusBadge status={request.status} label={`Recorded status: ${request.status}`} />}
            />

            <IntegrationNotice
                state='demo'
                title='Browser-stored leave workflow'
                description='This decision trail is saved only in this browser. Notification delivery and the production leave API are not connected.'
            />

            <WorkflowContextBar
                owner={request.requestedTo}
                due={`${request.fromDate} to ${request.toDate}`}
                nextAction={getSubmitterNextAction(request)}
            />

            <div className='grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]'>
                <Surface title='Request details' description='Dates and reason recorded when the request was submitted.' contentClassName='p-4 sm:p-5'>
                    <dl className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                        <Field label='Leave type' value={request.leaveType} />
                        <Field label='From date' value={request.fromDate} />
                        <Field label='To date' value={request.toDate} />
                        <Field label='Total days' value={String(request.totalDays)} />
                        <Field label='Applied date' value={request.appliedDate} />
                        <Field label='Decision owner' value={request.requestedTo} />
                        <div className='sm:col-span-2 lg:col-span-3'><Field label='Reason' value={request.reason} /></div>
                        {request.approverRemarks && <div className='sm:col-span-2 lg:col-span-3'><Field label='Approver remarks' value={request.approverRemarks} /></div>}
                    </dl>
                </Surface>
                <WorkflowTimeline events={timelineEvents} description='Only timestamps present in the stored request are shown.' />
            </div>

            {workflowState.terminal && (
                <IntegrationNotice
                    state='disconnected'
                    title='Complaint and reopen service not connected'
                    description='The documented complaint or reopen path requires backend case routing and permission checks. This screen does not simulate that action.'
                />
            )}
        </section>
    )
}

