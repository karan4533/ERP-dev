import React, { useState } from 'react'
import {
    X,
    Plus,
    Trash2,
    Package,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Building2,
    User,
    UploadCloud,
    FileText,
    ArrowRight
} from 'lucide-react'
import { INVENTORY_ITEMS } from '../../Inventory/inventoryData'

const DEPARTMENTS = [
    'Academic Administration',
    'Senior Secondary Wing (Grades 9-12)',
    'Middle Wing (Grades 6-8)',
    'Primary Wing (Grades 1-5)',
    'Senior Science Labs',
    'Computer & Robotics Labs',
    'Transport & Logistics',
    'Facilities & Campus Maintenance',
    'Front Office / Reception',
    'Examination Cell',
]

const StoreRequestModal = ({ open, onClose, onSubmitSuccess }) => {
    const [requestId] = useState(() => `REQ-STR-2026-${Math.floor(100 + Math.random() * 900)}`)
    const [requestDate] = useState(() => new Date().toISOString().split('T')[0])
    const [requiredDate, setRequiredDate] = useState('')
    const [department, setDepartment] = useState(DEPARTMENTS[0])
    const [requestedBy, setRequestedBy] = useState('Dr. Kavita Sharma')
    const [priority, setPriority] = useState('Medium')
    const [purpose, setPurpose] = useState('')
    const [remarks, setRemarks] = useState('')

    // Multi-item dynamic rows
    const [lineItems, setLineItems] = useState([
        {
            itemId: INVENTORY_ITEMS[0]?.itemId || '',
            itemCode: INVENTORY_ITEMS[0]?.itemCode || '',
            itemName: INVENTORY_ITEMS[0]?.itemName || '',
            availableQuantity: INVENTORY_ITEMS[0]?.availableQuantity ?? 450,
            quantity: 10,
            unit: INVENTORY_ITEMS[0]?.unit || 'Pieces',
        },
    ])

    if (!open) return null

    const handleItemChange = (index, selectedItemId) => {
        const found = INVENTORY_ITEMS.find((it) => it.itemId === selectedItemId)
        if (!found) return
        setLineItems((prev) => {
            const next = [...prev]
            next[index] = {
                itemId: found.itemId,
                itemCode: found.itemCode,
                itemName: found.itemName,
                availableQuantity: found.availableQuantity,
                quantity: next[index]?.quantity || 1,
                unit: found.unit,
            }
            return next
        })
    }

    const handleQuantityChange = (index, qty) => {
        const num = Math.max(1, parseInt(qty, 10) || 1)
        setLineItems((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], quantity: num }
            return next
        })
    }

    const addLineItem = () => {
        const defaultItem = INVENTORY_ITEMS[0]
        setLineItems((prev) => [
            ...prev,
            {
                itemId: defaultItem?.itemId || '',
                itemCode: defaultItem?.itemCode || '',
                itemName: defaultItem?.itemName || '',
                availableQuantity: defaultItem?.availableQuantity ?? 0,
                quantity: 1,
                unit: defaultItem?.unit || 'Pieces',
            },
        ])
    }

    const removeLineItem = (index) => {
        if (lineItems.length === 1) return
        setLineItems((prev) => prev.filter((_, i) => i !== index))
    }

    // Check if any item will trigger a linked purchase request
    const hasPurchaseTrigger = lineItems.some(
        (it) => it.quantity > it.availableQuantity
    )

    const handleSubmit = (e) => {
        e.preventDefault()
        const newRequest = {
            requestId,
            requestDate,
            requiredDate,
            department,
            requestedBy,
            priority,
            purpose,
            remarks,
            lineItems,
            hasPurchaseTrigger,
            status: 'Submitted',
            currentStage: 'Team Leader Review',
        }
        onSubmitSuccess?.(newRequest)
        onClose()
    }

    return (
        <div className='fixed inset-0 z-400 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
            <div className='relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-2xl font-inter'>
                {/* Header */}
                <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
                    <div className='flex items-center gap-2.5'>
                        <div className='flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600'>
                            <Package size={18} />
                        </div>
                        <div>
                            <h2 className='text-base font-bold text-slate-900'>
                                New Department Store Requisition
                            </h2>
                            <p className='text-xs text-slate-400'>
                                Multi-item stock request with instant inventory availability check
                            </p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='space-y-5 pt-4 text-xs'>
                    {/* Requisition Meta Row */}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                        <div>
                            <label className='block font-semibold text-slate-700 mb-1'>Requisition Number</label>
                            <input
                                type='text'
                                disabled
                                value={requestId}
                                className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono font-semibold text-slate-700'
                            />
                        </div>
                        <div>
                            <label className='block font-semibold text-slate-700 mb-1'>Request Date</label>
                            <input
                                type='date'
                                disabled
                                value={requestDate}
                                className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600'
                            />
                        </div>
                        <div>
                            <label className='block font-semibold text-slate-700 mb-1'>Required By Date</label>
                            <input
                                type='date'
                                required
                                value={requiredDate}
                                onChange={(e) => setRequiredDate(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                            />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                        <div>
                            <label className='block font-semibold text-slate-700 mb-1'>Requesting Department</label>
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                            >
                                {DEPARTMENTS.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className='block font-semibold text-slate-700 mb-1'>Requested By</label>
                            <input
                                type='text'
                                required
                                value={requestedBy}
                                onChange={(e) => setRequestedBy(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                            />
                        </div>
                        <div>
                            <label className='block font-semibold text-slate-700 mb-1'>Priority Level</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                            >
                                <option value='Urgent'>Urgent (Within 24 Hours)</option>
                                <option value='High'>High Priority</option>
                                <option value='Medium'>Medium Priority (Standard)</option>
                                <option value='Low'>Low Priority</option>
                            </select>
                        </div>
                    </div>

                    {/* Purpose / Reason */}
                    <div>
                        <label className='block font-semibold text-slate-700 mb-1'>Purpose & Academic / Operational Justification</label>
                        <textarea
                            rows={2}
                            required
                            placeholder='State why these items are required and specify target curriculum/exam/department context...'
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                        />
                    </div>

                    {/* Multi-Item Dynamic Table */}
                    <div className='rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3'>
                        <div className='flex items-center justify-between border-b border-slate-200/80 pb-2'>
                            <h3 className='font-bold text-slate-900 text-xs flex items-center gap-1.5'>
                                <Package size={14} className='text-blue-600' />
                                Requested Item Line-Items ({lineItems.length})
                            </h3>
                            <button
                                type='button'
                                onClick={addLineItem}
                                className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer'
                            >
                                <Plus size={14} /> Add Line Item
                            </button>
                        </div>

                        <div className='space-y-3'>
                            {lineItems.map((line, idx) => {
                                const isInsufficient = line.quantity > line.availableQuantity
                                return (
                                    <div
                                        key={idx}
                                        className='flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs'
                                    >
                                        <div className='flex-1 min-w-0'>
                                            <label className='block text-[10px] font-semibold text-slate-400 uppercase mb-1'>Select Catalog Item</label>
                                            <select
                                                value={line.itemId}
                                                onChange={(e) => handleItemChange(idx, e.target.value)}
                                                className='w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                            >
                                                {INVENTORY_ITEMS.map((item) => (
                                                    <option key={item.itemId} value={item.itemId}>
                                                        {item.itemName} ({item.itemCode}) · In Stock: {item.availableQuantity} {item.unit}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className='w-24 shrink-0'>
                                            <label className='block text-[10px] font-semibold text-slate-400 uppercase mb-1'>Requested Qty</label>
                                            <input
                                                type='number'
                                                min='1'
                                                value={line.quantity}
                                                onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                className='w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none'
                                            />
                                        </div>

                                        <div className='w-40 shrink-0 text-center sm:text-left'>
                                            <label className='block text-[10px] font-semibold text-slate-400 uppercase mb-1'>Stock Status</label>
                                            {isInsufficient ? (
                                                <span className='inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200'>
                                                    <AlertCircle size={12} /> Stockout ({line.availableQuantity} left)
                                                </span>
                                            ) : (
                                                <span className='inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200'>
                                                    <CheckCircle2 size={12} /> In Stock ({line.availableQuantity} {line.unit})
                                                </span>
                                            )}
                                        </div>

                                        {lineItems.length > 1 && (
                                            <button
                                                type='button'
                                                onClick={() => removeLineItem(idx)}
                                                className='p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors self-end sm:self-center cursor-pointer'
                                                title='Remove line'
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {hasPurchaseTrigger && (
                            <div className='rounded-xl border border-blue-200 bg-blue-50/70 p-3 flex items-start gap-2.5 text-xs text-blue-800'>
                                <AlertCircle size={16} className='text-blue-600 shrink-0 mt-0.5' />
                                <div>
                                    <p className='font-bold'>Automatic Purchase Request Trigger Activated</p>
                                    <p className='mt-0.5 text-[11px] text-blue-700'>
                                        One or more requested quantities exceed available central store stock. Submitting this request will automatically spawn linked Purchase Request (<strong className='font-mono'>PR-2026-AUTO</strong>) and forward it to Finance & Procurement for PO generation.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Workflow Chain Preview */}
                    <div className='rounded-xl border border-slate-200 bg-slate-50/50 p-3.5'>
                        <p className='font-bold text-slate-800 mb-2'>Configured Approval Chain</p>
                        <div className='flex items-center gap-2 flex-wrap text-[11px] font-medium text-slate-500'>
                            <span className='rounded bg-blue-100 text-blue-800 px-2 py-0.5 font-bold'>1. Requester Submit</span>
                            <ArrowRight size={13} className='text-slate-400' />
                            <span className='rounded bg-slate-200 text-slate-700 px-2 py-0.5'>2. Team Leader Endorsement</span>
                            <ArrowRight size={13} className='text-slate-400' />
                            <span className='rounded bg-slate-200 text-slate-700 px-2 py-0.5'>3. HOD Authorization</span>
                            <ArrowRight size={13} className='text-slate-400' />
                            <span className='rounded bg-slate-200 text-slate-700 px-2 py-0.5'>4. Stores Stock Issue</span>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className='flex items-center justify-end gap-3 pt-3 border-t border-slate-100'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer'
                        >
                            Submit Store Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default StoreRequestModal

