import React, { useRef, useState } from 'react'
import { Paperclip, SendHorizontal } from 'lucide-react'
import { ACCEPTED_FILE_TYPES } from '../communicationData'

const MessageComposer = ({ disabled, onSend }) => {
    const [text, setText] = useState('')
    const [pendingFiles, setPendingFiles] = useState([])
    const fileInputRef = useRef(null)

    const handleSend = () => {
        const trimmed = text.trim()
        if (!trimmed && pendingFiles.length === 0) return
        onSend({ text: trimmed, files: pendingFiles })
        setText('')
        setPendingFiles([])
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFiles = (fileList) => {
        const files = Array.from(fileList || [])
        if (!files.length) return
        setPendingFiles((prev) => [...prev, ...files])
    }

    return (
        <div className="shrink-0 border-t border-[#E4E7EC] bg-white p-3 sm:p-4">
            {pendingFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {pendingFiles.map((file, index) => (
                        <span
                            key={`${file.name}-${index}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#F2F4F7] px-2.5 py-1.5 text-xs text-[#344054]"
                        >
                            {file.name}
                            <button
                                type="button"
                                className="text-[#98A2B3] hover:text-red-500"
                                onClick={() =>
                                    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                                }
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="relative flex items-center gap-2 rounded-2xl border border-[#D0D5DD] bg-[#F9FAFB] p-2">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-2 text-[#667085] hover:bg-white disabled:opacity-50"
                    aria-label="Attach file"
                >
                    <Paperclip size={20} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_FILE_TYPES}
                    className="hidden"
                    onChange={(e) => {
                        handleFiles(e.target.files)
                        e.target.value = ''
                    }}
                />

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    rows={1}
                    placeholder="Type your message..."
                    className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-[#101828] outline-none placeholder:text-[#98A2B3] disabled:opacity-50"
                />

                <button
                    type="button"
                    disabled={disabled || (!text.trim() && pendingFiles.length === 0)}
                    onClick={handleSend}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#515DEF] px-3.5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Send
                    <SendHorizontal size={16} />
                </button>
            </div>
        </div>
    )
}

export default MessageComposer
