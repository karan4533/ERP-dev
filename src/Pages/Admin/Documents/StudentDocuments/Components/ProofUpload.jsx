import React, { useState, useRef } from 'react'
import { FileUp } from 'lucide-react'

const ProofUpload = () => {
    const [fileData, setFileData] = useState(null) // { name, size, ext, objectURL }
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef(null)

    const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    const MAX_SIZE_MB = 5

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const handleFile = (file) => {
        if (!file) return

        if (!SUPPORTED_FORMATS.includes(file.type)) {
            alert('Unsupported format. Please upload PDF, JPG, or PNG.')
            return
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(`File size exceeds ${MAX_SIZE_MB}MB limit.`)
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
    }

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFile(e.dataTransfer.files[0])
    }

    const handleChange = (e) => handleFile(e.target.files[0])

    const handleView = (e) => {
        e.stopPropagation()
        if (fileData?.objectURL) window.open(fileData.objectURL, '_blank')
    }

    const handleDelete = (e) => {
        e.stopPropagation()
        if (fileData?.objectURL) URL.revokeObjectURL(fileData.objectURL)
        setFileData(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div className="">
            <div
                onClick={() => !fileData && inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[140px] rounded-xl border-2 border-dashed
          transition-all duration-200
          ${fileData ? 'cursor-default' : 'cursor-pointer'}
          ${isDragging
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                    }
        `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleChange}
                />

                {fileData ? (
                    /* ── File Card State ── */
                    <div className="flex flex-col items-center gap-1.5 py-6">
                        {/* File type icon */}
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                            <span className="text-xs font-bold text-indigo-500 tracking-wide">
                                {fileData.ext}
                            </span>
                        </div>

                        {/* File name */}
                        <span className="text-sm font-semibold text-gray-800 max-w-[200px] truncate">
                            {fileData.name}
                        </span>

                        {/* File size */}
                        <span className="text-xs text-gray-400 mb-2">
                            {fileData.size}
                        </span>

                        {/* Action buttons */}
                        <div className="flex gap-2.5">
                            <button
                                onClick={handleView}
                                className="px-5 py-1.5 rounded-lg text-sm font-medium text-indigo-500 border border-indigo-500 bg-white hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                                View
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-indigo-500 border border-indigo-500 hover:bg-indigo-600 transition-colors cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Default Upload State ── */
                    <div className="flex flex-col items-center gap-2 py-8 px-4 select-none">
                        <div className="w-12 h-12 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center mb-1">
                            <FileUp className="w-6 h-6 text-indigo-400" />
                        </div>

                        <p className="text-sm text-gray-500 text-center">
                            <span className="text-indigo-500 font-medium hover:underline cursor-pointer">
                                Click to Upload
                            </span>
                            {' '}or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 text-center">
                            Supported Formats: PDF, JPG, PNG, up to {MAX_SIZE_MB} MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProofUpload