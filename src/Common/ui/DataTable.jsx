import { ArrowDown, ArrowUp } from 'lucide-react'
import FeedbackState from './FeedbackState'
import ResponsiveRecordList from './ResponsiveRecordList'
import { togglePageSelection, toggleRowSelection } from './dataTableState'

const DataTable = ({
    caption = 'Records',
    rows = [],
    columns = [],
    visibleColumnKeys,
    rowKey = 'id',
    loading = false,
    error = '',
    emptyTitle = 'No matching records',
    emptyDescription = 'Change the filters or create the first record if you have permission.',
    selectable = false,
    selectedRowKeys = [],
    onSelectionChange,
    sortBy = '',
    sortDirection = 'asc',
    onSort,
    renderActions,
}) => {
    if (loading) return <FeedbackState kind='loading' compact />
    if (error) return <FeedbackState kind='error' description={error} compact />
    if (!rows.length) return <FeedbackState kind='empty' title={emptyTitle} description={emptyDescription} compact />

    const visibleColumns = columns.filter((column) => !visibleColumnKeys || column.required || visibleColumnKeys.includes(column.key))
    const getRowKey = (row, index) => typeof rowKey === 'function' ? rowKey(row, index) : (row[rowKey] ?? index)
    const pageKeys = rows.map(getRowKey)
    const allPageSelected = pageKeys.length > 0 && pageKeys.every((key) => selectedRowKeys.includes(key))

    return (
        <>
            <p className='border-b border-[var(--erp-line)] px-4 py-2 text-xs text-[var(--erp-muted)] md:hidden'>Records are shown as mobile-friendly cards.</p>
            <ResponsiveRecordList rows={rows} columns={visibleColumns} getRowKey={getRowKey} renderActions={renderActions} />
            <div className='ui-scrollbar hidden overflow-x-auto md:block' tabIndex={0} aria-label={`${caption}. Scroll horizontally when needed.`}>
                <table className='w-full min-w-[44rem] border-collapse text-left text-sm'>
                    <caption className='sr-only'>{caption}</caption>
                    <thead className='bg-[var(--erp-canvas)] text-xs uppercase tracking-wide text-[var(--erp-slate)]'>
                        <tr>
                            {selectable && (
                                <th scope='col' className='w-12 px-4 py-3'>
                                    <input type='checkbox' checked={allPageSelected} onChange={() => onSelectionChange?.(togglePageSelection(selectedRowKeys, pageKeys))} aria-label={`Select all ${rows.length} visible records`} />
                                </th>
                            )}
                            {visibleColumns.map((column) => {
                                const activeSort = sortBy === column.key
                                return (
                                    <th key={column.key} scope='col' aria-sort={activeSort ? (sortDirection === 'desc' ? 'descending' : 'ascending') : undefined} className='whitespace-nowrap px-4 py-3 font-semibold'>
                                        {column.sortable ? (
                                            <button type='button' onClick={() => onSort?.(column.key, activeSort && sortDirection === 'asc' ? 'desc' : 'asc')} className='inline-flex items-center gap-1.5'>
                                                {column.label}
                                                {activeSort && (sortDirection === 'desc' ? <ArrowDown aria-hidden='true' size={14} /> : <ArrowUp aria-hidden='true' size={14} />)}
                                            </button>
                                        ) : column.label}
                                    </th>
                                )
                            })}
                            {renderActions && <th scope='col' className='px-4 py-3 text-right font-semibold'>Actions</th>}
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-[var(--erp-line)]'>
                        {rows.map((row, index) => {
                            const key = getRowKey(row, index)
                            return (
                                <tr key={key} className='bg-white hover:bg-[#FAFBFD]'>
                                    {selectable && <td className='px-4 py-3'><input type='checkbox' checked={selectedRowKeys.includes(key)} onChange={() => onSelectionChange?.(toggleRowSelection(selectedRowKeys, key))} aria-label={`Select row ${index + 1}`} /></td>}
                                    {visibleColumns.map((column) => <td key={column.key} className='px-4 py-3 text-[var(--erp-slate)]'>{column.render ? column.render(row, index) : (row[column.key] ?? '—')}</td>)}
                                    {renderActions && <td className='px-4 py-3'><div className='flex justify-end gap-2'>{renderActions(row, index)}</div></td>}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default DataTable
