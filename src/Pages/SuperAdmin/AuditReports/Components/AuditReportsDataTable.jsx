import React from 'react'
import { getComplianceColor } from '../auditReportsOverviewData'

const highlightClass = {
    warning: 'font-semibold text-[#FF9800]',
    success: 'font-semibold text-[#4CAF50]',
}

const AuditReportsDataTable = ({ title, columns, rows, maxRows }) => {
    const displayRows = maxRows ? rows.slice(0, maxRows) : rows

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            {title && <h2 className='text-xl font-medium text-black mb-4'>{title}</h2>}
            <div className='relative overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={column.key}
                                    className={`px-2 py-3.5 text-[#0C1E5B] font-medium uppercase ${
                                        index === 0 ? 'rounded-s-lg' : index === columns.length - 1 ? 'rounded-e-lg' : ''
                                    }`}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayRows.map((row) => (
                            <tr
                                key={row.id ?? row.auditId ?? row.observationId ?? `${row.department}-${row.rank ?? row.riskArea ?? ''}`}
                                className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'
                            >
                                {columns.map((column, index) => {
                                    const value = row[column.key] ?? '—'
                                    const badgeClass = column.badgeMap?.[value]
                                    const colorValue = column.colorKey ? row[column.colorKey] : null
                                    const displayValue = column.suffix && typeof value === 'number' ? `${value}${column.suffix}` : value

                                    return (
                                        <td key={column.key} className={`px-2 py-4 ${index === 0 ? 'rounded-s-lg' : ''}`}>
                                            {column.badge ? (
                                                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${badgeClass ?? 'bg-[#66708533] text-[#667085]'}`}>
                                                    {value}
                                                </span>
                                            ) : column.colorKey ? (
                                                <span className='font-semibold' style={{ color: getComplianceColor(colorValue) }}>
                                                    {displayValue}
                                                </span>
                                            ) : column.highlight ? (
                                                <span className={highlightClass[column.highlight]}>{displayValue}</span>
                                            ) : (
                                                displayValue
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className='text-sm font-medium text-[#515DEF] mt-4'>
                Showing {displayRows.length} of {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
                {maxRows && rows.length > maxRows ? ` (preview)` : ''}
            </p>
        </div>
    )
}

export default AuditReportsDataTable
