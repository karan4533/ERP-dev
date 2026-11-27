import React, { useEffect, useMemo, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { StatusBadge } from '../../../Common/demoDomain/statusBadge.jsx'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'
import {
    BUILDING_MAINTENANCE_CATEGORIES,
    BUILDING_MAINTENANCE_STATUSES,
    deleteBuildingMaintenance,
    getBuildingMaintenanceRows,
    hydrateBuildingMaintenanceFromApi,
    upsertBuildingMaintenance,
} from './buildingMaintenanceData'

const inputClass = 'text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

const EMPTY_DRAFT = {
    date: '',
    category: '',
    location: '',
    cost: '',
    remarks: '',
    status: 'Pending',
}

const BuildingMaintenance = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const [rows, setRows] = useState(() => getBuildingMaintenanceRows())
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [pageSize, setPageSize] = useState(10)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [draft, setDraft] = useState(EMPTY_DRAFT)

    const refresh = () => setRows(getBuildingMaintenanceRows())

    useEffect(() => {
        let active = true
        hydrateBuildingMaintenanceFromApi().finally(() => {
            if (active) refresh()
        })
        return () => {
            active = false
        }
    }, [])

    const filtered = useMemo(() => rows.filter((item) => {
        if (status && item.status !== status) return false
        const dateValue = item.date || item.createdAt || ''
        if (fromDate && dateValue && String(dateValue).slice(0, 10) < fromDate) return false
        if (toDate && dateValue && String(dateValue).slice(0, 10) > toDate) return false
        if (!search.trim()) return true
        const query = search.toLowerCase()
        return ['category', 'location', 'remarks', 'id', 'status'].some((key) => (
            String(item[key] ?? '').toLowerCase().includes(query)
        ))
    }), [fromDate, rows, search, status, toDate])

    const visible = filtered.slice(0, Number(pageSize))

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate('')
        setToDate('')
    }

    const openCreate = () => {
        setDraft(EMPTY_DRAFT)
        setOpen(true)
    }

    const openEdit = (row) => {
        setDraft({
            id: row.id,
            date: row.date || '',
            category: row.category || '',
            location: row.location || '',
            cost: row.cost ?? '',
            remarks: row.remarks || '',
            status: row.status || 'Pending',
            createdAt: row.createdAt,
        })
        setOpen(true)
    }

    const submit = async (event) => {
        event.preventDefault()
        if (!draft.date) {
            toast.error('Date is required.')
            return
        }
        if (!String(draft.category || '').trim()) {
            toast.error('Category is required.')
            return
        }
        if (!String(draft.location || '').trim()) {
            toast.error('Location is required.')
            return
        }
        if (saving) return
        setSaving(true)
        const result = await upsertBuildingMaintenance(draft)
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Could not save building maintenance.')
            return
        }
        refresh()
        setOpen(false)
        setDraft(EMPTY_DRAFT)
        toast.success(result?.api
            ? `${draft.id ? 'Updated' : 'Saved'} on campus API.`
            : `${draft.id ? 'Updated' : 'Saved'} building maintenance.`)
    }

    const handleDelete = async (id) => {
        if (!showDelete) return
        const result = await deleteBuildingMaintenance(id)
        if (result?.success === false) {
            toast.error(result.message || 'Could not delete record.')
            return
        }
        refresh()
        toast.success(result?.api ? 'Deleted from campus API.' : 'Record deleted.')
    }

    const exportCsv = () => {
        const columns = [
            { key: 'date', label: 'Date' },
            { key: 'category', label: 'Category' },
            { key: 'location', label: 'Location' },
            { key: 'cost', label: 'Cost' },
            { key: 'status', label: 'Status' },
            { key: 'remarks', label: 'Remarks' },
        ]
        const header = columns.map((column) => column.label).join(',')
        const body = filtered.map((item) => columns
            .map((column) => `"${String(item[column.key] ?? '').replace(/"/g, '""')}"`)
            .join(','))
        const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'schoolerp-transport-building-maintenance-v1.csv'
        link.click()
        URL.revokeObjectURL(url)
        toast.success('CSV exported.')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center flex-col md:flex-row gap-3'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Building maintenance actuals</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Campus register for known categories. EB maintenance official format is still pending specification.
                        </p>
                    </div>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 rounded-lg cursor-pointer'>
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        Search
                        <input value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder='Category, location…' />
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        Status
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                            <option value=''>All</option>
                            {BUILDING_MAINTENANCE_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        From Date
                        <input type='date' value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={inputClass} />
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        To Date
                        <input type='date' value={toDate} onChange={(event) => setToDate(event.target.value)} className={inputClass} />
                    </label>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center flex-col sm:flex-row gap-3 mb-4'>
                    <p className='text-sm text-[#515DEF]'>Total Records: {filtered.length}</p>
                    <div className='flex gap-2'>
                        <button type='button' onClick={openCreate} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer inline-flex items-center gap-2'>
                            <Plus size={16} /> Add Entry
                        </button>
                        <button type='button' onClick={exportCsv} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer inline-flex items-center gap-2'>
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select value={pageSize} onChange={(event) => setPageSize(event.target.value)} className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        {[10, 20, 30].map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <span className='text-sm text-[#515DEF]'>Entries Per Page · showing {visible.length}</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>S.No</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Category</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Cost</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 && (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                        No records match the filters.
                                    </td>
                                </tr>
                            )}
                            {visible.map((item, index) => (
                                <tr key={item.id || index} className='border-b border-[#f2f4f7] text-[#667085]'>
                                    <td className='px-2 py-4'>{index + 1}</td>
                                    <td className='px-2 py-4'>{item.date || '—'}</td>
                                    <td className='px-2 py-4'>{item.category || '—'}</td>
                                    <td className='px-2 py-4'>{item.location || '—'}</td>
                                    <td className='px-2 py-4'>{item.cost === '' || item.cost == null ? '—' : item.cost}</td>
                                    <td className='px-2 py-4'><StatusBadge status={item.status} /></td>
                                    <td className='px-2 py-4'>
                                        <div className='flex gap-2'>
                                            <button type='button' onClick={() => openEdit(item)} className='text-[#515DEF] text-xs font-medium cursor-pointer'>
                                                Edit
                                            </button>
                                            {showDelete ? (
                                                <button type='button' onClick={() => handleDelete(item.id)} className='text-[#FF5722] text-xs font-medium cursor-pointer'>
                                                    Delete
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
                    <button type='button' className='absolute inset-0 bg-black/40' onClick={() => setOpen(false)} aria-label='Close' />
                    <form onSubmit={submit} className='relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-lg p-5 max-h-[85vh] overflow-y-auto'>
                        <h3 className='text-lg font-semibold text-black mb-4'>
                            {draft.id ? 'Update building maintenance' : 'Add building maintenance actuals'}
                        </h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <label className='flex flex-col gap-y-2 text-sm text-[#1E1E1E]'>
                                Date *
                                <input type='date' value={draft.date} onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))} className={inputClass} />
                            </label>
                            <label className='flex flex-col gap-y-2 text-sm text-[#1E1E1E]'>
                                Category *
                                <select value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))} className={inputClass}>
                                    <option value=''>Select</option>
                                    {BUILDING_MAINTENANCE_CATEGORIES.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                            <label className='flex flex-col gap-y-2 text-sm text-[#1E1E1E]'>
                                Location *
                                <input type='text' value={draft.location} onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))} className={inputClass} />
                            </label>
                            <label className='flex flex-col gap-y-2 text-sm text-[#1E1E1E]'>
                                Cost
                                <input type='number' value={draft.cost} onChange={(event) => setDraft((prev) => ({ ...prev, cost: event.target.value }))} className={inputClass} />
                            </label>
                            <label className='flex flex-col gap-y-2 text-sm text-[#1E1E1E] sm:col-span-2'>
                                Remarks
                                <textarea rows={3} value={draft.remarks} onChange={(event) => setDraft((prev) => ({ ...prev, remarks: event.target.value }))} className={inputClass} />
                            </label>
                            <label className='flex flex-col gap-y-2 text-sm text-[#1E1E1E]'>
                                Status
                                <select value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))} className={inputClass}>
                                    {BUILDING_MAINTENANCE_STATUSES.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className='flex justify-end gap-3 mt-6'>
                            <button type='button' onClick={() => setOpen(false)} className='border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md text-sm cursor-pointer'>
                                Cancel
                            </button>
                            <button type='submit' disabled={saving} className='bg-[#515DEF] text-white px-4 py-2 rounded-md text-sm cursor-pointer disabled:opacity-60'>
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    )
}

export default BuildingMaintenance
