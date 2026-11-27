import React, { useEffect, useState } from 'react'
import FileUploadField, { AttachmentLinks } from './FileUploadField'
import { listAttachedFilesApi } from '../../services/filesApi'

/**
 * Server-stored attachments of one task / ticket. The list comes from the server (which only answers
 * people who can see the record); canUpload adds a Browse button that uploads straight to the record.
 */
const ResourceAttachments = ({ resourceType, resourceId, canUpload = false, label = 'Attachments' }) => {
    const [files, setFiles] = useState([])
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        if (!resourceId) return undefined
        let cancelled = false
        listAttachedFilesApi(resourceType, resourceId)
            .then((rows) => {
                if (cancelled) return
                setFiles(Array.isArray(rows) ? rows : [])
                setStatus('ready')
            })
            .catch((loadError) => {
                if (cancelled) return
                setError(loadError?.message || 'Attachments could not be loaded.')
                setStatus('error')
            })
        return () => {
            cancelled = true
        }
    }, [resourceType, resourceId, reloadKey])

    const retry = () => {
        setStatus('loading')
        setError('')
        setReloadKey((key) => key + 1)
    }

    if (status === 'loading') {
        return <p className='text-sm text-[#667085]'>Loading attachments…</p>
    }
    if (status === 'error') {
        return (
            <div role='alert' className='text-sm text-[#B42318]'>
                {error}{' '}
                <button type='button' onClick={retry} className='text-[#515DEF] underline cursor-pointer'>Retry</button>
            </div>
        )
    }

    return (
        <div className='flex flex-col gap-y-2'>
            {canUpload ? (
                <FileUploadField
                    label={label}
                    resourceType={resourceType}
                    resourceId={resourceId}
                    uploadedFiles={files}
                    onUploaded={(asset) => setFiles((prev) => [...prev, asset])}
                />
            ) : (
                <>
                    <span className='text-base font-medium text-[#1E1E1E]'>{label}</span>
                    <AttachmentLinks files={files} />
                </>
            )}
            {!files.length ? <p className='text-sm text-[#667085]'>No attachments.</p> : null}
        </div>
    )
}

export default ResourceAttachments
