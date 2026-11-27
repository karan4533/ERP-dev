import { useId, useState } from 'react'
import { FileText, FileUp, Trash2 } from 'lucide-react'

const MAX_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml']
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf']

const FileDropzone = ({
    value = '',
    onChange,
    label = 'Upload file',
    acceptDocuments = false,
    valueMode = 'data-url',
}) => {
    const inputId = useId()
    const errorId = `${inputId}-error`
    const [internalValue, setInternalValue] = useState(value)
    const [fileName, setFileName] = useState(value ? 'Current file' : '')
    const [fileType, setFileType] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState('')
    const selectedValue = value || internalValue
    const supportedTypes = acceptDocuments ? DOCUMENT_TYPES : IMAGE_TYPES

    const commitValue = (nextValue, file = null) => {
        setInternalValue(nextValue)
        onChange?.(nextValue, file)
    }

    const handleFile = (file) => {
        if (!file) return
        if (!supportedTypes.includes(file.type)) {
            setError(acceptDocuments ? 'Choose a PDF, JPG, PNG or SVG file.' : 'Choose a JPG, PNG or SVG image.')
            return
        }
        if (file.size > MAX_BYTES) {
            setError('Choose a file that is 5 MB or smaller.')
            return
        }

        setError('')
        setFileName(file.name)
        setFileType(file.type)
        if (valueMode === 'name') {
            commitValue(file.name, file)
            return
        }

        const reader = new FileReader()
        reader.onload = () => commitValue(String(reader.result || ''), file)
        reader.onerror = () => setError('The file could not be read. Try another file.')
        reader.readAsDataURL(file)
    }

    const removeFile = () => {
        setFileName('')
        setFileType('')
        setError('')
        commitValue('', null)
    }

    return (
        <div>
            <div
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
                onDragLeave={(event) => { event.preventDefault(); setIsDragging(false) }}
                onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFile(event.dataTransfer.files[0]) }}
                className={`rounded-xl border-2 border-dashed p-4 transition-colors ${isDragging ? 'border-[var(--erp-indigo)] bg-[var(--erp-indigo-soft)]' : 'border-[var(--erp-line-strong)] bg-white'}`}
            >
                <input
                    id={inputId}
                    type='file'
                    accept={acceptDocuments ? '.pdf,.jpg,.jpeg,.png,.svg' : '.jpg,.jpeg,.png,.svg'}
                    onChange={(event) => handleFile(event.target.files[0])}
                    className='sr-only'
                    aria-describedby={error ? errorId : undefined}
                />
                <label htmlFor={inputId} className='flex min-h-24 cursor-pointer flex-col items-center justify-center text-center'>
                    <span className='inline-flex size-10 items-center justify-center rounded-full bg-[var(--erp-indigo-soft)] text-[var(--erp-indigo)]'>
                        <FileUp aria-hidden='true' size={20} />
                    </span>
                    <span className='mt-2 text-sm font-semibold text-[var(--erp-indigo)]'>{selectedValue ? `Replace ${label.toLowerCase()}` : label}</span>
                    <span className='mt-1 text-xs text-[var(--erp-muted)]'>Drag and drop or choose a file · {acceptDocuments ? 'PDF, JPG, PNG, SVG' : 'JPG, PNG, SVG'} · max 5 MB</span>
                </label>

                {selectedValue && (
                    <div className='mt-3 flex items-center gap-3 rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
                        {fileType.startsWith('image/') && valueMode === 'data-url' ? (
                            <img src={selectedValue} alt='Selected upload preview' className='size-12 rounded-lg object-cover' />
                        ) : (
                            <span className='inline-flex size-12 items-center justify-center rounded-lg bg-white text-[var(--erp-indigo)]'><FileText aria-hidden='true' size={22} /></span>
                        )}
                        <span className='min-w-0 flex-1 truncate text-sm font-medium text-[var(--erp-ink)]'>{fileName || 'Selected file'}</span>
                        <button type='button' onClick={removeFile} className='inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-[#B42318]' aria-label={`Remove ${fileName || 'selected file'}`}>
                            <Trash2 aria-hidden='true' size={15} /> Remove
                        </button>
                    </div>
                )}
            </div>
            {error && <p id={errorId} role='alert' className='mt-2 text-sm text-[#B42318]'>{error}</p>}
        </div>
    )
}

export default FileDropzone
