import React from 'react'
import { CheckCircle2, ClipboardList, Inbox } from 'lucide-react'

const ICONS = {
    inbox: Inbox,
    clipboard: ClipboardList,
    check: CheckCircle2,
}

const EmptyState = ({ title, message, icon = 'inbox' }) => {
    const Icon = ICONS[icon] ?? Inbox

    return (
        <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
            <div className='flex size-14 items-center justify-center rounded-full bg-[#EDEEF5] text-[#515DEF] mb-4'>
                <Icon size={28} strokeWidth={1.5} />
            </div>
            <h3 className='text-lg font-semibold text-[#1E1E1E]'>{title}</h3>
            <p className='text-sm text-[#667085] mt-2 max-w-md'>{message}</p>
        </div>
    )
}

export default EmptyState
