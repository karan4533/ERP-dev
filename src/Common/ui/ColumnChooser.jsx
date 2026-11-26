import { Columns3 } from 'lucide-react'
import { toggleVisibleColumn } from './dataTableState'

const ColumnChooser = ({ columns, visibleKeys, onChange }) => (
    <details className='relative'>
        <summary className='inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--erp-ink)]'>
            <Columns3 aria-hidden='true' size={16} /> Columns
        </summary>
        <fieldset className='absolute right-0 z-20 mt-2 min-w-52 rounded-lg border border-[var(--erp-line)] bg-white p-2 shadow-[var(--erp-shadow-overlay)]'>
            <legend className='sr-only'>Visible columns</legend>
            {columns.map((column) => (
                <label key={column.key} className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--erp-canvas)]'>
                    <input
                        type='checkbox'
                        checked={column.required || visibleKeys.includes(column.key)}
                        disabled={column.required}
                        onChange={() => onChange?.(toggleVisibleColumn(visibleKeys, column.key, columns))}
                    />
                    <span>{column.label}</span>
                </label>
            ))}
        </fieldset>
    </details>
)

export default ColumnChooser
