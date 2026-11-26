import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { useSearchParams } from 'react-router-dom'
import { ensureSeed, nextSerial, saveJson } from './storage'
import { logActivity } from './activityLog'
import { StatusBadge } from './statusBadge.jsx'
import Dialog from '../ui/Dialog'
import FormField from '../ui/FormField'
import ColumnChooser from '../ui/ColumnChooser'
import DataTable from '../ui/DataTable'
import DataToolbar from '../ui/DataToolbar'
import Pagination from '../ui/Pagination'
import { paginateRows, parseTableState, serializeTableState } from '../ui/dataTableState'

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
    const [urlParams, setUrlParams] = useSearchParams()
    const [initialTableState] = useState(() => parseTableState(urlParams))
    const [items, setItems] = useState(() => ensureSeed(storageKey, seed))
    const [search, setSearch] = useState(initialTableState.query)
    const [status, setStatus] = useState(initialTableState.filters.status || '')
    const [fromDate, setFromDate] = useState(initialTableState.filters.fromDate || '')
    const [toDate, setToDate] = useState(initialTableState.filters.toDate || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(initialTableState.pageSize)
    const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => columns.map((column) => column.key))
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState({})
    const generatedId = useId().replace(/:/g, '')
    const formId = `register-form-${generatedId}`

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

    const tableColumns = useMemo(() => columns.map((column, index) => ({
        ...column,
        required: column.required || index === 0,
        render: column.key === statusKey
            ? (row) => <StatusBadge status={row[column.key]} />
            : column.render,
    })), [columns, statusKey])
    const pagination = paginateRows(filtered, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { status, fromDate, toDate },
        }), { replace: true })
    }, [fromDate, pageSize, pagination.page, search, setUrlParams, status, toDate])

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate('')
        setToDate('')
        setPage(1)
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
            <div className='rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white p-4'>
                <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>{title}</h2>
                {description && <p className='mt-1 text-sm text-[var(--erp-slate)]'>{description}</p>}
            </div>

            {extra}

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder='Search records'
                    resultCount={filtered.length}
                    onReset={clearFilters}
                    filters={(
                        <>
                            {statusKey && (
                                <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Status
                                    <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                        <option value=''>All statuses</option>
                                        {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                </label>
                            )}
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>From date
                                <input type='date' value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>To date
                                <input type='date' value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                            </label>
                        </>
                    )}
                    actions={(
                        <>
                            {!readOnly && (
                                <button type='button' onClick={() => setOpen(true)} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>
                                    <Plus aria-hidden='true' size={16} /> Add entry
                                </button>
                            )}
                            <button type='button' onClick={exportCsv} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-ink)]'>
                                <Download aria-hidden='true' size={16} /> Export CSV
                            </button>
                            <ColumnChooser columns={tableColumns} visibleKeys={visibleColumnKeys} onChange={setVisibleColumnKeys} />
                        </>
                    )}
                />
                <DataTable
                    caption={title}
                    rows={pagination.rows}
                    columns={tableColumns}
                    visibleColumnKeys={visibleColumnKeys}
                    rowKey={(row, index) => row[idField] || index}
                />
                <Pagination
                    {...pagination}
                    onPageChange={setPage}
                    onPageSizeChange={(value) => { setPageSize(value); setPage(1) }}
                    pageSizeOptions={[10, 25, 50, 100]}
                />
            </div>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                title={`Add ${title}`}
                description='Complete the required fields before saving this browser-demo record.'
                size='lg'
                footer={(
                    <>
                        <button type='button' onClick={() => setOpen(false)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold'>Cancel</button>
                        <button type='submit' form={formId} className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>Save entry</button>
                    </>
                )}
            >
                    <form id={formId} onSubmit={submit}>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            {fields.map((field) => {
                                const controlId = `${formId}-${field.key}`
                                return (
                                <FormField key={field.key} id={controlId} label={field.label} required={field.required} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
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
                                </FormField>
                                )
                            })}
                        </div>
                    </form>
            </Dialog>
        </section>
    )
}
