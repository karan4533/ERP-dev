import React, { useMemo, useState, useSyncExternalStore } from 'react'
import { getHrStoreVersion, subscribeHrStore } from '../domain/hrStorage'
import { hrBadge } from '../domain/hrStatus'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { Download, X } from 'lucide-react'

export const useHrTick = () => useSyncExternalStore(subscribeHrStore, getHrStoreVersion, getHrStoreVersion)

export const Badge = ({ value }) => (
    <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${hrBadge(value)}`}>{value || '—'}</span>
)

export const Field = ({ label, children }) => (
    <label className='flex flex-col gap-y-2 text-base font-medium text-[#808080]'>
        {label}
        {children}
    </label>
)

export const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

/** camelCase / snake_case → "Human label" for dynamic KeyFields. */
export const humanizeLabel = (key) =>
    String(key || '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (ch) => ch.toUpperCase())

/** Parse DD-MM-YYYY / YYYY-MM-DD / Date → Date | null (for attendance day keys). */
export const parseFormDate = (value) => {
    if (value == null || value === '') return null
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    const text = String(value).trim()
    const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (dmy) {
        const parsed = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) {
        const parsed = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const fallback = new Date(text)
    return Number.isNaN(fallback.getTime()) ? null : fallback
}

/** Normalize dates for HTML date inputs and filters (YYYY-MM-DD). */
export const formatFormDate = (value) => {
    const date = value instanceof Date ? value : parseFormDate(value)
    if (!date) return value == null || value === '' ? '' : String(value)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export const FormField = ({ label, hint, className = '', children }) => (
    <label className={`flex flex-col gap-y-2 text-base font-medium text-[#808080] ${className}`.trim()}>
        {label ? <span>{label}</span> : null}
        {children}
        {hint ? <span className='text-xs font-normal text-[#667085]'>{hint}</span> : null}
    </label>
)

export const TextField = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    className = '',
    min,
    max,
    required = false,
    ...rest
}) => (
    <FormField label={label} className={className}>
        <input
            className={inputClass}
            type={type}
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            max={max}
            required={required}
            {...rest}
        />
    </FormField>
)

/**
 * Date input for HR forms. `bound`: 'past' | 'future' | 'any' (default).
 * `onChange` receives the YYYY-MM-DD string (or '' when cleared).
 */
export const DateField = ({ label, value, onChange, bound = 'any', required = false, className = '' }) => {
    const today = formatFormDate(new Date())
    const max = bound === 'past' ? today : undefined
    const min = bound === 'future' ? today : undefined
    return (
        <FormField label={label} className={className}>
            <input
                className={inputClass}
                type='date'
                value={formatFormDate(value) || ''}
                max={max}
                min={min}
                required={required}
                onChange={(event) => onChange(event.target.value)}
            />
        </FormField>
    )
}

/** Render a TextField for each key on a form object. Date-like keys use DateField. */
export const KeyFields = ({ keys, form, setForm, className = '' }) => {
    const dateKeys = /(date|dob|joining|posted|closing|start|end|validity|offer)/i
    return (
        <>
            {(keys || []).map((key) => {
                const label = humanizeLabel(key)
                if (dateKeys.test(key)) {
                    return (
                        <DateField
                            key={key}
                            label={label}
                            className={className}
                            value={form?.[key] || ''}
                            bound='any'
                            onChange={(next) => setForm({ ...form, [key]: next })}
                        />
                    )
                }
                return (
                    <TextField
                        key={key}
                        label={label}
                        className={className}
                        value={form?.[key] ?? ''}
                        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    />
                )
            })}
        </>
    )
}

export const Modal = ({ title, onClose, children, wide = false }) => (
    <div className='fixed inset-0 z-500 flex items-center justify-center p-4'>
        <button type='button' className='absolute inset-0 bg-black/40' onClick={onClose} aria-label='Close' />
        <div className={`relative z-10 w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg p-5`}>
            <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold text-black'>{title}</h2>
                <button type='button' onClick={onClose} className='hover:text-red-500 cursor-pointer'><X /></button>
            </div>
            {children}
        </div>
    </div>
)

export const PrimaryButton = ({ children, onClick, type = 'button' }) => (
    <button type={type} onClick={onClick} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer'>{children}</button>
)

export const GhostButton = ({ children, onClick, type = 'button' }) => (
    <button type={type} onClick={onClick} className='bg-white text-[#515DEF] text-sm px-4 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white cursor-pointer'>{children}</button>
)

export { downloadTableCsv as downloadCsv } from '../../../Common/exportDownload'

/** Open a print-friendly HTML document (offer letters, etc.). */
export const printHtml = (title, html) => {
    const frame = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
    if (!frame) return
    frame.document.write(
        `<!doctype html><html><head><meta charset="utf-8"><title>${String(title || 'Preview').replace(/</g, '&lt;')}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#1e1e1e}table{width:100%;border-collapse:collapse}td,th{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:13px}</style></head><body>${html}</body></html>`,
    )
    frame.document.close()
    frame.focus()
    frame.print()
}

export const HrExport = ({ open, setOpen, rows, filename }) => (
    <ExportModal
        exportModal={open}
        setExportModal={setOpen}
        filename={filename}
        rows={rows}
        exportDescription={`You are exporting ${rows.length} record(s).`}
    />
)

export const useFilters = (initial) => {
    const [filters, setFilters] = useState(initial)
    const set = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))
    const clear = () => setFilters(initial)
    return { filters, set, clear, setFilters }
}

export const matches = (value, query) => String(value || '').toLowerCase().includes(String(query || '').toLowerCase())

export const Select = ({ label, value, onChange, options, allLabel = 'All' }) => (
    <Field label={label}>
        <select className={inputClass} value={value} onChange={onChange}>
            {allLabel != null ? <option value=''>{allLabel}</option> : null}
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    </Field>
)

export const SearchBox = ({ value, onChange, placeholder }) => (
    <Field label='Search'>
        <input className={inputClass} value={value} onChange={onChange} placeholder={placeholder} />
    </Field>
)

export const TableWrap = ({ title, action, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
        <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
            <h2 className='text-xl font-medium text-black'>{title}</h2>
            <div className='flex flex-wrap gap-2'>{action}</div>
        </div>
        <div className='relative overflow-x-auto'>{children}</div>
    </div>
)

export const th = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase text-xs whitespace-nowrap'
export const td = 'px-2 py-4 text-[#667085] text-sm'

export function PageIntro({ text, children }) {
    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <p className='text-sm text-[#667085] mb-4'>{text}</p>
            {children}
        </div>
    )
}

export function useList(loader) {
    const tick = useHrTick()
    return useMemo(() => loader(), [loader, tick])
}
