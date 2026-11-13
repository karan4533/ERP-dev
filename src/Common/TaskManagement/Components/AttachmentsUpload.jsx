import { useEffect, useId, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { MAX_ATTACHMENT_SIZE_MB, validateAttachment } from '../attachmentValidation'

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const AttachmentsUpload = () => {
    const [fileData, setFileData] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef(null)
    const inputId = `task-attachment-${useId().replace(/:/g, '')}`

    useEffect(() => () => {
        if (fileData?.objectURL) URL.revokeObjectURL(fileData.objectURL)
    }, [fileData])

    const handleFile = (file) => {
        const validation = validateAttachment(file)
        if (!validation.valid) {
            setError(validation.error)
            return
        }

        setError('')
        const objectURL = URL.createObjectURL(file)
        const ext = file.name.split('.').pop().toUpperCase()
        setFileData({ name: file.name, size: formatSize(file.size), ext, objectURL })
    }

    const handleDrop = (event) => {
        event.preventDefault()
        setIsDragging(false)
        handleFile(event.dataTransfer.files[0])
    }

    const handleDelete = () => {
        setFileData(null)
        setError('')
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div>
            <input ref={inputRef} id={inputId} type='file' accept='.pdf,.jpg,.jpeg,.png' className='sr-only' onChange={(event) => handleFile(event.target.files[0])} aria-describedby={`${inputId}-hint${error ? ` ${inputId}-error` : ''}`} />
            <div
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
                onDragLeave={(event) => { event.preventDefault(); setIsDragging(false) }}
                onDrop={handleDrop}
                className={`relative flex min-h-36 w-full flex-col items-center justify-center rounded-[var(--erp-radius-surface)] border-2 border-dashed p-4 ${isDragging ? 'border-[var(--erp-indigo)] bg-[#F1F2FF]' : 'border-[var(--erp-line-strong)] bg-white'}`}
            >
                {fileData ? (
                    <div className='flex flex-col items-center gap-2 text-center'>
                        <span className='inline-flex size-12 items-center justify-center rounded-full bg-[var(--erp-canvas)] text-xs font-bold text-[var(--erp-indigo)]'>{fileData.ext}</span>
                        <span className='max-w-xs truncate text-sm font-semibold text-[var(--erp-ink)]'>{fileData.name}</span>
                        <span className='text-xs text-[var(--erp-muted)]'>{fileData.size} · local preview only</span>
                        <div className='flex flex-wrap justify-center gap-2'>
                            <a href={fileData.objectURL} target='_blank' rel='noreferrer' className='inline-flex min-h-9 items-center rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-ink)]'>Preview</a>
                            <button type='button' onClick={handleDelete} className='min-h-9 rounded-lg border border-[var(--erp-red)] px-3 text-sm font-semibold text-[var(--erp-red)]'>Remove</button>
                        </div>
                    </div>
                ) : (
                    <label htmlFor={inputId} className='flex cursor-pointer flex-col items-center gap-2 text-center'>
                        <span className='inline-flex size-12 items-center justify-center rounded-full border border-[var(--erp-line)] bg-white text-[var(--erp-indigo)]'><FileUp aria-hidden='true' size={22} /></span>
                        <span className='text-sm font-semibold text-[var(--erp-indigo)]'>Choose a file</span>
                        <span id={`${inputId}-hint`} className='text-xs text-[var(--erp-muted)]'>or drag and drop a PDF, JPG or PNG up to {MAX_ATTACHMENT_SIZE_MB} MB</span>
                    </label>
                )}
            </div>
            {error && <p id={`${inputId}-error`} role='alert' className='mt-1.5 text-xs font-medium text-[var(--erp-red)]'>{error}</p>}
        </div>
    )
}

export default AttachmentsUpload

