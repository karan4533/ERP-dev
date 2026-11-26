import { AlertTriangle, IndianRupee, ShieldCheck, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FeedbackState, IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'

const DetailField = ({ label, value, className = '' }) => (
    <div className={`min-w-0 rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3 ${className}`}>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-[var(--erp-ink)]'>{value === 0 ? 0 : value || 'Not recorded'}</dd>
    </div>
)

const Section = ({ title, description, children }) => (
    <Surface className='space-y-4 p-4 sm:p-6'><div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>{title}</h2>{description && <p className='mt-1 text-sm text-[var(--erp-muted)]'>{description}</p>}</div>{children}</Surface>
)

const CanteenMenuDetail = ({ item, backPath }) => {
    if (!item) {
        return <section className='space-y-5'><PageHeader title='Menu item unavailable' description='The requested catalogue record could not be resolved.' actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)]'>Back to menu</Link>} /><FeedbackState kind='empty' title='Menu item not found' description='The identifier may be invalid, or the item is not included in this reference dataset.' action={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white'>Return to menu</Link>} /></section>
    }

    const hasSafetyData = Boolean(item.dietaryType && item.allergenDeclaration)

    return (
        <section className='space-y-5'>
            <PageHeader title={item.itemName} description={`${item.menuId} · ${item.itemCode}`} status={item.status} actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to menu</Link>} />
            <IntegrationNotice state='demo' title='Reference menu record' description='Catalogue, price and availability values are seeded frontend data. Publishing history, stock linkage and authoritative allergen verification require the canteen backend.' />

            <Surface className='overflow-hidden'>
                <div className='grid lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)]'>
                    <div className='flex min-h-48 flex-col justify-between bg-[var(--erp-ink)] p-5 text-white sm:p-7'>
                        <div className='flex items-start justify-between gap-4'><div><p className='text-sm text-white/70'>Current listed price</p><p className='mt-2 text-4xl font-semibold tracking-tight sm:text-5xl'>{item.price}</p><p className='mt-2 text-sm text-white/75'>{item.category} · {item.isCombo === 'Yes' ? 'Combo' : 'Single item'}</p></div><span className='rounded-xl bg-white/10 p-3'><IndianRupee aria-hidden='true' size={24} /></span></div>
                        <p className='mt-6 max-w-xl text-sm leading-6 text-white/75'>Confirm the active price, recipe availability and food-safety declaration before offering this item.</p>
                    </div>
                    <div className='space-y-5 p-5 sm:p-7'>
                        <div className='flex items-start gap-3'><span className='rounded-lg bg-[var(--erp-canvas)] p-2 text-[var(--erp-primary)]'><Utensils aria-hidden='true' size={20} /></span><div><p className='text-sm font-semibold text-[var(--erp-ink)]'>Service position</p><div className='mt-1'><StatusBadge status={item.availability} /></div></div></div>
                        <div className='flex items-start gap-3'><span className={`rounded-lg p-2 ${hasSafetyData ? 'bg-[#EAF7EF] text-[#176B3A]' : 'bg-[#FFF4D6] text-[#7A3E00]'}`}>{hasSafetyData ? <ShieldCheck aria-hidden='true' size={20} /> : <AlertTriangle aria-hidden='true' size={20} />}</span><div><p className='text-sm font-semibold text-[var(--erp-ink)]'>{hasSafetyData ? 'Safety context recorded' : 'Safety context incomplete'}</p><p className='mt-1 text-sm text-[var(--erp-slate)]'>{hasSafetyData ? 'Dietary and allergen fields are present in this reference record.' : 'Dietary classification and allergen declaration are missing from the legacy dataset.'}</p></div></div>
                    </div>
                </div>
            </Surface>

            <Section title='Catalogue identity' description='Stable identifiers and operational status.'><dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'><DetailField label='Menu ID' value={item.menuId} /><DetailField label='Item code' value={item.itemCode} /><DetailField label='Category' value={item.category} /><DetailField label='Record status' value={item.status} /><DetailField label='Description' value={item.description} className='sm:col-span-2 xl:col-span-4' /></dl></Section>
            <Section title='Food safety and composition' description='Legacy gaps are shown explicitly and must be completed before authoritative publishing.'><dl className='grid grid-cols-1 gap-3 sm:grid-cols-2'><DetailField label='Dietary classification' value={item.dietaryType} /><DetailField label='Allergen declaration' value={item.allergenDeclaration} /><DetailField label='Item format' value={item.isCombo === 'Yes' ? 'Combo' : 'Single item'} /><DetailField label='Combo contents' value={item.comboContents} /></dl></Section>
            <Section title='Audit information' description='Reference provenance supplied by the current frontend dataset.'><dl className='grid grid-cols-1 gap-3 sm:grid-cols-3'><DetailField label='Created by' value={item.createdBy} /><DetailField label='Created date' value={item.createdDate} /><DetailField label='Last updated' value={item.lastUpdated} /></dl></Section>
        </section>
    )
}

export default CanteenMenuDetail
