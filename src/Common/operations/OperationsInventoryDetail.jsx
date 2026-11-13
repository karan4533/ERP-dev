import { AlertTriangle, Boxes, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FeedbackState, IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'
import { getInventoryHealth } from './operationsInventoryState.js'

const DetailField = ({ label, value, className = '' }) => (
    <div className={`min-w-0 rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3 ${className}`}>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-[var(--erp-ink)]'>{value || 'Not recorded'}</dd>
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

const OperationsInventoryDetail = ({ item, backPath, itemLabel = 'Item', showCost = false }) => {
    if (!item) {
        return (
            <section className='space-y-5'>
                <PageHeader title='Inventory item unavailable' description='The requested catalogue record could not be resolved.' actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to inventory</Link>} />
                <FeedbackState kind='empty' title='Inventory item not found' description='The identifier may be invalid, or the item is not included in this reference dataset.' action={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white'>Return to inventory</Link>} />
            </section>
        )
    }

    const health = getInventoryHealth(item)
    const needsReorder = health.status !== 'Available'
    const HealthIcon = needsReorder ? AlertTriangle : PackageCheck

    return (
        <section className='space-y-5'>
            <PageHeader
                title={item.name}
                description={`${item.id}${item.category ? ` · ${item.category}` : ''}`}
                status={health.status}
                actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to inventory</Link>}
            />

            <IntegrationNotice
                state='demo'
                title='Reference inventory record'
                description='Stock, supplier and invoice values are seeded frontend data. Authoritative balances, reservations, movements, valuation, batch history and document verification require the inventory backend.'
            />

            <Surface className='overflow-hidden'>
                <div className='grid lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)]'>
                    <div className='flex min-h-48 flex-col justify-between bg-[var(--erp-ink)] p-5 text-white sm:p-7'>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <p className='text-sm text-white/70'>Available quantity</p>
                                <p className='mt-2 text-4xl font-semibold tracking-tight sm:text-5xl'>{health.quantity}</p>
                                <p className='mt-1 text-sm text-white/75'>{item.unit}</p>
                            </div>
                            <span className='rounded-xl bg-white/10 p-3'><Boxes aria-hidden='true' size={24} /></span>
                        </div>
                        <p className='mt-6 max-w-xl text-sm leading-6 text-white/75'>Opening and reference balances are shown for planning only. Confirm available-to-issue quantity against reservations and posted movements in the connected stock ledger.</p>
                    </div>
                    <div className='space-y-4 p-5 sm:p-7'>
                        <div className='flex items-start gap-3'>
                            <span className='rounded-lg bg-[var(--erp-canvas)] p-2 text-[var(--erp-primary)]'><HealthIcon aria-hidden='true' size={20} /></span>
                            <div>
                                <p className='text-sm font-semibold text-[var(--erp-ink)]'>Stock position</p>
                                <div className='mt-1'><StatusBadge status={health.status} /></div>
                            </div>
                        </div>
                        <dl className='grid grid-cols-2 gap-3'>
                            <DetailField label='Reorder level' value={`${health.reorderLevel} ${item.unit}`} />
                            <DetailField label='Gap to threshold' value={health.shortage ? `${health.shortage} ${item.unit}` : 'No gap'} />
                        </dl>
                        <p className='text-sm text-[var(--erp-slate)]'>{needsReorder ? `Replenish at least ${health.shortage || health.reorderLevel} ${item.unit} and confirm pending issues before release.` : 'Stock is above the recorded reorder threshold.'}</p>
                    </div>
                </div>
            </Surface>

            <Section title={`${itemLabel} identity`} description='Catalogue information used during stock issue and replenishment.'>
                <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                    <DetailField label={`${itemLabel} ID`} value={item.id} />
                    {item.code && <DetailField label={`${itemLabel} code`} value={item.code} />}
                    <DetailField label='Category' value={item.category} />
                    <DetailField label='Description' value={item.description} className='sm:col-span-2 xl:col-span-3' />
                </dl>
            </Section>

            <Section title='Stock and valuation' description='Reference quantities and optional cost context.'>
                <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                    <DetailField label='Available quantity' value={health.quantity} />
                    <DetailField label='Stock unit' value={item.unit} />
                    <DetailField label='Reorder level' value={health.reorderLevel} />
                    <DetailField label='Derived status' value={health.status} />
                    {showCost && <DetailField label='Unit cost' value={item.unitCost} />}
                    {showCost && <DetailField label='Reference stock value' value={item.stockValue} />}
                </dl>
            </Section>

            <Section title='Supplier and purchase context' description='Supplier and invoice metadata require backend verification before procurement or payment use.'>
                <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                    <DetailField label='Supplier name' value={item.supplier} />
                    <DetailField label='Supplier contact' value={item.supplierContact} />
                    <DetailField label='Purchase date' value={item.purchaseDate} />
                    {item.lastPurchaseDate && <DetailField label='Last purchase date' value={item.lastPurchaseDate} />}
                    <DetailField label='Invoice number' value={item.invoiceNumber} />
                </dl>
            </Section>
        </section>
    )
}

export default OperationsInventoryDetail
