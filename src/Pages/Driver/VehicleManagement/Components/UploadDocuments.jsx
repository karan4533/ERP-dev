import React, { useCallback, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import ProofUpload from './ProofUpload'
import { VEHICLE_DOCUMENT_SLOTS } from '../vehicleDocumentsData'

const UploadDocuments = () => {
    const [uploadedMap, setUploadedMap] = useState(() =>
        VEHICLE_DOCUMENT_SLOTS.reduce((acc, slot) => {
            acc[slot.id] = Boolean(slot.defaultFile)
            return acc
        }, {}),
    )

    const handleChange = useCallback((slotId, file) => {
        setUploadedMap((prev) => ({ ...prev, [slotId]: Boolean(file) }))
    }, [])

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2'>
            {VEHICLE_DOCUMENT_SLOTS.map((slot) => (
                <div key={slot.id} className='flex flex-col gap-y-2'>
                    <div className='flex items-center gap-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>
                            {slot.label}
                        </label>
                        {uploadedMap[slot.id] && (
                            <CheckCircle2 size={18} className='text-[#4CAF50] shrink-0' aria-label='Document uploaded' />
                        )}
                    </div>
                    <ProofUpload
                        defaultFile={slot.defaultFile}
                        maxSizeMb={2}
                        onChange={(file) => handleChange(slot.id, file)}
                    />
                </div>
            ))}
        </div>
    )
}

export default UploadDocuments
