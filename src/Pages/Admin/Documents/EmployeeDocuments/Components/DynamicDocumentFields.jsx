import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import DocumentFileUpload from './DocumentFileUpload'
import { DOCUMENT_STATUS_OPTIONS } from '../employeeDocumentsData'

const createSlot = () => ({
    key: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: '',
    fileName: '',
    status: 'Pending',
})

const DynamicDocumentFields = ({ slots, onChange }) => {
    const updateSlot = (key, patch) => {
        onChange(slots.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)))
    }

    const removeSlot = (key) => {
        onChange(slots.filter((slot) => slot.key !== key))
    }

    const addSlot = () => {
        onChange([...slots, createSlot()])
    }

    return (
        <div className='space-y-4'>
            {slots.map((slot, index) => (
                <div
                    key={slot.key}
                    className='grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 border border-[#E4E7EC] rounded-xl'
                >
                    <div className='lg:col-span-4 flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>
                            Document Label {index + 1}
                        </label>
                        <input
                            type='text'
                            value={slot.label}
                            onChange={(e) => updateSlot(slot.key, { label: e.target.value })}
                            placeholder='e.g. Aadhaar Card, Offer Letter…'
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Status</label>
                        <select
                            value={slot.status}
                            onChange={(e) => updateSlot(slot.key, { status: e.target.value })}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        >
                            {DOCUMENT_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='lg:col-span-4 flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Upload File</label>
                        <DocumentFileUpload
                            fileName={slot.fileName}
                            onChange={(fileName) => updateSlot(slot.key, { fileName })}
                        />
                    </div>
                    <div className='lg:col-span-1 flex items-end justify-end pb-2'>
                        <button
                            type='button'
                            onClick={() => removeSlot(slot.key)}
                            disabled={slots.length === 1}
                            className='inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                        >
                            <Trash2 size={16} />
                            Remove
                        </button>
                    </div>
                </div>
            ))}

            <button
                type='button'
                onClick={addSlot}
                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'
            >
                <Plus size={16} />
                Add another document
            </button>
        </div>
    )
}

export default DynamicDocumentFields
