import React, { useEffect, useState } from 'react'
import {
    Archive,
    Search,
    RefreshCw,
    FolderOpen,
    Building2,
    ShieldCheck,
    CheckCircle2,
    ExternalLink,
    Lock
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'
import { fileRoomService } from '../../services/modules/fileRoomService'

const ProFileRoomLinkages = () => {
    const [linkedFiles, setLinkedFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await fileRoomService.getFiles({ ownerDepartment: 'PRO' })
            if (res.success && Array.isArray(res.data)) {
                // If specific PRO files exist, use them; otherwise get all files relating to governance/affiliation
                setLinkedFiles(res.data)
            }
        } catch (err) {
            console.error('Failed to load file room linkages:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filtered = linkedFiles.filter((f) => {
        const q = searchQuery.toLowerCase().trim()
        return (
            !q ||
            f.fileRefNo?.toLowerCase().includes(q) ||
            f.fileName?.toLowerCase().includes(q) ||
            f.category?.toLowerCase().includes(q)
        )
    })

    const columns = [
        {
            key: 'fileRefNo',
            label: 'Physical File Ref',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5 font-mono text-xs font-bold text-teal-800'>
                    <Archive className='w-3.5 h-3.5 text-teal-600' />
                    {row.fileRefNo}
                </div>
            ),
        },
        {
            key: 'fileName',
            label: 'Document Title',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>{row.category}</div>
                </div>
            ),
        },
        {
            key: 'storageLocation',
            label: 'Physical Coordinates (Archive)',
            required: true,
            render: (row) => {
                const loc = row.storageLocation || {}
                return (
                    <div className='font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100'>
                        {loc.room || 'Vault'} · {loc.cupboardRack || 'Rack A'} · {loc.shelfLevel || 'S1'} · {loc.boxFolder || 'Box 01'}
                    </div>
                )
            },
        },
        {
            key: 'confidentiality',
            label: 'Security Tier',
            required: true,
            render: (row) => (
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    row.confidentiality?.includes('MD')
                        ? 'bg-rose-100 text-rose-800 font-bold'
                        : 'bg-slate-100 text-slate-700'
                }`}>
                    {row.confidentiality}
                </span>
            ),
        },
        {
            key: 'currentLocationStatus',
            label: 'Custody Status',
            required: true,
            render: (row) => <StatusBadge status={row.currentLocationStatus} />,
        },
    ]

    return (
        <section className='space-y-6 p-1'>
            {/* Header */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <Archive className='w-4 h-4' />
                            Physical Custody Linkage
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            PRO &amp; Government File Room Custody
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Physical archive coordinates for statutory deeds, land lease agreements, CBSE recognition orders, and fire safety certificates.
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={loadData}
                        className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Custody
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Archived Statutory Files ({filtered.length})
                    </h2>
                    <div className='relative w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search file ref or title...'
                            className='w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filtered}
                        emptyMessage='No physical files found in archive for PRO custody.'
                    />
                </div>
            </div>
        </section>
    )
}

export default ProFileRoomLinkages
