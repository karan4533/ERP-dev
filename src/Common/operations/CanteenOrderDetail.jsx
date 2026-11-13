import { Printer, ReceiptText, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FeedbackState, IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'

const DetailField = ({ label, value, className = '' }) => (
    <div className={`min-w-0 rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3 ${className}`}><dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt><dd className='mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-[var(--erp-ink)]'>{value === 0 ? 0 : value || 'Not recorded'}</dd></div>
)

const Section = ({ title, description, children }) => <Surface className='space-y-4 p-4 sm:p-6'><div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>{title}</h2>{description && <p className='mt-1 text-sm text-[var(--erp-muted)]'>{description}</p>}</div>{children}</Surface>

const CanteenOrderDetail = ({ order, backPath }) => {
    if (!order) {
        return <section className='space-y-5'><PageHeader title='Order unavailable' description='The requested canteen record could not be resolved.' actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)]'>Back to orders</Link>} /><FeedbackState kind='empty' title='Order not found' description='The identifier may be invalid, or the order is not included in this reference dataset.' action={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white'>Return to orders</Link>} /></section>
    }

    return (
        <section className='space-y-5'>
            <PageHeader title={order.orderId} description={`${order.customerName} · ${order.orderDateTime}`} status={order.orderStatus} actions={<><Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to orders</Link><button type='button' onClick={() => window.print()} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-3 text-sm font-semibold text-white hover:opacity-90'><Printer aria-hidden='true' size={16} /> Print record</button></>} />
            <IntegrationNotice state='demo' title='Reference order record' description='Customer, payment and item values are seeded frontend data. Payment authorization, wallet evidence, stock consumption, refunds and fiscal receipt numbering require backend services.' />

            <Surface className='overflow-hidden'>
                <div className='grid lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)]'>
                    <div className='flex min-h-48 flex-col justify-between bg-[var(--erp-ink)] p-5 text-white sm:p-7'><div className='flex items-start justify-between gap-4'><div><p className='text-sm text-white/70'>Recorded total</p><p className='mt-2 text-4xl font-semibold tracking-tight sm:text-5xl'>{order.totalAmount}</p><p className='mt-2 text-sm text-white/75'>{order.itemsCount} item{Number(order.itemsCount) === 1 ? '' : 's'} · {order.paymentMethod}</p></div><span className='rounded-xl bg-white/10 p-3'><ReceiptText aria-hidden='true' size={24} /></span></div><p className='mt-6 max-w-xl text-sm leading-6 text-white/75'>Treat this as an operational reference only until payment and receipt evidence is available from the connected backend.</p></div>
                    <div className='space-y-5 p-5 sm:p-7'><div><p className='text-sm font-semibold text-[var(--erp-ink)]'>Order state</p><div className='mt-2'><StatusBadge status={order.orderStatus} /></div></div><div><p className='text-sm font-semibold text-[var(--erp-ink)]'>Payment state</p><div className='mt-2'><StatusBadge status={order.paymentStatus} /></div></div><div className='flex items-start gap-3'><span className='rounded-lg bg-[var(--erp-canvas)] p-2 text-[var(--erp-primary)]'><UserRound aria-hidden='true' size={20} /></span><div><p className='text-sm font-semibold text-[var(--erp-ink)]'>{order.customerName}</p><p className='mt-1 text-sm text-[var(--erp-slate)]'>{order.customerId} · {order.customerType}</p></div></div></div>
                </div>
            </Surface>

            <Section title='Ordered items' description='Line quantities and prices are not available in the legacy reference dataset.'><ol className='divide-y divide-[var(--erp-line)] rounded-xl border border-[var(--erp-line)]'>{order.items.map((item, index) => <li key={`${item}-${index}`} className='flex items-center gap-3 px-4 py-3'><span className='inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--erp-primary-soft)] text-xs font-semibold text-[var(--erp-primary)]'>{index + 1}</span><span className='text-sm font-semibold text-[var(--erp-ink)]'>{item}</span></li>)}</ol></Section>
            <Section title='Customer and fulfilment' description='Identity and handover context held by this frontend record.'><dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'><DetailField label='Customer name' value={order.customerName} /><DetailField label='Customer ID' value={order.customerId} /><DetailField label='Customer type' value={order.customerType} /><DetailField label='Class / department' value={order.classOrDepartment} /><DetailField label='Order date and time' value={order.orderDateTime} /><DetailField label='Expected ready time' value={order.expectedReadyTime} /></dl></Section>
            <Section title='Payment and audit boundary' description='Display state is not proof of capture, settlement or refund eligibility.'><dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'><DetailField label='Total amount' value={order.totalAmount} /><DetailField label='Payment method' value={order.paymentMethod} /><DetailField label='Payment status' value={order.paymentStatus} /><DetailField label='Order status' value={order.orderStatus} /></dl></Section>
        </section>
    )
}

export default CanteenOrderDetail
