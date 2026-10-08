import React from 'react'
import { ClipboardCheck, FileText, Lock, RefreshCw } from 'lucide-react'
import AuditTimeline from './AuditTimeline'
import { formatRelativeTime } from '../executeAuditData'

const statusColors = {
    Draft: 'bg-white/20 text-white',
    Assigned: 'bg-[#2196F3]/30 text-white',
    'In Progress': 'bg-[#FF9800]/30 text-white',
    Submitted: 'bg-[#4CAF50]/30 text-white',
    'Under Review': 'bg-[#9C27B0]/30 text-white',
    Approved: 'bg-[#4CAF50]/40 text-white',
    Closed: 'bg-[#667085]/40 text-white',
}

const AuditWorkspaceHeader = ({ header, timeline, lastSavedAt }) => {
    const templateVersion = header.templateVersion ?? header.version?.replace('v', '') ?? '1.2'
    const statusClass = statusColors[header.status] ?? 'bg-white/20 text-white'

    return (
        <div className='rounded-2xl overflow-hidden shadow-lg border border-[#515DEF]/10'>
            <div className='bg-gradient-to-br from-[#515DEF] via-[#5B63E8] to-[#7B83FF] px-5 py-6 sm:px-6 sm:py-7'>
                <div className='flex items-center gap-2 mb-4'>
                    <div className='size-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm'>
                        <ClipboardCheck size={20} className='text-white' />
                    </div>
                    <span className='text-sm font-medium text-white/80 tracking-wide uppercase'>Audit Workspace</span>
                    <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${statusClass}`}>
                        {header.status}
                    </span>
                </div>

                <h1 className='text-xl sm:text-2xl font-bold text-white leading-snug mb-2'>
                    {header.auditName}
                </h1>

                <p className='text-sm text-white/75 mb-5'>
                    {header.auditNumber}
                    <span className='mx-2 opacity-50'>·</span>
                    {header.department}
                    <span className='mx-2 opacity-50'>·</span>
                    {header.auditorName}
                </p>

                <div className='flex flex-wrap gap-2 mb-1'>
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20'>
                        <FileText size={12} />
                        Generated from Template · v{templateVersion}
                    </span>
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20'>
                        <Lock size={12} />
                        Read Only Structure
                    </span>
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20'>
                        <RefreshCw size={12} />
                        Auto saved {formatRelativeTime(lastSavedAt)}
                    </span>
                </div>

                <AuditTimeline timeline={timeline} layout='horizontal' />
            </div>

            <div className='bg-white px-5 py-3 sm:px-6 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#667085]'>
                <span><span className='text-[#808080]'>Campus</span> · {header.campus}</span>
                <span><span className='text-[#808080]'>Building</span> · {header.building}</span>
                <span><span className='text-[#808080]'>Area</span> · {header.area}</span>
                <span><span className='text-[#808080]'>Date</span> · {header.auditDate} at {header.auditTime}</span>
            </div>
        </div>
    )
}

export default AuditWorkspaceHeader
