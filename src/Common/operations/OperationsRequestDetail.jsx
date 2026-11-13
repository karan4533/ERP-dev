import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
    FeedbackState,
    IntegrationNotice,
    PageHeader,
    StatusBadge,
    Surface,
    WorkflowContextBar,
} from '../ui'

const DetailField = ({ label, value, className = '' }) => (
    <div className={`min-w-0 rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3 ${className}`}>
        <dt className='text-xs font-medium uppercase tracking-wide text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[var(--erp-ink)]'>{value || 'Not recorded'}</dd>
    </div>
)

const Section = ({ title, description, children }) => (
    <Surface className='space-y-4 p-4 sm:p-6'>
        <div>
            <h2 className='text-base font-semibold text-[var(--erp-ink)]'>{title}</h2>
            {description && <p className='mt-1 text-sm text-[var(--erp-muted)]'>{description}</p>}
        </div>
        {children}
    </Surface>
)

const getNextAction = (request) => {
    if (request.status === 'Approved') return 'Proceed only after authoritative approval is confirmed'
    if (request.status === 'Rejected') return 'Review decision rationale in the approval service'
    return `Awaiting ${request.currentStage || request.sentTo || 'assigned reviewer'}`
}

const OperationsRequestDetail = ({ request, backPath, workflowStages = [] }) => {
    if (!request) {
        return (
            <section className='space-y-5'>
                <PageHeader title='Request unavailable' description='The requested operations record could not be resolved.' actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to requests</Link>} />
                <FeedbackState
                    kind='empty'
                    title='Request not found'
                    description='The identifier may be invalid, or the record is not included in this reference dataset.'
                    action={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white'>Return to request list</Link>}
                />
            </section>
        )
    }

    const currentStage = request.currentStage || request.sentTo
    const estimatedAmount = request.estimatedAmount || request.requestedAmount || request.amount
    const stages = workflowStages.length
        ? workflowStages
        : [request.department, currentStage, 'Finance review', 'Approved / Rejected'].filter(Boolean)

    return (
        <section className='space-y-5'>
            <PageHeader
                title={request.requestId}
                description={request.title}
                status={request.status}
                context={`${request.department || 'Operations'} request`}
                actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to requests</Link>}
                meta={<div className='flex flex-wrap gap-2'><StatusBadge status={request.priority} label={`${request.priority || 'Not set'} priority`} />{currentStage && <StatusBadge status='In Progress' label={currentStage} />}</div>}
            />

            <IntegrationNotice
                state='demo'
                title='Reference request record'
                description='This page presents seeded frontend data. Authoritative approval history, budget reservations, uploaded documents, reviewer identity and immutable audit evidence require the request backend.'
            />

            <WorkflowContextBar
                owner={currentStage}
                due={request.requiredByDate}
                priority={request.priority}
                nextAction={getNextAction(request)}
            />

            <Section title='Request information' description='Operational scope and requested timing.'>
                <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                    <DetailField label='Request ID' value={request.requestId} />
                    <DetailField label='Request type' value={request.requestType} />
                    <DetailField label='Submitted date' value={request.submittedDate} />
                    {request.requiredByDate && <DetailField label='Required by date' value={request.requiredByDate} />}
                    {request.approvalDate && <DetailField label='Approval date' value={request.approvalDate} />}
                    <DetailField label='Description' value={request.description} className='sm:col-span-2 xl:col-span-3' />
                </dl>
            </Section>

            {request.lineItems?.length > 0 && (
                <Section title='Line items' description='Item estimates recorded with this reference request.'>
                    <ul className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                        {request.lineItems.map((lineItem, index) => (
                            <li key={`${lineItem.item}-${index}`} className='rounded-xl border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-4'>
                                <p className='text-sm font-semibold text-[var(--erp-ink)]'>{lineItem.item}</p>
                                <dl className='mt-3 grid grid-cols-2 gap-3'>
                                    <div><dt className='text-xs text-[var(--erp-muted)]'>Quantity</dt><dd className='mt-1 text-sm font-medium text-[var(--erp-ink)]'>{lineItem.quantity}</dd></div>
                                    <div><dt className='text-xs text-[var(--erp-muted)]'>Estimated cost</dt><dd className='mt-1 text-sm font-medium text-[var(--erp-ink)]'>{lineItem.estimatedCost || 'Not recorded'}</dd></div>
                                </dl>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            <Section title='Financial and supplier context' description='Amounts remain estimates until the finance service validates and reserves a budget.'>
                <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                    <DetailField label='Estimated amount' value={estimatedAmount} />
                    <DetailField label='Budget category' value={request.budgetCategory} />
                    <DetailField label='Vendor name' value={request.vendor} />
                    {request.vendorContact && <DetailField label='Vendor contact' value={request.vendorContact} />}
                </dl>
            </Section>

            <Section title='Approval route' description='Stages show the intended workflow and current reference state; they are not a server audit trail.'>
                <ol className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                    {stages.map((stage, index) => {
                        const isCurrent = stage === currentStage
                        const isDecision = index === stages.length - 1 && ['Approved', 'Rejected'].includes(request.status)
                        return (
                            <li key={`${stage}-${index}`} className='rounded-xl border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-4'>
                                <div className='flex items-start justify-between gap-2'>
                                    <span className='text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>Stage {index + 1}</span>
                                    {(isCurrent || isDecision) && <StatusBadge status={isDecision ? request.status : 'In Progress'} label={isDecision ? request.status : 'Current'} />}
                                </div>
                                <p className='mt-2 text-sm font-semibold text-[var(--erp-ink)]'>{stage}</p>
                            </li>
                        )
                    })}
                </ol>
                <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                    <DetailField label='Requested by' value={request.requestedBy} />
                    <DetailField label='Department' value={request.department} />
                    <DetailField label='Current owner' value={currentStage} />
                    <DetailField label='Reference status' value={request.status} />
                </dl>
            </Section>

            {request.attachments?.length > 0 && (
                <Section title='Attachment metadata' description='File names are reference metadata only; document download and integrity verification are not connected.'>
                    <ul className='grid gap-2 sm:grid-cols-2'>
                        {request.attachments.map((file) => (
                            <li key={file} className='flex min-w-0 items-center gap-3 rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3 text-sm text-[var(--erp-ink)]'>
                                <FileText aria-hidden='true' className='shrink-0 text-[var(--erp-primary)]' size={18} />
                                <span className='min-w-0 break-all'>{file}</span>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </section>
    )
}

export default OperationsRequestDetail
