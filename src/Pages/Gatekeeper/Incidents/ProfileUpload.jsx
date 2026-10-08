import React, { useState, useRef } from 'react'
import { FileUp } from 'lucide-react'

const ProfileUpload = () => {
    const [isDragging, setIsDragging] = useState(false)
    const [preview, setPreview] = useState(null)
    const [fileName, setFileName] = useState(null)
    const inputRef = useRef(null)

    const SUPPORTED_FORMATS = ['image/svg+xml', 'image/jpeg', 'image/jpg', 'image/png']
    const MAX_SIZE_MB = 5

    const handleFile = (file) => {
        if (!file) return

        if (!SUPPORTED_FORMATS.includes(file.type)) {
            alert('Unsupported format. Please upload svg, jpg, or png.')
            return
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(`File size exceeds ${MAX_SIZE_MB}MB limit.`)
            return
        }

        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target.result)
        reader.readAsDataURL(file)
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
        const file = e.dataTransfer.files[0]
        handleFile(file)
    }

    const handleChange = (e) => {
        const file = e.target.files[0]
        handleFile(file)
    }

    const handleRemove = (e) => {
        e.stopPropagation()
        setPreview(null)
        setFileName(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div className="">
            <div
                onClick={() => inputRef.current?.click()}
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
        `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".svg,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleChange}
                />

                {preview ? (
                    <div className="flex flex-col items-center gap-3 py-5">
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Profile preview"
                                className="w-20 h-20 rounded-full object-cover ring-2 ring-indigo-200 shadow-md"
                            />
                            <button
                                onClick={handleRemove}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 shadow transition-colors cursor-pointer"
                                title="Remove"
                            >
                                ✕
                            </button>
                        </div>
                        <span className="text-xs text-gray-500 max-w-[180px] truncate">{fileName}</span>
                        <span className="text-xs text-indigo-500 font-medium">Click to replace</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-8 px-4 select-none">
                        {/* Upload icon */}
                        <div className="w-12 h-12 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center mb-1">
                            <FileUp className='w-6 h-6 text-indigo-400' />
                        </div>

                        <p className="text-sm text-gray-500">
                            <span className="text-indigo-500 font-medium hover:underline cursor-pointer">
                                Click to Upload
                            </span>
                            {' '}or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">
                            Supported Formats: svg, Jpj, png, upto {MAX_SIZE_MB} MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProfileUpload