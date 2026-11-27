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

const fieldClass =
    'text-sm text-[#1E1E1E] border border-[#E0E0E0] rounded-lg px-2.5 py-1.5 w-full min-w-[9rem] focus:border-[#515DEF] outline-none bg-white'

const AuditWorkspaceHeader = ({ header, timeline, lastSavedAt, onHeaderChange, readOnly = false }) => {
    const templateVersion = header.templateVersion ?? header.version?.replace('v', '') ?? '1.2'
    const statusClass = statusColors[header.status] ?? 'bg-white/20 text-white'
    const locked = readOnly || ['Submitted', 'Closed', 'Approved'].includes(header.status)

    const update = (field, value) => {
        if (locked || !onHeaderChange) return
        onHeaderChange({ ...header, [field]: value })
    }

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
                        Checklist structure read-only
                    </span>
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20'>
                        <RefreshCw size={12} />
                        Auto saved {formatRelativeTime(lastSavedAt)}
                    </span>
                </div>

                <AuditTimeline timeline={timeline} layout='horizontal' />
            </div>

            <div className='bg-white px-5 py-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
                <label className='block text-xs text-[#808080]'>
                    Campus
                    <input
                        type='text'
                        value={header.campus ?? ''}
                        onChange={(e) => update('campus', e.target.value)}
                        disabled={locked}
                        className={`${fieldClass} mt-1 disabled:bg-[#F5F6FA]`}
                        placeholder='Campus'
                    />
                </label>
                <label className='block text-xs text-[#808080]'>
                    Building
                    <input
                        type='text'
                        value={header.building ?? ''}
                        onChange={(e) => update('building', e.target.value)}
                        disabled={locked}
                        className={`${fieldClass} mt-1 disabled:bg-[#F5F6FA]`}
                        placeholder='Building'
                    />
                </label>
                <label className='block text-xs text-[#808080]'>
                    Area
                    <input
                        type='text'
                        value={header.area ?? ''}
                        onChange={(e) => update('area', e.target.value)}
                        disabled={locked}
                        className={`${fieldClass} mt-1 disabled:bg-[#F5F6FA]`}
                        placeholder='Area / place'
                    />
                </label>
                <label className='block text-xs text-[#808080]'>
                    Date
                    <input
                        type='date'
                        value={toDateInputValue(header.auditDate)}
                        onChange={(e) => update('auditDate', fromDateInputValue(e.target.value))}
                        disabled={locked}
                        className={`${fieldClass} mt-1 disabled:bg-[#F5F6FA]`}
                    />
                </label>
            </div>
        </div>
    )
}

/** Accepts dd-mm-yyyy / yyyy-mm-dd / Date-like strings for <input type="date">. */
export const toDateInputValue = (value) => {
    if (!value) return ''
    const raw = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
    const m = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
    if (m) return `${m[3]}-${m[2]}-${m[1]}`
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10)
    }
    return ''
}

export const fromDateInputValue = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    if (!y || !m || !d) return iso
    return `${d}-${m}-${y}`
}

export default AuditWorkspaceHeader
