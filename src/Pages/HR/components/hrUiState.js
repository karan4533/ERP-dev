import { useMemo, useState, useSyncExternalStore } from 'react'
import { getHrStoreVersion, subscribeHrStore } from '../domain/hrStorage'

export const useHrTick = () => useSyncExternalStore(subscribeHrStore, getHrStoreVersion, getHrStoreVersion)

export const downloadCsv = (filename, rows) => {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const body = [headers.join(','), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
}

export const printHtml = (title, html) => {
    const frame = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
    if (!frame) return
    frame.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#1e1e1e}table{width:100%;border-collapse:collapse}td,th{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:13px}</style></head><body>${html}</body></html>`)
    frame.document.close()
    frame.focus()
    frame.print()
}

export const useFilters = (initial) => {
    const [filters, setFilters] = useState(initial)
    const set = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))
    const clear = () => setFilters(initial)
    return { filters, set, clear, setFilters }
}

export const matches = (value, query) => String(value || '').toLowerCase().includes(String(query || '').toLowerCase())

export function useList(loader) {
    const tick = useHrTick()
    return useMemo(() => {
        void tick
        return loader()
    }, [loader, tick])
}
