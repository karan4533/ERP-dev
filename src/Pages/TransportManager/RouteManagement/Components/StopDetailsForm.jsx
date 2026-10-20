import React from 'react'
import { Trash2 } from 'lucide-react'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const FIELDS = [
    { key: 'startLocation', label: 'Start Location', placeholder: '' },
    { key: 'endLocation', label: 'End Location', placeholder: '' },
    { key: 'pickUpTime', label: 'Pick Up Time', placeholder: 'e.g. 06:45 AM' },
    { key: 'dropTime', label: 'Drop Time', placeholder: 'e.g. 07:00 AM' },
]

const StopDetailsForm = ({
    stop,
    index = 0,
    onChange,
    onRemove,
    canRemove = false,
}) => (
    <div
        className={`${index > 0 ? 'mt-8 pt-8 border-t border-[#EEF0F6]' : 'lg:mt-8 mt-2'}`}
    >
        <div className='flex items-center justify-between gap-3 mb-4'>
            <h3 className='text-base font-medium text-[#0C1E5B]'>Stop {index + 1}</h3>
            {canRemove && (
                <button
                    type='button'
                    onClick={onRemove}
                    className='inline-flex items-center gap-1.5 text-sm text-[#F04438] border border-[#FDA29B] px-3 py-1.5 rounded-md hover:bg-[#FEF3F2] transition-colors cursor-pointer'
                >
                    <Trash2 size={14} />
                    Remove
                </button>
            )}
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6'>
            {FIELDS.map((field) => (
                <div key={field.key} className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>{field.label}:</label>
                    <input
                        type='text'
                        value={stop?.[field.key] ?? ''}
                        placeholder={field.placeholder || undefined}
                        onChange={(event) => onChange?.(field.key, event.target.value)}
                        className={inputClass}
                    />
                </div>
            ))}
        </div>
    </div>
)

export default StopDetailsForm
