import React, { useEffect, useState, useMemo } from 'react'
import {
    MapPin,
    Archive,
    FolderOpen,
    Layers,
    Search,
    RefreshCw,
    Building2,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    Lock
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { fileRoomService } from '../../services/modules/fileRoomService'

const RACKS_CONFIG = [
    { id: 'Rack A', name: 'Rack A — Academic & Results', capacity: 25, room: 'Room 102', building: 'Administrative Block' },
    { id: 'Rack B', name: 'Rack B — Staff Dossiers & HR', capacity: 25, room: 'Room 102', building: 'Administrative Block' },
    { id: 'Rack C', name: 'Rack C — Student Admissions & TCs', capacity: 30, room: 'Room 102', building: 'Administrative Block' },
    { id: 'Cupboard 04', name: 'Cupboard 04 — Statutory Permitting & PRO', capacity: 20, room: 'Room 102', building: 'Administrative Block' },
    { id: 'Fireproof Locker', name: 'Fireproof Vault Locker — Legal & Title Deeds', capacity: 15, room: 'Room 101 Vault', building: 'Administrative Block' },
    { id: 'Cupboard 02', name: 'Cupboard 02 — Financial Ledgers & Audit Registers', capacity: 20, room: 'Room 102', building: 'Administrative Block' },
]

const FileRoomStorageMapping = () => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedRack, setSelectedRack] = useState('Rack A')
    const [selectedShelf, setSelectedShelf] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await fileRoomService.getFiles()
            if (res.success && Array.isArray(res.data)) {
                setFiles(res.data)
            }
        } catch (err) {
            console.error('Failed to load file mapping data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // Calculate occupancy per rack
    const rackStats = useMemo(() => {
        return RACKS_CONFIG.map((rack) => {
            const count = files.filter((f) => f.storageLocation?.cupboardRack === rack.id).length
            const percentage = Math.min(100, Math.round((count / rack.capacity) * 100))
            return {
                ...rack,
                count,
                percentage,
            }
        })
    }, [files])

    // Get available shelves in selected rack
    const availableShelves = useMemo(() => {
        const shelves = new Set()
        files
            .filter((f) => f.storageLocation?.cupboardRack === selectedRack)
            .forEach((f) => {
                if (f.storageLocation?.shelfLevel) {
                    shelves.add(f.storageLocation.shelfLevel)
                }
            })
        return ['ALL', ...Array.from(shelves).sort()]
    }, [files, selectedRack])

    // Filter files for table
    const displayedFiles = useMemo(() => {
        return files.filter((f) => {
            const matchesRack = f.storageLocation?.cupboardRack === selectedRack
            const matchesShelf = selectedShelf === 'ALL' || f.storageLocation?.shelfLevel === selectedShelf
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                f.fileRefNo?.toLowerCase().includes(q) ||
                f.fileName?.toLowerCase().includes(q) ||
                f.storageLocation?.boxFolder?.toLowerCase().includes(q)

            return matchesRack && matchesShelf && matchesSearch
        })
    }, [files, selectedRack, selectedShelf, searchQuery])

    const columns = [
        {
            key: 'fileRefNo',
            label: 'File Ref / Barcode',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900'>
                    <Archive className='w-3.5 h-3.5 text-teal-600' />
                    {row.fileRefNo}
                </div>
            ),
        },
        {
            key: 'fileName',
            label: 'Physical Document Title',
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
            label: 'Sub-Coordinates (Shelf & Box)',
            required: true,
            render: (row) => (
                <div className='font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1.5 w-fit'>
                    <span>{row.storageLocation?.shelfLevel || 'Shelf 01'}</span>
                    <span className='text-slate-300'>&rarr;</span>
                    <span className='font-bold text-teal-800'>{row.storageLocation?.boxFolder || 'Box 01'}</span>
                </div>
            ),
        },
        {
            key: 'confidentiality',
            label: 'Security Tier',
            required: true,
            render: (row) => (
                <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.confidentiality?.includes('MD')
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    {row.confidentiality?.includes('MD') ? 'Strictly Confidential (MD)' : row.confidentiality}
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
                            <MapPin className='w-4 h-4' />
                            Physical Storage Topology &amp; Coordinates
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Physical Storage Mapping (Cupboard / Rack / Shelf / Box)
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Interactive visualizer of archive rooms, cupboard capacity, shelf occupancy rates, and physical document slotting.
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={loadData}
                        className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Mapping
                    </button>
                </div>
            </div>

            {/* Visualizer Rack Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {rackStats.map((rack) => {
                    const isSelected = selectedRack === rack.id
                    return (
                        <div
                            key={rack.id}
                            onClick={() => {
                                setSelectedRack(rack.id)
                                setSelectedShelf('ALL')
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                    ? 'bg-teal-50/50 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                        >
                            <div className='flex items-center justify-between'>
                                <span className='font-mono font-bold text-xs text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded'>
                                    {rack.id}
                                </span>
                                <span className='text-[11px] text-slate-400 font-medium'>{rack.room}</span>
                            </div>

                            <div className='mt-2'>
                                <h3 className='text-xs font-bold text-slate-900 line-clamp-1'>{rack.name}</h3>
                                <p className='text-[11px] text-slate-500 mt-0.5'>{rack.building}</p>
                            </div>

                            {/* Occupancy bar */}
                            <div className='mt-3'>
                                <div className='flex items-center justify-between text-xs mb-1'>
                                    <span className='text-slate-500 text-[11px]'>Occupancy:</span>
                                    <span className='font-mono font-bold text-slate-800'>
                                        {rack.count} / {rack.capacity} files ({rack.percentage}%)
                                    </span>
                                </div>
                                <div className='w-full h-2 bg-slate-100 rounded-full overflow-hidden'>
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            rack.percentage > 85
                                                ? 'bg-rose-500'
                                                : rack.percentage > 60
                                                ? 'bg-amber-500'
                                                : 'bg-teal-500'
                                        }`}
                                        style={{ width: `${rack.percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Selected Rack Explorer */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                        <h2 className='text-sm font-bold text-slate-900'>
                            Files Stored in {selectedRack} ({displayedFiles.length})
                        </h2>
                        <span className='text-xs text-slate-400'>| Filter by Shelf:</span>
                        <div className='flex items-center gap-1 overflow-x-auto'>
                            {availableShelves.map((sh) => (
                                <button
                                    key={sh}
                                    type='button'
                                    onClick={() => setSelectedShelf(sh)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        selectedShelf === sh
                                            ? 'bg-teal-700 text-white font-semibold'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {sh === 'ALL' ? 'All Shelves' : sh}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search in this rack...'
                            className='w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>
                </div>

                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={displayedFiles}
                        emptyMessage={`No files currently stored in ${selectedRack} under selected shelf.`}
                    />
                </div>
            </div>
        </section>
    )
}

export default FileRoomStorageMapping
