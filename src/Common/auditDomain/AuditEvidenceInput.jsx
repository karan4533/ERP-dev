import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { uploadAuditEvidenceApi } from '../../services/auditRecipientApi'
import { fileDownloadUrl } from '../../services/filesApi'

export const AUDIT_EVIDENCE_ACCEPT = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,application/pdf,image/png,image/jpeg'

/** Uploads the chosen file to the server; `onUploaded(asset | null)` only fires after the server confirms. */
const AuditEvidenceInput = ({ stream, kind = 'audit', resourceId = null, value, onUploaded, className = '' }) => {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const handleChange = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        setBusy(true)
        setError('')
        try {
            onUploaded(await uploadAuditEvidenceApi(file, { stream, kind, resourceId }))
        } catch (err) {
            setError(err?.message || 'Upload failed. Use a PDF, PNG, JPG, Word or Excel file.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className='flex flex-col gap-1'>
            <input
                type='file'
                accept={AUDIT_EVIDENCE_ACCEPT}
                disabled={busy}
                onChange={handleChange}
                className={className}
            />
            {busy ? (
                <p className='text-xs text-[#667085] inline-flex items-center gap-1'><Loader2 size={12} className='animate-spin' /> Uploading…</p>
            ) : null}
            {error ? <p className='text-xs text-[#FF0000]'>{error}</p> : null}
            {value?.fileId ? (
                <p className='text-xs text-[#667085]'>
                    Uploaded:{' '}
                    <a href={fileDownloadUrl(value.downloadPath)} target='_blank' rel='noreferrer' className='text-[#515DEF] underline'>
                        {value.name}
                    </a>{' '}
                    <button type='button' onClick={() => onUploaded(null)} className='text-[#FF0000] underline cursor-pointer'>Remove</button>
                </p>
            ) : null}
        </div>
    )
}

export default AuditEvidenceInput
