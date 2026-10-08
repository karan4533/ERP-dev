import React from 'react'
import DocumentFileUpload from '../../EmployeeDocuments/Components/DocumentFileUpload'
import { documentStatusColor } from '../studentDocumentsData'

const StudentDocumentFields = ({ slots, onChange, statusReadOnly = false, readOnly = false }) => {
    const readOnlyFieldClass =
        'text-sm font-normal text-[#667085] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9FAFB]'

    const updateSlot = (typeId, patch) => {
        onChange?.(slots.map((slot) => (slot.typeId === typeId ? { ...slot, ...patch } : slot)))
    }

    if (readOnly) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mt-2'>
                {slots.map((slot) => (
                    <div key={slot.typeId} className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>{slot.label}</label>
                        <div
                            className={`text-sm font-semibold border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-[#F9FAFB] ${documentStatusColor[slot.status] || 'text-[#667085]'}`}
                        >
                            {slot.status}
                        </div>
                        <div className={readOnlyFieldClass}>
                            {slot.fileName?.trim() ? slot.fileName : '—'}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mt-2'>
            {slots.map((slot) => (
                <div key={slot.typeId} className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>{slot.label}</label>
                    {statusReadOnly ? (
                        <div className='flex flex-col gap-1 mb-1'>
                            <div
                                className={`text-sm font-semibold border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-[#F9FAFB] ${documentStatusColor[slot.status] || 'text-[#667085]'}`}
                            >
                                {slot.status}
                            </div>
                            <p className='text-xs text-[#667085]'>
                                System-controlled — updates automatically on submit
                            </p>
                        </div>
                    ) : (
                        <select
                            value={slot.status}
                            onChange={(e) => updateSlot(slot.typeId, { status: e.target.value })}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full mb-1'
                        >
                            <option value='Pending'>Pending</option>
                            <option value='Submitted'>Submitted</option>
                        </select>
                    )}
                    <DocumentFileUpload
                        fileName={slot.fileName}
                        onChange={(fileName) => updateSlot(slot.typeId, { fileName })}
                    />
                </div>
            ))}
        </div>
    )
}

export default StudentDocumentFields
