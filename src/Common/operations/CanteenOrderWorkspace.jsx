import { useMemo, useState } from 'react'
import { ClipboardCheck, Save, Send, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dialog, FormField, IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'
import {
    calculateOrderPricing,
    createEmptyCanteenOrder,
    getOrderReadiness,
    validateCanteenOrder,
} from './canteenOperationsState.js'

const controlClass = 'min-h-11 w-full rounded-lg border border-[var(--erp-line)] bg-white px-3 py-2.5 text-sm text-[var(--erp-ink)] outline-none transition focus:border-[var(--erp-primary)] focus:ring-2 focus:ring-[color:var(--erp-primary-soft)]'

const loadDraft = (storageKey, emptyOrder, customers) => {
    try {
        const stored = window.localStorage.getItem(storageKey)
        if (!stored) return { order: emptyOrder, message: '' }
        const parsed = JSON.parse(stored)
        const customer = customers.find((entry) => entry.rfidCardNo === parsed.rfidCardNo) ?? null
        return { order: { ...emptyOrder, ...parsed, customer }, message: 'A browser order draft was restored.' }
    } catch {
        return { order: emptyOrder, message: 'The previous order draft could not be restored.' }
    }
}

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

const ReviewField = ({ label, value }) => (
    <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 break-words text-sm font-semibold text-[var(--erp-ink)]'>{value === 0 ? 0 : value || 'Not provided'}</dd>
    </div>
)

const CanteenOrderWorkspace = ({ backPath, storageKey, customers, menuItems }) => {
    const emptyOrder = useMemo(() => createEmptyCanteenOrder(), [])
    const [initialState] = useState(() => loadDraft(storageKey, emptyOrder, customers))
    const [order, setOrder] = useState(initialState.order)
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState(initialState.message)
    const [reviewOpen, setReviewOpen] = useState(false)
    const readiness = getOrderReadiness(order)
    const pricing = calculateOrderPricing(order.lines, menuItems)

    const clearError = (field) => setErrors((current) => {
        if (!current[field]) return current
        const next = { ...current }
        delete next[field]
        return next
    })

    const updateField = (field, value) => {
        setOrder((current) => ({ ...current, [field]: value }))
        clearError(field)
        setMessage('')
    }

    const updateRfid = (value) => {
        const normalized = value.trim()
        const customer = customers.find((entry) => entry.rfidCardNo === normalized) ?? null
        setOrder((current) => ({ ...current, rfidCardNo: value, customer }))
        clearError('rfidCardNo')
        setMessage('')
    }

    const toggleMenuItem = (menuId) => {
        setOrder((current) => ({
            ...current,
            lines: current.lines.some((line) => line.menuId === menuId)
                ? current.lines.filter((line) => line.menuId !== menuId)
                : [...current.lines, { menuId, quantity: 1 }],
        }))
        clearError('lines')
        setMessage('')
    }

    const updateQuantity = (menuId, quantity) => {
        setOrder((current) => ({ ...current, lines: current.lines.map((line) => line.menuId === menuId ? { ...line, quantity } : line) }))
        clearError('lines')
        setMessage('')
    }

    const saveDraft = () => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify({ ...order, customer: undefined }))
            setMessage('Draft saved in this browser. No order or payment has been created.')
        } catch {
            setMessage('This browser could not save the draft. Copy important information before leaving.')
        }
    }

    const reviewOrder = (event) => {
        event.preventDefault()
        const nextErrors = validateCanteenOrder(order)
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length) {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => document.querySelector('[aria-invalid="true"], [data-invalid="true"] input')?.focus())
            })
            return
        }
        setReviewOpen(true)
    }

    return (
        <section className='space-y-5'>
            <PageHeader title='Create canteen order' description='Identify the customer, build an itemized cart and review payment status before recording an order.' status={readiness} actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to orders</Link>} />
            <IntegrationNotice state='disconnected' title='Order and wallet APIs pending' description='You can validate, price, review and save a browser draft. RFID authorization, wallet balance, payment capture, inventory reservation and receipt numbering require backend services.' />
            {message && <p role='status' className='rounded-lg border border-[var(--erp-line)] bg-white px-4 py-3 text-sm text-[var(--erp-slate)]'>{message}</p>}

            <form className='space-y-5' onSubmit={reviewOrder} noValidate>
                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Customer verification</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Use an RFID identity supplied by the current reference dataset.</p></div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Customer RFID' error={errors.rfidCardNo} hint='Known demo cards: RFID-1001, RFID-1002 and RFID-2001.' required><input list='canteen-rfid-options' className={controlClass} value={order.rfidCardNo} onChange={(event) => updateRfid(event.target.value)} placeholder='Scan or enter RFID card number' /></FormField>
                        <datalist id='canteen-rfid-options'>{customers.map((customer) => <option key={customer.rfidCardNo} value={customer.rfidCardNo} />)}</datalist>
                        <ReviewField label='Customer name' value={order.customer?.name} />
                        <ReviewField label='Customer ID' value={order.customer?.customerId} />
                        <ReviewField label='Customer type' value={order.customer?.customerType} />
                        <ReviewField label='Class / department' value={order.customer?.classOrDepartment} />
                    </div>
                </Surface>

                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div className='flex flex-wrap items-start justify-between gap-3'><div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Itemized order</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Set the quantity independently for every selected menu item.</p></div><span className='rounded-xl bg-[var(--erp-primary-soft)] p-3 text-[var(--erp-primary)]'><ShoppingBasket aria-hidden='true' size={21} /></span></div>
                    <fieldset aria-describedby={errors.lines ? 'canteen-cart-error' : undefined} data-invalid={Boolean(errors.lines)} className='space-y-3'>
                        <legend className='sr-only'>Available menu items</legend>
                        {menuItems.map((menuItem) => {
                            const line = order.lines.find((entry) => entry.menuId === menuItem.id)
                            return <div key={menuItem.id} className={`grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center ${line ? 'border-[var(--erp-primary)] bg-[var(--erp-primary-soft)]' : 'border-[var(--erp-line)] bg-white'}`}><label className='flex cursor-pointer items-start gap-3'><input type='checkbox' checked={Boolean(line)} onChange={() => toggleMenuItem(menuItem.id)} className='mt-1 accent-[var(--erp-primary)]' /><span><span className='block text-sm font-semibold text-[var(--erp-ink)]'>{menuItem.name}</span><span className='mt-1 block text-sm text-[var(--erp-slate)]'>{formatCurrency(menuItem.price)} each</span></span></label>{line && <label className='text-xs font-medium text-[var(--erp-slate)]'>Quantity<input type='number' min='1' step='1' aria-label={`Quantity for ${menuItem.name}`} className={`${controlClass} mt-1`} value={line.quantity} onChange={(event) => updateQuantity(menuItem.id, event.target.value)} /></label>}</div>
                        })}
                        {errors.lines && <p id='canteen-cart-error' role='alert' className='text-xs font-medium text-[var(--erp-red)]'>{errors.lines}</p>}
                    </fieldset>
                </Surface>

                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Fulfilment and payment</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>These values are reviewed only; no payment is captured in this frontend.</p></div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Order type'><select className={controlClass} value={order.orderType} onChange={(event) => updateField('orderType', event.target.value)}><option value='Counter'>Counter</option><option value='Pre-Order'>Pre-order</option><option value='Event'>Event</option></select></FormField>
                        <FormField label='Expected ready time' error={errors.expectedReadyTime} required><input type='time' className={controlClass} value={order.expectedReadyTime} onChange={(event) => updateField('expectedReadyTime', event.target.value)} /></FormField>
                        <FormField label='Payment method'><select className={controlClass} value={order.paymentMethod} onChange={(event) => updateField('paymentMethod', event.target.value)}><option value='Cash'>Cash</option><option value='Wallet'>Wallet</option></select></FormField>
                        <FormField label='Payment status'><select className={controlClass} value={order.paymentStatus} onChange={(event) => updateField('paymentStatus', event.target.value)}><option value='Paid'>Paid</option><option value='Pending'>Pending</option></select></FormField>
                        <FormField label='Order status'><select className={controlClass} value={order.orderStatus} onChange={(event) => updateField('orderStatus', event.target.value)}><option value='Preparing'>Preparing</option><option value='Ready'>Ready</option><option value='Completed'>Completed</option></select></FormField>
                        <FormField label='Special instructions' className='md:col-span-2 xl:col-span-3'><textarea className={`${controlClass} min-h-24 resize-y`} value={order.specialInstructions} onChange={(event) => updateField('specialInstructions', event.target.value)} placeholder='Optional preparation or handover notes' /></FormField>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-3'><ReviewField label='Selected lines' value={pricing.lineCount} /><ReviewField label='Total items' value={pricing.itemCount} /><ReviewField label='Order total' value={formatCurrency(pricing.total)} /></div>
                </Surface>

                <div className='sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-xl border border-[var(--erp-line)] bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end'>
                    <Link to={backPath} className='inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Cancel</Link>
                    <button type='button' onClick={saveDraft} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--erp-primary)] px-4 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'><Save aria-hidden='true' size={17} /> Save browser draft</button>
                    <button type='submit' className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white hover:opacity-90'><ClipboardCheck aria-hidden='true' size={17} /> Review order</button>
                </div>
            </form>

            <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} title='Review canteen order' description='Verify identity, quantities, fulfilment and payment state before connecting order creation.' size='lg' footer={<><button type='button' onClick={() => setReviewOpen(false)} className='min-h-10 rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)]'>Return to form</button><button type='button' disabled className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white opacity-50'><Send aria-hidden='true' size={16} /> API order creation unavailable</button></>}>
                <IntegrationNotice state='disconnected' title='No order or payment created' description='The final action remains disabled until authenticated order, payment, wallet and stock-reservation APIs are connected.' />
                <dl className='mt-4 grid gap-3 sm:grid-cols-2'><ReviewField label='Customer' value={`${order.customer?.name} (${order.customer?.customerId})`} /><ReviewField label='RFID' value={order.rfidCardNo} /><ReviewField label='Order type' value={order.orderType} /><ReviewField label='Ready time' value={order.expectedReadyTime} /><ReviewField label='Payment' value={`${order.paymentMethod} · ${order.paymentStatus}`} /><ReviewField label='Order total' value={formatCurrency(pricing.total)} /></dl>
                <div className='mt-4 space-y-2'>{order.lines.map((line) => { const menuItem = menuItems.find((entry) => entry.id === line.menuId); return <div key={line.menuId} className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--erp-line)] px-3 py-2 text-sm'><span className='font-semibold text-[var(--erp-ink)]'>{menuItem?.name}</span><span className='text-[var(--erp-slate)]'>{line.quantity} × {formatCurrency(menuItem?.price)} = {formatCurrency(Number(line.quantity) * (menuItem?.price ?? 0))}</span></div> })}</div>
            </Dialog>
        </section>
    )
}

export default CanteenOrderWorkspace
