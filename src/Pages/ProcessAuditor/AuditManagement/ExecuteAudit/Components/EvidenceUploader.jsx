import React, { useState } from 'react'
import { Camera, FileText, Video, Link2 } from 'lucide-react'
import { emptyEvidence } from '../executeAuditData'

const IconButton = ({ icon: Icon, active, title, onClick, children }) => (
    <label
        title={title}
        className={`relative flex items-center justify-center size-9 rounded-lg cursor-pointer transition-all duration-200 ${
            active
                ? 'bg-[#515DEF] text-white shadow-md scale-105'
                : 'bg-[#F5F6FA] text-[#667085] hover:bg-[#515DEF]/10 hover:text-[#515DEF]'
        }`}
    >
        <Icon size={18} />
        {children}
    </label>
)

const EvidenceUploader = ({ evidence, onChange, showUrlInput: controlledShowUrl, onToggleUrl }) => {
    const [internalShowUrl, setInternalShowUrl] = useState(!!evidence?.url)
    const showUrlInput = controlledShowUrl ?? internalShowUrl
    const toggleUrl = onToggleUrl ?? (() => setInternalShowUrl((prev) => !prev))
    const safeEvidence = evidence ?? emptyEvidence()
    const update = (field, value) => onChange({ ...safeEvidence, [field]: value })

    const handleFile = (field, e) => {
        const file = e.target.files?.[0]
        update(field, file?.name ?? '')
    }

    return (
        <div className='flex items-center gap-1.5'>
            <IconButton icon={Camera} active={!!safeEvidence.photo} title='Upload Photo'>
                <input type='file' accept='image/*' className='hidden' onChange={(e) => handleFile('photo', e)} />
            </IconButton>
            <IconButton icon={FileText} active={!!safeEvidence.file} title='Upload File'>
                <input type='file' accept='.pdf,.doc,.docx' className='hidden' onChange={(e) => handleFile('file', e)} />
            </IconButton>
            <IconButton icon={Video} active={!!safeEvidence.video} title='Upload Video'>
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
                    value={safeEvidence.url}
                    onChange={(e) => update('url', e.target.value)}
                    placeholder='Paste evidence URL'
                    className='text-xs px-2 py-1.5 rounded-lg border border-[#D9D9D9] w-36 outline-none focus:border-[#515DEF] transition-colors'
                />
            )}
        </div>
    )
}

export default EvidenceUploader
