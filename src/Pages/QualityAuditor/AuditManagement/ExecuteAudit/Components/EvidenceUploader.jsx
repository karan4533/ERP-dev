import React, { useState } from 'react'
import { Camera, FileText, Video, Link2, Loader2 } from 'lucide-react'
import { emptyEvidence } from '../executeAuditData'
import { uploadProfileImage, fileDownloadUrl } from '../../../../../services/filesApi'

const IconButton = ({ icon: Icon, active, title, onClick, children, busy }) => (
    <label
        title={title}
        className={`relative flex items-center justify-center size-9 rounded-lg cursor-pointer transition-all duration-200 ${
            active
                ? 'bg-[#515DEF] text-white shadow-md scale-105'
                : 'bg-[#F5F6FA] text-[#667085] hover:bg-[#515DEF]/10 hover:text-[#515DEF]'
        } ${busy ? 'opacity-60 pointer-events-none' : ''}`}
    >
        {busy ? <Loader2 size={18} className='animate-spin' /> : <Icon size={18} />}
        {children}
    </label>
)

const evidenceLabel = (slot) => {
    if (!slot) return ''
    if (typeof slot === 'string') return slot
    return slot.name || slot.fileId || ''
}

const EvidenceUploader = ({ evidence, onChange, showUrlInput: controlledShowUrl, onToggleUrl }) => {
    const [internalShowUrl, setInternalShowUrl] = useState(!!evidence?.url)
    const [busyField, setBusyField] = useState('')
    const [error, setError] = useState('')
    const showUrlInput = controlledShowUrl ?? internalShowUrl
    const toggleUrl = onToggleUrl ?? (() => setInternalShowUrl((prev) => !prev))
    const safeEvidence = evidence ?? emptyEvidence()
    const update = (field, value) => onChange({ ...safeEvidence, [field]: value })

    const handleFile = async (field, e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setError('')
        setBusyField(field)
        try {
            const asset = await uploadProfileImage(file, 'audit-evidence')
            const fileId = asset?.id
            if (!fileId) throw new Error('Upload did not return a file id')
            update(field, {
                name: file.name,
                fileId,
                downloadPath: `/api/v1/files/${fileId}/download`,
                mimeType: file.type || asset?.content_type || '',
                size: file.size,
            })
        } catch (err) {
            setError(err?.message || 'Evidence upload failed')
            // Do not pretend success with filename-only
            update(field, '')
        } finally {
            setBusyField('')
        }
    }

    const slotActive = (field) => {
        const slot = safeEvidence[field]
        if (!slot) return false
        if (typeof slot === 'object') return Boolean(slot.fileId || slot.name)
        return Boolean(slot)
    }

    return (
        <div className='space-y-1.5'>
            <div className='flex items-center gap-1.5 flex-wrap'>
                <IconButton icon={Camera} active={slotActive('photo')} title='Upload Photo' busy={busyField === 'photo'}>
                    <input type='file' accept='image/png,image/jpeg,image/*,.png,.jpg,.jpeg' className='hidden' onChange={(e) => handleFile('photo', e)} />
                </IconButton>
                <IconButton icon={FileText} active={slotActive('file')} title='Upload File' busy={busyField === 'file'}>
                    <input type='file' accept='.pdf,.doc,.docx,.png,image/png,image/*,application/pdf' className='hidden' onChange={(e) => handleFile('file', e)} />
                </IconButton>
                <IconButton icon={Video} active={slotActive('video')} title='Upload Video' busy={busyField === 'video'}>
                    <input type='file' accept='video/*' className='hidden' onChange={(e) => handleFile('video', e)} />
                </IconButton>
                <button
                    type='button'
                    onClick={toggleUrl}
                    title='Add URL'
                    className={`flex items-center justify-center size-9 rounded-lg transition-all duration-200 ${
                        safeEvidence.url || showUrlInput
                            ? 'bg-[#515DEF] text-white shadow-md'
                            : 'bg-[#F5F6FA] text-[#667085] hover:bg-[#515DEF]/10 hover:text-[#515DEF]'
                    }`}
                >
                    <Link2 size={18} />
                </button>
                {showUrlInput && (
                    <input
                        type='url'
                        value={typeof safeEvidence.url === 'string' ? safeEvidence.url : safeEvidence.url?.url || ''}
                        onChange={(e) => update('url', e.target.value)}
                        placeholder='Paste evidence URL'
                        className='text-xs px-2 py-1.5 rounded-lg border border-[#D9D9D9] w-36 outline-none focus:border-[#515DEF] transition-colors'
                    />
                )}
                {['photo', 'file', 'video'].map((field) => {
                    const slot = safeEvidence[field]
                    const label = evidenceLabel(slot)
                    if (!label) return null
                    const href =
                        typeof slot === 'object' && slot.downloadPath
                            ? fileDownloadUrl(slot.downloadPath)
                            : typeof slot === 'object' && slot.fileId
                              ? fileDownloadUrl(`/api/v1/files/${slot.fileId}/download`)
                              : ''
                    return href ? (
                        <a
                            key={field}
                            href={href}
                            target='_blank'
                            rel='noreferrer'
                            className='text-[11px] text-[#515DEF] underline max-w-[8rem] truncate'
                        >
                            {label}
                        </a>
                    ) : (
                        <span key={field} className='text-[11px] text-[#667085] max-w-[8rem] truncate'>
                            {label}
                        </span>
                    )
                })}
            </div>
            {error ? <p className='text-xs text-[#FF0000]'>{error}</p> : null}
        </div>
    )
}

export default EvidenceUploader
