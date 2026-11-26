import React from 'react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { Dialog, StatusBadge } from '../../../Common/ui'
import { downloadCsv, printHtml } from './hrUiState'

export const Badge = ({ value }) => (
    <StatusBadge status={value || '—'} />
)

export const Field = ({ label, children }) => (
    <label className='flex flex-col gap-y-2 text-base font-medium text-[#808080]'>
        {label}
        {children}
    </label>
)

export const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

export const Modal = ({ title, onClose, children, wide = false }) => (
    <Dialog open onClose={onClose} title={title} size={wide ? 'xl' : 'lg'}>
        {children}
    </Dialog>
)

export const PrimaryButton = ({ children, onClick, type = 'button' }) => (
    <button type={type} onClick={onClick} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer'>{children}</button>
)

export const GhostButton = ({ children, onClick, type = 'button' }) => (
    <button type={type} onClick={onClick} className='bg-white text-[#515DEF] text-sm px-4 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white cursor-pointer'>{children}</button>
)

export const HrExport = ({ open, setOpen, rows, filename }) => (
    <ExportModal
        exportModal={open}
        setExportModal={setOpen}
        exportDescription={`You are exporting ${rows.length} record(s).`}
        onExport={(format) => {
            if (format === 'pdf') printHtml(filename, `<h1>${filename}</h1><pre>${JSON.stringify(rows, null, 2)}</pre>`)
            else downloadCsv(format === 'excel' ? filename.replace(/\.csv$/, '') : filename, rows)
            setOpen(false)
        }}
    />
)

export const Select = ({ label, value, onChange, options, allLabel = 'All' }) => (
    <Field label={label}>
        <select className={inputClass} value={value} onChange={onChange}>
            <option value=''>{allLabel}</option>
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

