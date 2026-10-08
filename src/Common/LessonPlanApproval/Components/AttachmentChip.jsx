import React from 'react'
import { FileText } from 'lucide-react'

const AttachmentChip = ({ filename }) => {
    if (!filename) {
        return <span className='text-[#667085]'>—</span>
    }

    return (
        <span
            className='inline-flex items-center gap-1.5 max-w-full rounded-md border border-[#E4E7EC] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#667085] cursor-default'
            title={filename}
        >
            <FileText size={14} className='shrink-0 text-[#808080]' />
            <span className='truncate'>{filename}</span>
        </span>
    )
}

export default AttachmentChip
