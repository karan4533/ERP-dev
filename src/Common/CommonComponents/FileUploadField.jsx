import React, { useState } from 'react'
import { FileUp, Loader2, X } from 'lucide-react'
import { fileDownloadUrl, uploadFileWithProgress } from '../../services/filesApi'
import {
    ATTACHMENT_ACCEPT,
    ATTACHMENT_EXTENSIONS,
    ATTACHMENT_MAX_BYTES,
    formatFileSize,
    validateUploadFile,
} from './fileUploadRules'

/**
 * One file field for the whole app.
 * - Upload mode (default): each chosen file is POSTed to /files with resourceType/resourceId, and
 *   onUploaded(asset) is called only after the server stored it.
 * - Deferred mode: the record does not exist yet, so files are only validated and handed to
 *   onPendingChange; the caller uploads them once the record is created.
 * uploadedFiles: server file assets ({ id, original_name, size_bytes, download_url }) shown with download links.
 */
const FileUploadField = ({
    label = 'Attachments',
    resourceType,
    resourceId,
    deferred = false,
    pendingFiles = [],
    onPendingChange,
    uploadedFiles = [],
    onUploaded,
    multiple = true,
    maxFiles = 10,
    accept = ATTACHMENT_ACCEPT,
    extensions = ATTACHMENT_EXTENSIONS,
    maxBytes = ATTACHMENT_MAX_BYTES,
    disabled = false,
    hint,
}) => {
    const [progress, setProgress] = useState(null)
    const [error, setError] = useState('')
    const busy = progress !== null
    const count = (deferred ? pendingFiles.length : 0) + uploadedFiles.length
    const full = count >= maxFiles

    const handleChange = async (event) => {
        const chosen = Array.from(event.target.files || [])
        event.target.value = ''
        if (!chosen.length) return
        setError('')
        const room = Math.max(0, maxFiles - count)
        if (chosen.length > room) {
            setError(`You can attach at most ${maxFiles} files.`)
            return
        }
        const problem = chosen.map((file) => validateUploadFile(file, { extensions, maxBytes })).find(Boolean)
        if (problem) {
            setError(problem)
            return
        }
        if (deferred) {
            onPendingChange?.([...pendingFiles, ...chosen])
            return
        }
        for (const file of chosen) {
            setProgress({ name: file.name, percent: 0 })
            try {
                const asset = await uploadFileWithProgress(file, {
                    resourceType,
                    resourceId,
                    onProgress: (percent) => setProgress({ name: file.name, percent }),
                })
                onUploaded?.(asset)
            } catch (uploadError) {
                setError(`${file.name}: ${uploadError?.message || 'Upload failed.'}`)
                break
            } finally {
                setProgress(null)
            }
        }
    }

    const removePending = (index) => onPendingChange?.(pendingFiles.filter((_, position) => position !== index))
    const typesLabel = extensions.map((item) => item.slice(1).toUpperCase()).join(', ')

    return (
        <div className='flex flex-col gap-y-2'>
            {label ? <span className='text-base font-medium text-[#1E1E1E]'>{label}</span> : null}
            <div className='flex flex-wrap items-center gap-3'>
                <label
                    className={`inline-flex items-center gap-2 rounded-md bg-[#515DEF] px-4 py-2 text-sm font-medium text-white ${
                        disabled || busy || full ? 'opacity-60 pointer-events-none' : 'cursor-pointer hover:opacity-90'
                    }`}
                >
                    {busy ? <Loader2 size={16} className='animate-spin' /> : <FileUp size={16} />}
                    Browse
                    <input
                        type='file'
                        accept={accept}
                        multiple={multiple}
                        disabled={disabled || busy || full}
                        onChange={handleChange}
                        className='sr-only'
                    />
                </label>
                <span className='text-xs text-[#667085]'>
                    {hint || `${typesLabel} · up to ${Math.round(maxBytes / (1024 * 1024))} MB each · max ${maxFiles} files`}
                </span>
            </div>

            {busy ? (
                <div className='text-xs text-[#667085]' role='status'>
                    Uploading {progress.name}… {progress.percent}%
                    <div className='mt-1 h-1.5 w-full max-w-xs rounded bg-[#EDEEF5]'>
                        <div className='h-1.5 rounded bg-[#515DEF]' style={{ width: `${progress.percent}%` }} />
                    </div>
                </div>
            ) : null}
            {error ? (
                <p role='alert' className='text-xs text-[#B42318]'>{error}</p>
            ) : null}

            {deferred && pendingFiles.length > 0 ? (
                <ul className='space-y-1 text-sm'>
                    {pendingFiles.map((file, index) => (
                        <li key={`${file.name}-${index}`} className='flex items-center gap-2 text-[#1E1E1E]'>
                            <span className='truncate max-w-[16rem]'>{file.name}</span>
                            <span className='text-xs text-[#667085]'>{formatFileSize(file.size)} · uploads when saved</span>
                            <button
                                type='button'
                                onClick={() => removePending(index)}
                                disabled={disabled}
                                className='text-[#B42318] cursor-pointer disabled:opacity-50'
                                aria-label={`Remove ${file.name}`}
                            >
                                <X size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}

            <AttachmentLinks files={uploadedFiles} />
        </div>
    )
}

/** Download links for server file assets (the link carries the session token for <a href> downloads). */
export const AttachmentLinks = ({ files = [] }) =>
    files.length > 0 ? (
        <ul className='space-y-1 text-sm'>
            {files.map((asset) => (
                <li key={asset.id} className='flex items-center gap-2'>
                    <a
                        href={fileDownloadUrl(asset.download_url || `/api/v1/files/${asset.id}/download`)}
                        target='_blank'
                        rel='noreferrer'
                        className='text-[#515DEF] underline truncate max-w-[16rem]'
                    >
                        {asset.original_name || asset.id}
                    </a>
                    {asset.size_bytes ? <span className='text-xs text-[#667085]'>{formatFileSize(asset.size_bytes)}</span> : null}
                </li>
            ))}
        </ul>
    ) : null

export default FileUploadField
