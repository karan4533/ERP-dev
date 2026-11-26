import { useMemo, useState } from 'react'
import { FileText, Save, Send } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Dialog, FormField, IntegrationNotice, PageHeader, StatusBadge, Surface } from '../ui'
import { inventoryService } from '../../services/modules/inventoryService'
import { getInventoryCatalog, saveInventoryCatalog } from '../StoresProcurement/storesProcurementData'
import {
    createEmptyOperationsInventoryItem,
    deriveInventoryStatus,
    validateOperationsInventoryItem,
} from './operationsInventoryState.js'

const controlClass = 'min-h-11 w-full rounded-lg border border-[var(--erp-line)] bg-white px-3 py-2.5 text-sm text-[var(--erp-ink)] outline-none transition focus:border-[var(--erp-primary)] focus:ring-2 focus:ring-[color:var(--erp-primary-soft)]'

const loadDraft = (storageKey, emptyItem) => {
    if (!storageKey) return { item: emptyItem, message: '' }
    try {
        const stored = window.localStorage.getItem(storageKey)
        if (!stored) return { item: emptyItem, message: '' }
        return {
            item: { ...emptyItem, ...JSON.parse(stored), attachments: [] },
            message: 'A browser draft was restored. Select invoice files again if they are still required.',
        }
    } catch {
        return { item: emptyItem, message: 'The previous browser draft could not be restored.' }
    }
}

const ReviewField = ({ label, value }) => (
    <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 break-words text-sm font-semibold text-[var(--erp-ink)]'>{value || 'Not provided'}</dd>
    </div>
)

