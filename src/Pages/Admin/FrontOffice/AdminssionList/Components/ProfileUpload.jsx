import React, { useRef, useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { isApiAdmissionsEnabled } from '../../../../../services/apiClient'
import { fileDownloadUrl, uploadProfileImage } from '../../../../../services/filesApi'

/**
 * FO admission profile photo.
 * API mode: POSTs to /files (resourceType admission|admission_enquiry) and only then updates the form.
 * Offline/demo: keeps a local data-URL preview (filename-only behaviour elsewhere is unchanged).
 */
const ProfileUpload = ({
    value = '',
    onChange,
    resourceType = 'admission',
    /** When true (and admissions API auth is on), POST to /files before updating the form. */
    serverUpload = false,
}) => {
    const [isDragging, setIsDragging] = useState(false)
    const [fileName, setFileName] = useState(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef(null)
    const apiMode = Boolean(serverUpload) && isApiAdmissionsEnabled()
    const preview = value || null

    const SUPPORTED_FORMATS = apiMode
        ? ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        : ['image/svg+xml', 'image/jpeg', 'image/jpg', 'image/png']
    const MAX_SIZE_MB = 5

    const handleFile = async (file) => {
        if (!file) return
        setError('')

        if (apiMode) {
            // MIME can be empty/wrong; extension is re-checked by the server.
            const extension = `.${(file.name || '').split('.').pop()?.toLowerCase() || ''}`
            if (!['.png', '.jpg', '.jpeg', '.pdf'].includes(extension)) {
                setError('Unsupported format. Please upload PDF, JPG, or PNG.')
                return
            }
        } else if (!SUPPORTED_FORMATS.includes(file.type)) {
            setError('Unsupported format. Please upload svg, jpg, or png.')
            return
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`File size exceeds ${MAX_SIZE_MB}MB limit.`)
            return
        }

        setFileName(file.name)

        if (!apiMode) {
            const reader = new FileReader()
            reader.onload = (e) => onChange?.(e.target.result || '', null)
            reader.readAsDataURL(file)
            return
        }

        setBusy(true)
        try {
            const asset = await uploadProfileImage(file, resourceType)
            const url = fileDownloadUrl(asset.download_url || `/api/v1/files/${asset.id}/download`)
            onChange?.(url, asset.id)
        } catch (uploadError) {
            setError(uploadError?.message || 'Upload failed.')
            setFileName(null)
        } finally {
            setBusy(false)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFile(e.dataTransfer.files[0])
    }

    const handleChange = (e) => {
        handleFile(e.target.files[0])
        e.target.value = ''
    }

    const handleRemove = (e) => {
        e.stopPropagation()
        onChange?.('', null)
        setFileName(null)
        setError('')
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div className=''>
            <div
                onClick={() => !busy && inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[140px] rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200
          ${isDragging
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                    }
          ${busy ? 'opacity-60 pointer-events-none' : ''}
        `}
            >
                <input
                    ref={inputRef}
                    type='file'
                    accept={apiMode ? '.pdf,.jpg,.jpeg,.png' : '.svg,.jpg,.jpeg,.png'}
                    className='hidden'
                    onChange={handleChange}
                    disabled={busy}
                />

                {preview ? (
                    <div className='flex flex-col items-center gap-3 py-5'>
                        <div className='relative'>
                            <img
                                src={preview}
                                alt='Profile preview'
                                className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-200 shadow-md'
                            />
                            <button
                                type='button'
                                onClick={handleRemove}
                                className='absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 shadow transition-colors cursor-pointer'
                                title='Remove'
                            >
                                ✕
                            </button>
                        </div>
                        <span className='text-xs text-gray-500 max-w-[180px] truncate'>{fileName}</span>
                        <span className='text-xs text-indigo-500 font-medium'>
                            {apiMode ? 'Stored on server · click to replace' : 'Click to replace'}
                        </span>
                    </div>
                ) : (
                    <div className='flex flex-col items-center gap-2 py-8 px-4 select-none'>
                        <div className='w-12 h-12 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center mb-1'>
                            {busy ? <Loader2 className='w-6 h-6 text-indigo-400 animate-spin' /> : <FileUp className='w-6 h-6 text-indigo-400' />}
                        </div>

                        <p className='text-sm text-gray-500'>
                            <span className='text-indigo-500 font-medium hover:underline cursor-pointer'>
                                {busy ? 'Uploading…' : 'Click to Upload'}
                            </span>
                            {' '}or drag and drop
                        </p>
                        <p className='text-xs text-gray-400'>
                            {apiMode
                                ? `Supported Formats: PDF, JPG, PNG, up to ${MAX_SIZE_MB} MB`
                                : `Supported Formats: svg, Jpg, png, upto ${MAX_SIZE_MB} MB`}
                        </p>
                    </div>
                )}
            </div>
            {error ? <p role='alert' className='mt-2 text-xs text-[#B42318]'>{error}</p> : null}
        </div>
    )
}

export default ProfileUpload
