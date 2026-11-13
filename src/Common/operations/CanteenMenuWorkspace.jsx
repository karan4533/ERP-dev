import { useMemo, useState } from 'react'
import { ClipboardCheck, Save, Send, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dialog, FormField, IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'
import {
    createEmptyCanteenMenuItem,
    getMenuReadiness,
    validateCanteenMenuItem,
} from './canteenOperationsState.js'

const controlClass = 'min-h-11 w-full rounded-lg border border-[var(--erp-line)] bg-white px-3 py-2.5 text-sm text-[var(--erp-ink)] outline-none transition focus:border-[var(--erp-primary)] focus:ring-2 focus:ring-[color:var(--erp-primary-soft)]'

const loadDraft = (storageKey, emptyItem) => {
    try {
        const stored = window.localStorage.getItem(storageKey)
        if (!stored) return { item: emptyItem, message: '' }
        return { item: { ...emptyItem, ...JSON.parse(stored) }, message: 'A browser menu draft was restored.' }
    } catch {
        return { item: emptyItem, message: 'The previous menu draft could not be restored.' }
    }
}

const ReviewField = ({ label, value }) => (
    <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 break-words text-sm font-semibold text-[var(--erp-ink)]'>{value === 0 ? 0 : value || 'Not provided'}</dd>
    </div>
)

const CanteenMenuWorkspace = ({ backPath, storageKey }) => {
    const emptyItem = useMemo(() => createEmptyCanteenMenuItem(), [])
    const [initialState] = useState(() => loadDraft(storageKey, emptyItem))
    const [item, setItem] = useState(initialState.item)
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState(initialState.message)
    const [reviewOpen, setReviewOpen] = useState(false)
    const readiness = getMenuReadiness(item)

    const updateField = (field, value) => {
        setItem((current) => ({ ...current, [field]: value }))
        setErrors((current) => {
            if (!current[field]) return current
            const next = { ...current }
            delete next[field]
            return next
        })
        setMessage('')
    }

    const saveDraft = () => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(item))
            setMessage('Draft saved in this browser. The live menu has not changed.')
        } catch {
            setMessage('This browser could not save the draft. Copy important information before leaving.')
        }
    }

    const reviewItem = (event) => {
        event.preventDefault()
        const nextErrors = validateCanteenMenuItem(item)
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length) {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
            })
            return
        }
        setReviewOpen(true)
    }

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Create menu item'
                description='Prepare pricing, service availability and food-safety information for a canteen item.'
                status={readiness}
                actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to menu</Link>}
            />
            <IntegrationNotice state='disconnected' title='Menu catalogue API pending' description='You can validate, review and save a browser draft. Publishing, item-code uniqueness, pricing history and audit evidence require the canteen backend.' />
            {message && <p role='status' className='rounded-lg border border-[var(--erp-line)] bg-white px-4 py-3 text-sm text-[var(--erp-slate)]'>{message}</p>}

            <form className='space-y-5' onSubmit={reviewItem} noValidate>
                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                        <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Catalogue identity</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Use a stable code and a numeric base price.</p></div>
                        <span className='rounded-xl bg-[var(--erp-primary-soft)] p-3 text-[var(--erp-primary)]'><Utensils aria-hidden='true' size={21} /></span>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Item name' error={errors.itemName} required><input className={controlClass} value={item.itemName} onChange={(event) => updateField('itemName', event.target.value)} placeholder='e.g. Vegetable poha' /></FormField>
                        <FormField label='Category' error={errors.category} required><select className={controlClass} value={item.category} onChange={(event) => updateField('category', event.target.value)}><option value=''>Select category</option>{['Breakfast', 'Lunch', 'Snacks', 'Beverages'].map((category) => <option key={category} value={category}>{category}</option>)}</select></FormField>
                        <FormField label='Item code' error={errors.itemCode} hint='Uniqueness must be confirmed by the backend.' required><input className={controlClass} value={item.itemCode} onChange={(event) => updateField('itemCode', event.target.value.toUpperCase())} placeholder='e.g. BF-POH-007' /></FormField>
                        <FormField label='Price (₹)' error={errors.price} required><input type='number' min='0.01' step='0.01' className={controlClass} value={item.price} onChange={(event) => updateField('price', event.target.value)} placeholder='0.00' /></FormField>
                        <FormField label='Item format'><select className={controlClass} value={item.isCombo} onChange={(event) => updateField('isCombo', event.target.value)}><option value='No'>Single item</option><option value='Yes'>Combo</option></select></FormField>
                        <FormField label='Record status'><select className={controlClass} value={item.status} onChange={(event) => updateField('status', event.target.value)}><option value='Active'>Active</option><option value='Inactive'>Inactive</option></select></FormField>
                        {item.isCombo === 'Yes' && <FormField label='Combo contents' error={errors.comboContents} className='md:col-span-2 xl:col-span-3' required><textarea className={`${controlClass} min-h-24 resize-y`} value={item.comboContents} onChange={(event) => updateField('comboContents', event.target.value)} placeholder='List each included item and portion.' /></FormField>}
                        <FormField label='Description' className='md:col-span-2 xl:col-span-3'><textarea className={`${controlClass} min-h-24 resize-y`} value={item.description} onChange={(event) => updateField('description', event.target.value)} placeholder='Preparation or service notes visible to canteen operators.' /></FormField>
                    </div>
                </Surface>

                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Food safety and service</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Record information staff need before offering the item.</p></div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Dietary classification' error={errors.dietaryType} required><select className={controlClass} value={item.dietaryType} onChange={(event) => updateField('dietaryType', event.target.value)}><option value=''>Select classification</option>{['Vegetarian', 'Vegan', 'Contains egg', 'Non-vegetarian'].map((type) => <option key={type} value={type}>{type}</option>)}</select></FormField>
                        <FormField label='Service availability'><select className={controlClass} value={item.availability} onChange={(event) => updateField('availability', event.target.value)}><option value='Available'>Available</option><option value='Out of Stock'>Out of stock</option></select></FormField>
                        <FormField label='Allergen declaration' error={errors.allergenDeclaration} hint='Enter “None declared” when no known allergens are recorded.' className='md:col-span-2 xl:col-span-3' required><textarea className={`${controlClass} min-h-24 resize-y`} value={item.allergenDeclaration} onChange={(event) => updateField('allergenDeclaration', event.target.value)} placeholder='e.g. Contains milk and peanuts' /></FormField>
                    </div>
                </Surface>

                <div className='sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-xl border border-[var(--erp-line)] bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end'>
                    <Link to={backPath} className='inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Cancel</Link>
                    <button type='button' onClick={saveDraft} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--erp-primary)] px-4 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'><Save aria-hidden='true' size={17} /> Save browser draft</button>
                    <button type='submit' className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white hover:opacity-90'><ClipboardCheck aria-hidden='true' size={17} /> Review menu item</button>
                </div>
            </form>

            <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} title='Review menu item' description='Verify price, availability and safety information before connecting catalogue publishing.' size='lg' footer={<><button type='button' onClick={() => setReviewOpen(false)} className='min-h-10 rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)]'>Return to form</button><button type='button' disabled className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white opacity-50'><Send aria-hidden='true' size={16} /> API publishing unavailable</button></>}>
                <IntegrationNotice state='disconnected' title='Menu item not published' description='The final action remains disabled until authenticated menu catalogue and audit APIs are connected.' />
                <dl className='mt-4 grid gap-3 sm:grid-cols-2'><ReviewField label='Item' value={item.itemName} /><ReviewField label='Item code' value={item.itemCode} /><ReviewField label='Category' value={item.category} /><ReviewField label='Price' value={`₹${Number(item.price).toLocaleString('en-IN')}`} /><ReviewField label='Dietary class' value={item.dietaryType} /><ReviewField label='Allergens' value={item.allergenDeclaration} /><ReviewField label='Availability' value={item.availability} /><ReviewField label='Status' value={item.status} />{item.isCombo === 'Yes' && <ReviewField label='Combo contents' value={item.comboContents} />}</dl>
            </Dialog>
        </section>
    )
}

export default CanteenMenuWorkspace
