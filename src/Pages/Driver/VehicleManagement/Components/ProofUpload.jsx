import React, { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'

const ProofUpload = ({
    defaultFile = null,
    maxSizeMb = 2,
    onChange,
}) => {
    const [fileData, setFileData] = useState(defaultFile)
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef(null)

    const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}Kb`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const handleFile = (file) => {
        if (!file) return

        if (!SUPPORTED_FORMATS.includes(file.type)) {
            alert('Unsupported format. Please upload PDF, JPG, or PNG.')
            return
        }

        if (file.size > maxSizeMb * 1024 * 1024) {
            alert(`File size exceeds ${maxSizeMb}MB limit.`)
            return
        }

        if (fileData?.objectURL) URL.revokeObjectURL(fileData.objectURL)

        const objectURL = URL.createObjectURL(file)
        const ext = file.name.split('.').pop().toUpperCase()

        setFileData({
            name: file.name,
            size: formatSize(file.size),
            ext,
            objectURL,
        })
        onChange?.({
            name: file.name,
            size: formatSize(file.size),
            ext,
            objectURL,
        })
    }

    const handleDragOver = (event) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (event) => {
        event.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (event) => {
        event.preventDefault()
        setIsDragging(false)
        handleFile(event.dataTransfer.files[0])
    }

    const handleChange = (event) => handleFile(event.target.files[0])

    const handleView = (event) => {
        event.stopPropagation()
        if (fileData?.objectURL) {
            window.open(fileData.objectURL, '_blank')
        }
    }

    const handleDelete = (event) => {
        event.stopPropagation()
        if (fileData?.objectURL) URL.revokeObjectURL(fileData.objectURL)
        setFileData(null)
        onChange?.(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div
            onClick={() => !fileData && inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full min-h-[160px] rounded-xl border-2 transition-all duration-200 ${
                fileData
                    ? 'cursor-default border-[#E5E7EB] bg-white'
                    : 'cursor-pointer border-dashed border-[#D9D9D9] bg-white hover:border-[#515DEF] hover:bg-[#515DEF08]'
            } ${isDragging ? 'border-[#515DEF] bg-[#515DEF0D]' : ''}`}
        >
            <input
                ref={inputRef}
                type='file'
                accept='.pdf,.jpg,.jpeg,.png'
                className='hidden'
                onChange={handleChange}
            />

            {fileData ? (
                <div className='flex flex-col items-center gap-1.5 py-6 px-4'>
                    <div className='size-14 rounded-full bg-[#EDEEF5] flex items-center justify-center mb-1'>
                        <span className='text-xs font-bold text-[#515DEF] tracking-wide'>
                            {fileData.ext}
                        </span>
                    </div>
                    <span className='text-sm font-semibold text-[#1E1E1E] max-w-[200px] truncate'>
                        {fileData.name}
                    </span>
                    <span className='text-xs text-[#667085] mb-2'>
                        {fileData.size}
                    </span>
                    <div className='flex gap-2.5'>
                        <button
                            type='button'
                            onClick={handleView}
                            disabled={!fileData.objectURL}
                            className='px-5 py-1.5 rounded-lg text-sm font-medium text-[#515DEF] border border-[#515DEF] bg-white hover:bg-[#515DEF0D] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            View
                        </button>
                        <button
                            type='button'
                            onClick={handleDelete}
                            className='px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-[#515DEF] border border-[#515DEF] hover:opacity-90 transition-colors cursor-pointer'
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ) : (
                <div className='flex flex-col items-center gap-2 py-8 px-4 select-none'>
                    <div className='size-12 rounded-full bg-[#FF57221A] flex items-center justify-center mb-1'>
                        <FileUp className='size-6 text-[#FF5722]' />
                    </div>
                    <p className='text-sm text-[#667085] text-center'>
                        <span className='text-[#515DEF] font-medium'>Click to Upload</span>
                        {' '}or drag and drop
                    </p>
                </div>
            )}
        </div>
    )
}

export default ProofUpload