const OperationsInventoryWorkspace = ({
    title,
    description,
    backPath,
    categories,
    units,
    itemLabel = 'Item',
    requireCode = false,
    showUnitCost = false,
    storageKey,
}) => {
    const emptyItem = useMemo(() => createEmptyOperationsInventoryItem(), [])
    const navigate = useNavigate()
    const [initialState] = useState(() => loadDraft(storageKey, emptyItem))
    const [item, setItem] = useState(initialState.item)
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState(initialState.message)
    const [reviewOpen, setReviewOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const status = deriveInventoryStatus(item)

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
            window.localStorage.setItem(storageKey, JSON.stringify({ ...item, attachments: [] }))
            setMessage('Draft saved in this browser. No inventory record has been created.')
        } catch {
            setMessage('This browser could not save the draft. Copy important information before leaving.')
        }
    }

    const handleConfirmCreate = async () => {
        setIsSubmitting(true)
        try {
            const itemCode = item.code || `SKU-${Date.now().toString().slice(-6)}`
            // 1. Create in inventoryService
            await inventoryService.createItem({
                name: item.name,
                category: item.category || 'General Stationery',
                code: itemCode,
                currentStock: Number(item.quantity) || 0,
                minimumStock: Number(item.reorderLevel) || 10,
                unitOfMeasure: item.unit || 'Pieces',
                unitPrice: Number(item.unitCost) || 0,
                supplierName: item.supplierName || 'Empanelled Vendor',
                description: `${item.name} opening stock received on ${item.purchaseDate || new Date().toISOString().split('T')[0]}. Invoice: ${item.invoiceNumber || 'INV-DIRECT'}`
            })

            // 2. Sync to storesProcurementData catalog
            try {
                const currentCatalog = getInventoryCatalog()
                const newItemRecord = {
                    id: itemCode,
                    itemCode,
                    itemName: item.name,
                    category: item.category || 'Stationery',
                    currentStock: Number(item.quantity) || 0,
                    minimumStock: Number(item.reorderLevel) || 10,
                    unitOfMeasure: item.unit || 'Pieces',
                    unitPrice: Number(item.unitCost) || 0,
                    location: 'Central Stationery Depot (Rack A1)',
                    supplierName: item.supplierName || 'Empanelled Vendor',
                    lastRestockedDate: new Date().toLocaleDateString('en-GB'),
                }
                saveInventoryCatalog([newItemRecord, ...currentCatalog])
            } catch (syncErr) {
                console.warn('Sync to stores procurement catalog warning:', syncErr)
            }

            // 3. Clear draft
            if (storageKey) {
                window.localStorage.removeItem(storageKey)
            }

            setReviewOpen(false)
            navigate(backPath)
        } catch (err) {
            console.error('Failed to create inventory item:', err)
            setMessage(err.message || 'Error creating inventory record.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const reviewItem = (event) => {
        event.preventDefault()
        const nextErrors = validateOperationsInventoryItem(item, { requireCode })
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
                title={title}
                description={description}
                status={status}
                actions={<Link to={backPath} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to inventory</Link>}
            />
            <IntegrationNotice
                state='disconnected'
                title='Inventory write API pending'
                description='You can validate, review and save a browser draft. Item creation, duplicate-code checks, supplier matching, invoice upload, stock ledger posting and audit evidence require the inventory backend.'
            />
            {message && <p role='status' className='rounded-lg border border-[var(--erp-line)] bg-white px-4 py-3 text-sm text-[var(--erp-slate)]'>{message}</p>}

            <form className='space-y-5' onSubmit={reviewItem} noValidate>
                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div>
                        <h2 className='text-base font-semibold text-[var(--erp-ink)]'>{itemLabel} identity</h2>
                        <p className='mt-1 text-sm text-[var(--erp-muted)]'>Use the catalogue name and category staff will recognize during issue and replenishment.</p>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label={`${itemLabel} name`} error={errors.name} required className='md:col-span-2'>
                            <input className={controlClass} value={item.name} onChange={(event) => updateField('name', event.target.value)} placeholder={`Enter ${itemLabel.toLowerCase()} name`} />
                        </FormField>
                        <FormField label='Category' error={errors.category} required>
                            <select className={controlClass} value={item.category} onChange={(event) => updateField('category', event.target.value)}>
                                <option value=''>Select category</option>
                                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </FormField>
                        {requireCode && (
                            <FormField label={`${itemLabel} code`} error={errors.code} hint='Use the approved catalogue or barcode identifier.' required>
                                <input className={controlClass} value={item.code} onChange={(event) => updateField('code', event.target.value)} placeholder='e.g. PAP-A4-500' />
                            </FormField>
                        )}
                        <FormField label='Description' className={requireCode ? 'md:col-span-2 xl:col-span-3' : 'md:col-span-2 xl:col-span-3'}>
                            <textarea className={`${controlClass} min-h-28 resize-y`} value={item.description} onChange={(event) => updateField('description', event.target.value)} placeholder='Describe specifications, packaging or safe-use requirements' />
                        </FormField>
                    </div>
                </Surface>

                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                        <div>
                            <h2 className='text-base font-semibold text-[var(--erp-ink)]'>Opening stock</h2>
                            <p className='mt-1 text-sm text-[var(--erp-muted)]'>The status preview follows the opening quantity and reorder threshold.</p>
                        </div>
                        <StatusBadge status={status} />
                    </div>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                        <FormField label='Current quantity' error={errors.quantity} hint='Zero is valid for an out-of-stock catalogue item.' required>
                            <input type='number' min='0' step='1' className={controlClass} value={item.quantity} onChange={(event) => updateField('quantity', event.target.value)} />
                        </FormField>
                        <FormField label='Stock unit' error={errors.unit} required>
                            <select className={controlClass} value={item.unit} onChange={(event) => updateField('unit', event.target.value)}>
                                <option value=''>Select unit</option>
                                {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </FormField>
                        <FormField label='Reorder level' error={errors.reorderLevel} hint='Low-stock status begins at or below this quantity.'>
                            <input type='number' min='0' step='1' className={controlClass} value={item.reorderLevel} onChange={(event) => updateField('reorderLevel', event.target.value)} />
                        </FormField>
                        {showUnitCost && (
                            <FormField label='Unit cost' error={errors.unitCost} hint='INR estimate; finance remains authoritative.'>
                                <input inputMode='decimal' className={controlClass} value={item.unitCost} onChange={(event) => updateField('unitCost', event.target.value)} placeholder='0.00' />
                            </FormField>
                        )}
                    </div>
                </Surface>

                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div>
                        <h2 className='text-base font-semibold text-[var(--erp-ink)]'>Supplier and purchase context</h2>
                        <p className='mt-1 text-sm text-[var(--erp-muted)]'>Capture reference details for later supplier, invoice and stock-ledger verification.</p>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Supplier name'>
                            <input className={controlClass} value={item.supplierName} onChange={(event) => updateField('supplierName', event.target.value)} placeholder='Optional supplier name' />
                        </FormField>
                        <FormField label='Supplier contact'>
                            <input className={controlClass} value={item.supplierContact} onChange={(event) => updateField('supplierContact', event.target.value)} placeholder='Phone or email' />
                        </FormField>
                        <FormField label='Purchase date'>
                            <input type='date' className={controlClass} value={item.purchaseDate} onChange={(event) => updateField('purchaseDate', event.target.value)} />
                        </FormField>
                        <FormField label='Invoice number'>
                            <input className={controlClass} value={item.invoiceNumber} onChange={(event) => updateField('invoiceNumber', event.target.value)} placeholder='Supplier invoice reference' />
                        </FormField>
                        <FormField label='Invoice files' hint='Names appear in review only; files are not uploaded or saved in drafts.' className='md:col-span-2'>
                            <input type='file' multiple className={`${controlClass} file:mr-3 file:rounded-md file:border-0 file:bg-[var(--erp-primary-soft)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--erp-primary)]`} onChange={(event) => updateField('attachments', [...event.target.files].map((file) => file.name))} />
                        </FormField>
                    </div>
                </Surface>

                <div className='sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-xl border border-[var(--erp-line)] bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end'>
                    <Link to={backPath} className='inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Cancel</Link>
                    <button type='button' onClick={saveDraft} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--erp-primary)] px-4 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'><Save aria-hidden='true' size={17} /> Save browser draft</button>
                    <button type='submit' className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white hover:opacity-90'><FileText aria-hidden='true' size={17} /> Review item</button>
                </div>
            </form>

            <Dialog
                open={reviewOpen}
                onClose={() => setReviewOpen(false)}
                title={`Review ${itemLabel.toLowerCase()}`}
                description='Verify the opening stock record before creating it in the central inventory service.'
                size='lg'
                footer={(
                    <>
                        <button type='button' onClick={() => setReviewOpen(false)} className='min-h-10 rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Return to form</button>
                        <button
                            type='button'
                            disabled={isSubmitting}
                            onClick={handleConfirmCreate}
                            className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white hover:opacity-90 shadow-sm cursor-pointer disabled:opacity-50'
                        >
                            <Send aria-hidden='true' size={16} /> {isSubmitting ? 'Creating Item...' : 'Create Inventory Item'}
                        </button>
                    </>
                )}
            >
                <IntegrationNotice state='connected' title='Central inventory write API connected' description='Submitting this form creates a persistent catalog item in the central stores inventory ledger.' />
                <dl className='mt-4 grid gap-3 sm:grid-cols-2'>
                    <ReviewField label={`${itemLabel} name`} value={item.name} />
                    <ReviewField label='Category' value={item.category} />
                    {requireCode && <ReviewField label={`${itemLabel} code`} value={item.code} />}
                    <ReviewField label='Opening status' value={status} />
                    <ReviewField label='Quantity' value={`${item.quantity} ${item.unit}`} />
                    <ReviewField label='Reorder level' value={item.reorderLevel} />
                    {showUnitCost && <ReviewField label='Unit cost' value={item.unitCost} />}
                    <ReviewField label='Supplier' value={item.supplierName} />
                    <ReviewField label='Purchase date' value={item.purchaseDate} />
                    <ReviewField label='Invoice number' value={item.invoiceNumber} />
                    <ReviewField label='Invoice files selected' value={item.attachments.join(', ')} />
                </dl>
            </Dialog>
        </section>
    )
}

export default OperationsInventoryWorkspace
