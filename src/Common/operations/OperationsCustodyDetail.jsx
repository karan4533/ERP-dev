import { Link } from 'react-router-dom'
import { FeedbackState, IntegrationNotice, PageHeader, StatusBadge, Surface, WorkflowContextBar } from '../ui'

const Field = ({ label, value, className = '' }) => (
    <div className={`rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3 ${className}`}><dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt><dd className='mt-1 break-words text-sm font-semibold text-[var(--erp-ink)]'>{value ?? 'Not recorded'}</dd></div>
)

const OperationsCustodyDetail = ({ record, backPath }) => {
    if (!record) return <section className='space-y-5'><PageHeader title='Custody record unavailable' description='The requested issue or return could not be resolved.' actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)]'>Back to custody log</Link>} /><FeedbackState kind='empty' title='Custody record not found' description='The identifier may be invalid, or the record is not included in this reference dataset.' action={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white'>Return to custody log</Link>} /></section>

    const eventDate = record.activityType === 'Return' ? record.returnDate : record.issueDate
    const nextAction = record.activityType === 'Return' ? 'Verify returned condition and stock receipt' : 'Confirm custody and available-to-issue balance'

    return (
        <section className='space-y-5'>
            <PageHeader title={record.id} description={`${record.itemName} · ${record.requestedBy}`} status={record.status} context={`${record.activityType} custody record`} actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)]'>Back to custody log</Link>} meta={<StatusBadge status={record.activityType} />} />
            <IntegrationNotice state='demo' title='Reference custody record' description='This record is seeded frontend data. Authoritative stock movements, employee identity, handover evidence, condition photos and immutable audit history require the inventory backend.' />
            <WorkflowContextBar owner={`${record.requestedBy} (${record.employeeId})`} due={eventDate} priority={record.activityType} nextAction={nextAction} />
            <Surface className='space-y-4 p-4 sm:p-6'>
                <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Custody summary</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Who holds the item, what moved and why.</p></div>
                <dl className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'><Field label='Employee name' value={record.requestedBy} /><Field label='Employee ID' value={record.employeeId} /><Field label='Department' value={record.department} /><Field label='Item' value={record.itemName} /><Field label='Quantity' value={record.quantity} /><Field label='Reference status' value={record.status} /><Field label='Remarks' value={record.remarks} className='sm:col-span-2 xl:col-span-3' /></dl>
            </Surface>
            {record.activityType === 'Issue' ? (
                <Surface className='space-y-4 p-4 sm:p-6'><div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Issue evidence</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Reference balance and purpose recorded when stock was issued.</p></div><dl className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'><Field label='Issue date' value={record.issueDate} /><Field label='Available stock at issue' value={record.availableStock} /><Field label='Purpose' value={record.purpose} /></dl></Surface>
            ) : (
                <Surface className='space-y-4 p-4 sm:p-6'><div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Return evidence</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>The return must reconcile to its original issue in the connected ledger.</p></div><dl className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'><Field label='Original issue reference' value={record.originalIssueRef} /><Field label='Original issue date' value={record.issueDate} /><Field label='Return date' value={record.returnDate} /><Field label='Returned condition' value={record.condition} /></dl></Surface>
            )}
        </section>
    )
}

export default OperationsCustodyDetail
