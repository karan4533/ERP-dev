import { useMemo, useState } from 'react'
import { ClipboardCheck, Save, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dialog, FormField, IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'
import {
    createEmptyOperationsCustodyRecord,
    getIssueReadiness,
    getIssueStockPreview,
    validateOperationsCustodyRecord,
} from './operationsCustodyState.js'

const controlClass = 'min-h-11 w-full rounded-lg border border-[var(--erp-line)] bg-white px-3 py-2.5 text-sm text-[var(--erp-ink)] outline-none transition focus:border-[var(--erp-primary)] focus:ring-2 focus:ring-[color:var(--erp-primary-soft)]'

const loadDraft = (storageKey, emptyRecord) => {
    try {
        const stored = window.localStorage.getItem(storageKey)
        if (!stored) return { record: emptyRecord, message: '' }
        return { record: { ...emptyRecord, ...JSON.parse(stored) }, message: 'A browser custody draft was restored.' }
    } catch {
        return { record: emptyRecord, message: 'The previous custody draft could not be restored.' }
    }
}

const ReviewField = ({ label, value }) => (
    <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 break-words text-sm font-semibold text-[var(--erp-ink)]'>{value === 0 ? 0 : value || 'Not provided'}</dd>
    </div>
)

const OperationsCustodyWorkspace = ({ backPath, departments, items, purposes, conditions, storageKey }) => {
    const emptyRecord = useMemo(() => createEmptyOperationsCustodyRecord(), [])
    const [initialState] = useState(() => loadDraft(storageKey, emptyRecord))
    const [record, setRecord] = useState(initialState.record)
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState(initialState.message)
    const [reviewOpen, setReviewOpen] = useState(false)
    const selectedItem = items.find((item) => item.name === record.itemName)
    const stock = getIssueStockPreview({ availableStock: selectedItem?.availableStock, quantity: record.quantity })
    const readiness = getIssueReadiness({ availableStock: selectedItem?.availableStock, quantity: record.quantity })

    const updateField = (field, value) => {
        setRecord((current) => ({ ...current, [field]: value }))
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
            window.localStorage.setItem(storageKey, JSON.stringify(record))
            setMessage('Draft saved in this browser. No stock or custody record has changed.')
        } catch {
            setMessage('This browser could not save the draft. Copy important information before leaving.')
        }
    }

    const reviewRecord = (event) => {
        event.preventDefault()
        const nextErrors = validateOperationsCustodyRecord(record, { availableStock: selectedItem?.availableStock })
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
                title='Record stationery custody'
                description='Prepare an issue or return record with employee, item and stock context.'
                status={record.activityType === 'Issue' ? 'Issued' : 'Returned'}
                actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to custody log</Link>}
            />
            <IntegrationNotice state='disconnected' title='Stock ledger API pending' description='You can validate, review and save a browser draft. Stock reservation, balance mutation, employee validation, custody history and audit evidence require the inventory backend.' />
            {message && <p role='status' className='rounded-lg border border-[var(--erp-line)] bg-white px-4 py-3 text-sm text-[var(--erp-slate)]'>{message}</p>}

            <form className='space-y-5' onSubmit={reviewRecord} noValidate>
                <Surface className='space-y-4 p-4 sm:p-6'>
                    <div>
                        <h2 className='text-base font-semibold text-[var(--erp-ink)]'>Custody activity</h2>
                        <p className='mt-1 text-sm text-[var(--erp-muted)]'>Choose the stock movement being prepared.</p>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-2' role='radiogroup' aria-label='Custody activity type'>
                        {['Issue', 'Return'].map((type) => (
                            <label key={type} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${record.activityType === type ? 'border-[var(--erp-primary)] bg-[var(--erp-primary-soft)]' : 'border-[var(--erp-line)] bg-white'}`}>
                                <input type='radio' name='activity-type' value={type} checked={record.activityType === type} onChange={() => updateField('activityType', type)} className='mt-1 accent-[var(--erp-primary)]' />
                                <span><span className='block text-sm font-semibold text-[var(--erp-ink)]'>{type} stock</span><span className='mt-1 block text-sm text-[var(--erp-slate)]'>{type === 'Issue' ? 'Prepare stock for an employee or department custodian.' : 'Receive stock against an existing issue reference.'}</span></span>
                            </label>
                        ))}
                    </div>
                </Surface>

                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div>
                        <h2 className='text-base font-semibold text-[var(--erp-ink)]'>Custodian and item</h2>
                        <p className='mt-1 text-sm text-[var(--erp-muted)]'>Identify who is responsible and what quantity is moving.</p>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Employee name' error={errors.employeeName} required>
                            <input className={controlClass} value={record.employeeName} onChange={(event) => updateField('employeeName', event.target.value)} placeholder='Employee or authorized custodian' />
                        </FormField>
                        <FormField label='Employee ID' error={errors.employeeId} required>
                            <input className={controlClass} value={record.employeeId} onChange={(event) => updateField('employeeId', event.target.value)} placeholder='e.g. EMP-1042' />
                        </FormField>
                        <FormField label='Department' error={errors.department} required>
                            <select className={controlClass} value={record.department} onChange={(event) => updateField('department', event.target.value)}><option value=''>Select department</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select>
                        </FormField>
                        <FormField label='Item' error={errors.itemName} required>
                            <select className={controlClass} value={record.itemName} onChange={(event) => updateField('itemName', event.target.value)}><option value=''>Select item</option>{items.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
                        </FormField>
                        <FormField label={record.activityType === 'Issue' ? 'Quantity to issue' : 'Quantity returned'} error={errors.quantity} required>
                            <input type='number' min='1' step='1' className={controlClass} value={record.quantity} onChange={(event) => updateField('quantity', event.target.value)} />
                        </FormField>
                        <FormField label='Remarks' className='md:col-span-2 xl:col-span-3'>
                            <textarea className={`${controlClass} min-h-24 resize-y`} value={record.remarks} onChange={(event) => updateField('remarks', event.target.value)} placeholder='Optional operational context' />
                        </FormField>
                    </div>
                </Surface>

                {record.activityType === 'Issue' ? (
                    <Surface className='space-y-5 p-4 sm:p-6'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Issue controls</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Review the post-issue balance before handing stock to the custodian.</p></div>
                            <StatusBadge status={readiness} />
                        </div>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                            <FormField label='Issue date' error={errors.issueDate} required><input type='date' className={controlClass} value={record.issueDate} onChange={(event) => updateField('issueDate', event.target.value)} /></FormField>
                            <FormField label='Purpose'><select className={controlClass} value={record.purpose} onChange={(event) => updateField('purpose', event.target.value)}><option value=''>Select purpose</option>{purposes.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}</select></FormField>
                        </div>
                        <dl className='grid gap-3 sm:grid-cols-3'>
                            <ReviewField label='Available stock' value={selectedItem ? stock.availableStock : 'Select an item'} />
                            <ReviewField label='Requested quantity' value={record.quantity || 'Enter quantity'} />
                            <ReviewField label='Post-issue balance' value={selectedItem ? stock.remainingStock : 'Not calculated'} />
                        </dl>
                    </Surface>
                ) : (
                    <Surface className='space-y-5 p-4 sm:p-6'>
                        <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Return evidence</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Link the return to its issue and record the received condition.</p></div>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                            <FormField label='Original issue reference' error={errors.originalIssueRef} required><input className={controlClass} value={record.originalIssueRef} onChange={(event) => updateField('originalIssueRef', event.target.value)} placeholder='e.g. IR-2026-0035' /></FormField>
                            <FormField label='Return date' error={errors.returnDate} required><input type='date' className={controlClass} value={record.returnDate} onChange={(event) => updateField('returnDate', event.target.value)} /></FormField>
                            <FormField label='Returned item condition' error={errors.condition} required className='md:col-span-2'><select className={controlClass} value={record.condition} onChange={(event) => updateField('condition', event.target.value)}><option value=''>Select condition</option>{conditions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select></FormField>
                        </div>
                    </Surface>
                )}

                <div className='sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-xl border border-[var(--erp-line)] bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end'>
                    <Link to={backPath} className='inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Cancel</Link>
                    <button type='button' onClick={saveDraft} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--erp-primary)] px-4 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'><Save aria-hidden='true' size={17} /> Save browser draft</button>
                    <button type='submit' className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white hover:opacity-90'><ClipboardCheck aria-hidden='true' size={17} /> Review {record.activityType.toLowerCase()}</button>
                </div>
            </form>

            <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} title={`Review stock ${record.activityType.toLowerCase()}`} description='Verify custody and stock consequences before connecting the stock ledger.' size='lg' footer={<><button type='button' onClick={() => setReviewOpen(false)} className='min-h-10 rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)]'>Return to form</button><button type='button' disabled className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white opacity-50'><Send aria-hidden='true' size={16} /> API recording unavailable</button></>}>
                <IntegrationNotice state='disconnected' title='No custody record created' description='The final action remains disabled until authenticated stock movement and custody APIs are connected.' />
                <dl className='mt-4 grid gap-3 sm:grid-cols-2'>
                    <ReviewField label='Activity' value={record.activityType} /><ReviewField label='Custodian' value={`${record.employeeName} (${record.employeeId})`} /><ReviewField label='Department' value={record.department} /><ReviewField label='Item' value={record.itemName} /><ReviewField label='Quantity' value={record.quantity} />
                    {record.activityType === 'Issue' ? <><ReviewField label='Issue date' value={record.issueDate} /><ReviewField label='Post-issue balance' value={stock.remainingStock} /></> : <><ReviewField label='Original issue' value={record.originalIssueRef} /><ReviewField label='Return date' value={record.returnDate} /><ReviewField label='Condition' value={record.condition} /></>}
                </dl>
            </Dialog>
        </section>
    )
}

export default OperationsCustodyWorkspace
