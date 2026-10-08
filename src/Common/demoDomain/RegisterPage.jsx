import { useMemo, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { ensureSeed, nextSerial, saveJson } from './storage'
import { logActivity } from './activityLog'
import { StatusBadge } from './statusBadge.jsx'

const inputClass = 'text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

export default function RegisterPage({
    title,
    description,
    storageKey,
    seed,
    columns,
    fields,
    idField = 'id',
    idPrefix,
    searchKeys = [],
    statusKey,
    readOnly = false,
    extra,
}) {
    const [items, setItems] = useState(() => ensureSeed(storageKey, seed))
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [pageSize, setPageSize] = useState(10)
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState({})

    const statuses = useMemo(() => {
        if (!statusKey) return []
        return [...new Set(items.map((item) => item[statusKey]).filter(Boolean))]
    }, [items, statusKey])

    const filtered = items.filter((item) => {
        if (status && item[statusKey] !== status) return false
        const dateValue = item.date || item.createdDate || ''
        if (fromDate && dateValue && dateValue < fromDate) return false
        if (toDate && dateValue && dateValue > toDate) return false
        if (!search.trim()) return true
        const query = search.toLowerCase()
        const keys = searchKeys.length ? searchKeys : columns.map((column) => column.key)
        return keys.some((key) => String(item[key] ?? '').toLowerCase().includes(query))
    })

    const visible = filtered.slice(0, Number(pageSize))

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate('')
        setToDate('')
    }

    const persist = (next, action, recordId, details) => {
        setItems(next)
        saveJson(storageKey, next)
        logActivity({ action, module: title, recordId, details })
    }

    const submit = (event) => {
        event.preventDefault()
        for (const field of fields) {
            if (field.required && !String(draft[field.key] ?? '').trim()) {
                toast.error(`${field.label} is required.`)
                return
            }
        }
        const id = nextSerial(idPrefix, items, idField)
        const record = {
            [idField]: id,
            ...draft,
            createdAt: new Date().toISOString(),
        }
        persist([record, ...items], 'CREATE', id, title)
        toast.success(`${title} saved.`)
        setOpen(false)
        setDraft({})
    }

    const exportCsv = () => {
        const header = columns.map((column) => column.label).join(',')
        const rows = filtered.map((item) => columns.map((column) => `"${String(item[column.key] ?? '').replace(/"/g, '""')}"`).join(','))
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${storageKey}.csv`
        link.click()
        URL.revokeObjectURL(url)
        logActivity({ action: 'EXPORT_REQUESTED', module: title, details: `${filtered.length} rows` })
        toast.success('CSV exported.')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center flex-col md:flex-row gap-3'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>{title}</h2>
                        {description && <p className='text-sm text-[#667085] mt-1'>{description}</p>}
                    </div>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 rounded-lg cursor-pointer'>Clear Filters</button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        Search
                        <input value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder='Search records' />
                    </label>
                    {statusKey && (
                        <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                            Status
                            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                                <option value=''>All</option>
                                {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                    )}
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

            {extra}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center flex-col sm:flex-row gap-3 mb-4'>
                    <p className='text-sm text-[#515DEF]'>Total Records: {filtered.length}</p>
                    <div className='flex gap-2'>
                        {!readOnly && (
                            <button type='button' onClick={() => setOpen(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer inline-flex items-center gap-2'>
                                <Plus size={16} /> Add Entry
                            </button>
                        )}
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
                                {columns.map((column) => (
                                    <th key={column.key} className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{column.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 && (
                                <tr><td colSpan={columns.length + 1} className='px-2 py-8 text-center text-[#667085]'>No records match the filters.</td></tr>
                            )}
                            {visible.map((item, index) => (
                                <tr key={item[idField] || index} className='border-b border-[#f2f4f7] text-[#667085]'>
                                    <td className='px-2 py-4'>{index + 1}</td>
                                    {columns.map((column) => (
                                        <td key={column.key} className='px-2 py-4'>
                                            {column.key === statusKey ? <StatusBadge status={item[column.key]} /> : (item[column.key] ?? '—')}
                                        </td>
                                    ))}
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
                        <h3 className='text-lg font-semibold text-black mb-4'>Add {title}</h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            {fields.map((field) => (
                                <label key={field.key} className={`flex flex-col gap-y-2 text-sm text-[#1E1E1E] ${field.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                                    {field.label}{field.required ? ' *' : ''}
                                    {field.type === 'select' ? (
                                        <select value={draft[field.key] || ''} onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))} className={inputClass}>
                                            <option value=''>Select</option>
                                            {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        <textarea rows={3} value={draft[field.key] || ''} onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))} className={inputClass} />
                                    ) : (
                                        <input type={field.type || 'text'} value={draft[field.key] || ''} onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))} className={inputClass} />
                                    )}
                                </label>
                            ))}
                        </div>
                        <div className='flex justify-end gap-3 mt-6'>
                            <button type='button' onClick={() => setOpen(false)} className='border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md text-sm cursor-pointer'>Cancel</button>
                            <button type='submit' className='bg-[#515DEF] text-white px-4 py-2 rounded-md text-sm cursor-pointer'>Save</button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    )
}
