import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import {
    ACTIVITY_TYPES,
    DEPARTMENTS,
    PURPOSE_OPTIONS,
    CONDITION_OPTIONS,
} from '../issueReturnsData'
import { getInventoryItems, hydrateInventoryItemsFromApi } from '../../Inventory/inventoryData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const emptyLine = () => ({ itemName: '', quantity: '', availableStock: '—' })

/** Shared form state for AddIssueReturn (multi-product supported). */
export const IssueReturnInfo = ({ value, onChange }) => {
    const [catalog, setCatalog] = useState([])
    const activityType = value?.activityType || 'Issue'
    const lines = Array.isArray(value?.lines) && value.lines.length ? value.lines : [emptyLine()]

    useEffect(() => {
        let active = true
        hydrateInventoryItemsFromApi().finally(() => {
            if (!active) return
            setCatalog(getInventoryItems().filter((item) => item.itemName))
        })
        return () => { active = false }
    }, [])

    const patch = (partial) => onChange?.({ ...value, ...partial })

    const updateLine = (index, partial) => {
        const next = lines.map((row, i) => {
            if (i !== index) return row
            const merged = { ...row, ...partial }
            if (partial.itemName !== undefined) {
                const found = catalog.find((item) => item.itemName === partial.itemName)
                merged.availableStock = found ? (found.availableQuantity ?? '—') : '—'
            }
            return merged
        })
        patch({ lines: next })
    }

    return (
        <div className='space-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Activity Type</h3>
                <select
                    className={`${selectClass} max-w-xs`}
                    value={activityType}
                    onChange={(e) => patch({ activityType: e.target.value })}
                >
                    {ACTIVITY_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Common Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Employee Name *</label>
                        <input type='text' value={value?.employeeName || ''} onChange={(e) => patch({ employeeName: e.target.value })} placeholder='Enter employee name' className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Employee ID *</label>
                        <input type='text' value={value?.employeeId || ''} onChange={(e) => patch({ employeeId: e.target.value })} placeholder='e.g. EMP-1042' className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Department *</label>
                        <select value={value?.department || ''} onChange={(e) => patch({ department: e.target.value })} className={selectClass}>
                            <option value='' disabled>Select department</option>
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Remarks</label>
                        <textarea rows={2} value={value?.remarks || ''} onChange={(e) => patch({ remarks: e.target.value })} placeholder='Optional remarks' className={`${inputClass} resize-none`} />
                    </div>
                </div>
            </div>

            <div>
                <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Products *</h3>
                    <button
                        type='button'
                        onClick={() => patch({ lines: [...lines, emptyLine()] })}
                        className='inline-flex items-center gap-1 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-3 py-1.5 hover:bg-[#515DEF] hover:text-white cursor-pointer'
                    >
                        <Plus size={14} /> Add product
                    </button>
                </div>
                <div className='space-y-4'>
                    {lines.map((line, index) => (
                        <div key={`line-${index}`} className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border border-[#EEF0F6] rounded-xl p-4'>
                            <div className='flex flex-col gap-y-2 lg:col-span-2'>
                                <label className='text-sm font-medium text-[#1E1E1E]'>Item Name *</label>
                                <select
                                    className={selectClass}
                                    value={line.itemName}
                                    onChange={(e) => updateLine(index, { itemName: e.target.value })}
                                >
                                    <option value='' disabled>Select item</option>
                                    {catalog.map((item) => (
                                        <option key={item.itemId || item.itemName} value={item.itemName}>{item.itemName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <label className='text-sm font-medium text-[#1E1E1E]'>
                                    {activityType === 'Return' ? 'Qty Returned *' : 'Quantity *'}
                                </label>
                                <input
                                    type='number'
                                    min={1}
                                    className={inputClass}
                                    value={line.quantity}
                                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                                />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <label className='text-sm font-medium text-[#1E1E1E]'>Available Stock</label>
                                <div className='flex gap-2 items-center'>
                                    <input type='text' readOnly value={line.availableStock} className={`${inputClass} bg-[#F9F9F9]`} />
                                    {lines.length > 1 ? (
                                        <button type='button' onClick={() => patch({ lines: lines.filter((_, i) => i !== index) })} className='text-[#B42318] cursor-pointer' aria-label='Remove product'>
                                            <Trash2 size={16} />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {activityType === 'Issue' && (
                <div>
                    <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Issue Details</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Issue Date *</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={value?.issueDate || null}
                                    onChange={(date) => patch({ issueDate: date })}
                                    dateFormat='dd/MM/yyyy'
                                    placeholderText='Select issue date'
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Purpose</label>
                            <select value={value?.purpose || ''} onChange={(e) => patch({ purpose: e.target.value })} className={selectClass}>
                                <option value=''>Select purpose</option>
                                {PURPOSE_OPTIONS.map((purpose) => (
                                    <option key={purpose} value={purpose}>{purpose}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {activityType === 'Receiving' && (
                <div>
                    <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Receiving Details</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Against Given Entry</label>
                            <input
                                type='text'
                                value={value?.originalIssueRef || ''}
                                onChange={(e) => patch({ originalIssueRef: e.target.value })}
                                placeholder='Given entry ID (optional)'
                                className={inputClass}
                            />
                            <p className='text-xs text-[#667085]'>
                                When set, the quantity is checked against what was given and the outstanding balance is tracked. Partial receiving is allowed.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activityType === 'Return' && (
                <div>
                    <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Return Details</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Original Issue Reference *</label>
                            <input
                                type='text'
                                value={value?.originalIssueRef || ''}
                                onChange={(e) => patch({ originalIssueRef: e.target.value })}
                                placeholder='e.g. IR-2026-0035'
                                className={inputClass}
                            />
                            <p className='text-xs text-[#667085]'>Links this return to the earlier issue for tracking (Return Reg / issue ref).</p>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Return Date *</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={value?.returnDate || null}
                                    onChange={(date) => patch({ returnDate: date })}
                                    dateFormat='dd/MM/yyyy'
                                    placeholderText='Select return date'
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                        <div className='lg:col-span-3'>
                            <span className='text-base font-medium text-[#1E1E1E]'>Item Condition *</span>
                            <div className='flex flex-wrap gap-4 mt-3'>
                                {CONDITION_OPTIONS.map((condition) => (
                                    <label key={condition} className='flex items-center gap-x-2 text-sm text-[#1E1E1E] cursor-pointer border border-[#D9D9D9] rounded-md px-4 py-2.5 hover:border-[#515DEF]'>
                                        <input
                                            type='radio'
                                            name='condition'
                                            value={condition}
                                            checked={(value?.condition || 'Good') === condition}
                                            onChange={() => patch({ condition })}
                                            className='accent-[#515DEF]'
                                        />
                                        {condition}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default IssueReturnInfo
