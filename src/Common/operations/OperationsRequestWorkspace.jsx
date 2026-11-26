import { useMemo, useState } from 'react'
import { FileText, Plus, Save, Send, Trash2 } from 'lucide-react'
import { Dialog, FormField, IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'
import {
    createEmptyOperationsRequest,
    emptyOperationsLineItem,
    getOperationsRequestErrorCount,
    validateOperationsRequest,
} from './operationsRequestState.js'

const controlClass = 'min-h-11 w-full rounded-lg border border-[var(--erp-line)] bg-white px-3 py-2.5 text-sm text-[var(--erp-ink)] outline-none transition focus:border-[var(--erp-primary)] focus:ring-2 focus:ring-[color:var(--erp-primary-soft)] disabled:cursor-not-allowed disabled:bg-[var(--erp-canvas)] disabled:text-[var(--erp-muted)]'

const optionValue = (option) => typeof option === 'string' ? option : option.value
const optionLabel = (option) => typeof option === 'string' ? option : option.label

const loadBrowserDraft = ({ emptyRequest, storageKey }) => {
    if (!storageKey) return { request: emptyRequest, message: '' }
    try {
        const stored = window.localStorage.getItem(storageKey)
        if (!stored) return { request: emptyRequest, message: '' }
        const parsed = JSON.parse(stored)
        return {
            request: { ...emptyRequest, ...parsed, attachments: [] },
            message: 'A browser draft was restored. Attachments must be selected again.',
        }
    } catch {
        return {
            request: emptyRequest,
            message: 'The previous browser draft could not be restored.',
        }
    }
}

const SummaryItem = ({ label, value }) => (
    <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
        <dt className='text-xs font-medium uppercase tracking-wide text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 break-words text-sm font-medium text-[var(--erp-ink)]'>{value || 'Not provided'}</dd>
    </div>
)

const OperationsRequestWorkspace = ({
    title = 'Create request',
    description = 'Prepare a request for operational and financial review.',
    backPath,
    requestTypes = [],
    priorityOptions = [],
    budgetCategories = [],
    requester,
    department,
    sentTo,
    workflow = [],
    showRequiredByDate = false,
    enableLineItems = false,
    storageKey,
}) => {
    const emptyRequest = useMemo(() => createEmptyOperationsRequest({ lineItems: enableLineItems }), [enableLineItems])
    const [initialState] = useState(() => loadBrowserDraft({ emptyRequest, storageKey }))
    const [request, setRequest] = useState(initialState.request)
    const [errors, setErrors] = useState({})
    const [reviewOpen, setReviewOpen] = useState(false)
    const [draftMessage, setDraftMessage] = useState(initialState.message)

    const updateField = (field, value) => {
        setRequest((current) => ({ ...current, [field]: value }))
        setErrors((current) => {
            if (!current[field]) return current
            const next = { ...current }
            delete next[field]
            return next
        })
        setDraftMessage('')
    }

    const updateLineItem = (index, field, value) => {
        setRequest((current) => ({
            ...current,
            lineItems: current.lineItems.map((lineItem, lineIndex) => lineIndex === index ? { ...lineItem, [field]: value } : lineItem),
        }))
        setErrors((current) => {
            const key = `lineItems.${index}.${field}`
            if (!current[key]) return current
            const next = { ...current }
            delete next[key]
            return next
        })
    }

    const addLineItem = () => updateField('lineItems', [...request.lineItems, emptyOperationsLineItem()])

    const removeLineItem = (index) => {
        if (request.lineItems.length === 1) return
        updateField('lineItems', request.lineItems.filter((_, lineIndex) => lineIndex !== index))
    }

    const saveDraft = () => {
        if (!storageKey) return
        try {
            const draft = { ...request, attachments: [] }
            window.localStorage.setItem(storageKey, JSON.stringify(draft))
            setDraftMessage('Draft saved in this browser. It has not been submitted for approval.')
        } catch {
            setDraftMessage('This browser could not save the draft. Copy important information before leaving.')
        }
    }

    const reviewRequest = (event) => {
        event.preventDefault()
        const nextErrors = validateOperationsRequest(request, { requireLineItems: enableLineItems })
        setErrors(nextErrors)
        if (getOperationsRequestErrorCount(nextErrors)) {
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
                title={title}
                description={description}
                actions={<a href={backPath} className='inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--erp-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Back to requests</a>}
            />

            <IntegrationNotice
                state='disconnected'
                title='Request submission API pending'
                description='You can validate, review and save this form as a browser draft. Final submission, attachment upload, budget checks, notifications and audit evidence require the separately managed backend service.'
            />

            {draftMessage && <p role='status' className='rounded-lg border border-[var(--erp-line)] bg-white px-4 py-3 text-sm text-[var(--erp-slate)]'>{draftMessage}</p>}

            <form className='space-y-5' onSubmit={reviewRequest} noValidate>
                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div>
                        <h2 className='text-base font-semibold text-[var(--erp-ink)]'>Request details</h2>
                        <p className='mt-1 text-sm text-[var(--erp-muted)]'>Fields marked with an asterisk are required before review.</p>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Request type' error={errors.requestType} required>
                            <select className={controlClass} value={request.requestType} onChange={(event) => updateField('requestType', event.target.value)}>
                                <option value=''>Select request type</option>
                                {requestTypes.map((option) => <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>)}
                            </select>
                        </FormField>
                        <FormField label='Request title' error={errors.title} required className='md:col-span-1 xl:col-span-2'>
                            <input className={controlClass} value={request.title} onChange={(event) => updateField('title', event.target.value)} placeholder='Describe the requested outcome' />
                        </FormField>
                        <FormField label='Description' error={errors.description} required className='md:col-span-2 xl:col-span-3'>
                            <textarea className={`${controlClass} min-h-28 resize-y`} value={request.description} onChange={(event) => updateField('description', event.target.value)} placeholder='Explain the operational need, scope and expected outcome' />
                        </FormField>
                        <FormField label='Priority' error={errors.priority} required>
                            <select className={controlClass} value={request.priority} onChange={(event) => updateField('priority', event.target.value)}>
                                <option value=''>Select priority</option>
                                {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                            </select>
                        </FormField>
                        {showRequiredByDate && (
                            <FormField label='Required by date' hint='Use the operational due date, not the expected approval date.'>
                                <input type='date' className={controlClass} value={request.requiredByDate} onChange={(event) => updateField('requiredByDate', event.target.value)} />
                            </FormField>
                        )}
                    </div>
                </Surface>

                {enableLineItems && (
                    <Surface className='space-y-4 p-4 sm:p-6'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div>
                                <h2 className='text-base font-semibold text-[var(--erp-ink)]'>Line items</h2>
                                <p className='mt-1 text-sm text-[var(--erp-muted)]'>Add the quantity and estimated cost for each requested item.</p>
                            </div>
                            <button type='button' onClick={addLineItem} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-primary)] px-3 py-2 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>
                                <Plus aria-hidden='true' size={16} /> Add item
                            </button>
                        </div>
                        {errors.lineItems && <p role='alert' className='text-sm font-medium text-[var(--erp-red)]'>{errors.lineItems}</p>}
                        <div className='grid gap-3'>
                            {request.lineItems.map((lineItem, index) => (
                                <fieldset key={index} className='grid grid-cols-1 gap-3 rounded-xl border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3 md:grid-cols-[minmax(0,1fr)_9rem_12rem_auto] md:items-end'>
                                    <legend className='sr-only'>Line item {index + 1}</legend>
                                    <FormField label={`Item ${index + 1}`} error={errors[`lineItems.${index}.item`]} required>
                                        <input className={controlClass} value={lineItem.item} onChange={(event) => updateLineItem(index, 'item', event.target.value)} placeholder='Item name' />
                                    </FormField>
                                    <FormField label='Quantity' error={errors[`lineItems.${index}.quantity`]} required>
                                        <input type='number' min='1' step='1' className={controlClass} value={lineItem.quantity} onChange={(event) => updateLineItem(index, 'quantity', event.target.value)} />
                                    </FormField>
                                    <FormField label='Estimated cost' error={errors[`lineItems.${index}.estimatedCost`]} hint='INR, optional'>
                                        <input inputMode='decimal' className={controlClass} value={lineItem.estimatedCost} onChange={(event) => updateLineItem(index, 'estimatedCost', event.target.value)} placeholder='0.00' />
                                    </FormField>
                                    <button type='button' onClick={() => removeLineItem(index)} disabled={request.lineItems.length === 1} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-medium text-[var(--erp-slate)] hover:border-[var(--erp-red)] hover:text-[var(--erp-red)] disabled:cursor-not-allowed disabled:opacity-50' aria-label={`Remove line item ${index + 1}`}>
                                        <Trash2 aria-hidden='true' size={16} /><span className='md:sr-only'>Remove item</span>
                                    </button>
                                </fieldset>
                            ))}
                        </div>
                    </Surface>
                )}

                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div>
                        <h2 className='text-base font-semibold text-[var(--erp-ink)]'>Financial and supplier context</h2>
                        <p className='mt-1 text-sm text-[var(--erp-muted)]'>Provide estimates for review; the backend remains authoritative for budgets and vendors.</p>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Estimated amount' error={errors.estimatedAmount} hint='INR; enter numbers only or a formatted estimate.'>
                            <input inputMode='decimal' className={controlClass} value={request.estimatedAmount} onChange={(event) => updateField('estimatedAmount', event.target.value)} placeholder='0.00' />
                        </FormField>
                        <FormField label='Budget category'>
                            <select className={controlClass} value={request.budgetCategory} onChange={(event) => updateField('budgetCategory', event.target.value)}>
                                <option value=''>Select category</option>
                                {budgetCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </FormField>
                        <FormField label='Vendor name'>
                            <input className={controlClass} value={request.vendorName} onChange={(event) => updateField('vendorName', event.target.value)} placeholder='Optional supplier name' />
                        </FormField>
                        <FormField label='Vendor contact'>
                            <input className={controlClass} value={request.vendorContact} onChange={(event) => updateField('vendorContact', event.target.value)} placeholder='Phone or email' />
                        </FormField>
                        <FormField label='Supporting files' hint='Names are shown for review only; files are not uploaded or saved in drafts.' className='md:col-span-2'>
                            <input type='file' multiple className={`${controlClass} file:mr-3 file:rounded-md file:border-0 file:bg-[var(--erp-primary-soft)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--erp-primary)]`} onChange={(event) => updateField('attachments', [...event.target.files].map((file) => file.name))} />
                        </FormField>
                    </div>
                </Surface>

                <Surface className='space-y-4 p-4 sm:p-6'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <StatusBadge status='Draft' />
                        <span className='text-sm font-medium text-[var(--erp-ink)]'>{requester}</span>
                        <span aria-hidden='true' className='text-[var(--erp-muted)]'>·</span>
                        <span className='text-sm text-[var(--erp-slate)]'>{department}</span>
                    </div>
                    <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-4'>
                        {(workflow.length ? workflow : [department, sentTo, 'Finance review', 'Approved / Rejected']).map((stage, index) => (
                            <div key={`${stage}-${index}`} className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>Stage {index + 1}</p>
                                <p className='mt-1 text-sm font-medium text-[var(--erp-ink)]'>{stage}</p>
                            </div>
                        ))}
                    </div>
                </Surface>

                <div className='sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-xl border border-[var(--erp-line)] bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end'>
                    <a href={backPath} className='inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--erp-line)] px-4 py-2 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Cancel</a>
                    <button type='button' onClick={saveDraft} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--erp-primary)] px-4 py-2 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>
                        <Save aria-hidden='true' size={17} /> Save browser draft
                    </button>
                    <button type='submit' className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90'>
                        <FileText aria-hidden='true' size={17} /> Review request
                    </button>
                </div>
            </form>

            <Dialog
                open={reviewOpen}
                onClose={() => setReviewOpen(false)}
                title='Review request'
                description='Verify the request before connecting it to the approval service.'
                size='lg'
                footer={(
                    <>
                        <button type='button' onClick={() => setReviewOpen(false)} className='min-h-10 rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Return to form</button>
                        <button type='button' disabled className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white opacity-50' title='Connect the request submission API to enable this action'>
                            <Send aria-hidden='true' size={16} /> API submission unavailable
                        </button>
                    </>
                )}
            >
                <IntegrationNotice state='disconnected' title='Not yet submitted' description='Reviewing this form does not create an approval record. The final action remains disabled until the request API and authenticated actor context are connected.' />
                <dl className='mt-4 grid gap-3 sm:grid-cols-2'>
                    <SummaryItem label='Request type' value={request.requestType} />
                    <SummaryItem label='Priority' value={request.priority} />
                    <SummaryItem label='Title' value={request.title} />
                    <SummaryItem label='Estimated amount' value={request.estimatedAmount} />
                    <SummaryItem label='Budget category' value={request.budgetCategory} />
                    <SummaryItem label='Required by' value={request.requiredByDate} />
                    <div className='sm:col-span-2'><SummaryItem label='Description' value={request.description} /></div>
                    <SummaryItem label='Route owner' value={sentTo} />
                    <SummaryItem label='Attachments selected' value={request.attachments.join(', ')} />
                </dl>
                {enableLineItems && (
                    <div className='mt-4'>
                        <h3 className='text-sm font-semibold text-[var(--erp-ink)]'>Line items</h3>
                        <ul className='mt-2 grid gap-2'>
                            {request.lineItems.map((item, index) => <li key={index} className='rounded-lg border border-[var(--erp-line)] p-3 text-sm text-[var(--erp-slate)]'><span className='font-semibold text-[var(--erp-ink)]'>{item.item}</span> · Qty {item.quantity}{item.estimatedCost ? ` · ₹${item.estimatedCost}` : ''}</li>)}
                        </ul>
                    </div>
                )}
            </Dialog>
        </section>
    )
}

export default OperationsRequestWorkspace
