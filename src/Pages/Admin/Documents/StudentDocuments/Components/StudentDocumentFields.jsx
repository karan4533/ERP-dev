import React from 'react'
import { toast } from 'react-toastify'
import DocumentFileUpload from '../../EmployeeDocuments/Components/DocumentFileUpload'
import { openStoredDocument } from '../../../../../services/documentsApi'
import { documentStatusColor } from '../studentDocumentsData'

const ViewStoredFile = ({ downloadUrl }) => (
    <button
        type='button'
        onClick={async () => {
            try {
                await openStoredDocument(downloadUrl)
            } catch (error) {
                toast.error(error?.status === 403 ? 'You do not have permission to open this file.' : 'The file could not be opened.')
            }
        }}
        className='self-start text-xs font-medium text-[#515DEF] hover:underline cursor-pointer'
    >
        View file
    </button>
)

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
                        {slot.downloadUrl ? <ViewStoredFile downloadUrl={slot.downloadUrl} /> : null}
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
                        downloadUrl={slot.downloadUrl}
                        onChange={(fileName, file) => updateSlot(slot.typeId, { fileName, file })}
                    />
                </div>
            ))}
        </div>
    )
}

export default StudentDocumentFields
