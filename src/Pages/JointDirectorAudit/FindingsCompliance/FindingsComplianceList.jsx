import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowRight, Download, RotateCcw, Search } from 'lucide-react'
import {
    IntegrationNotice,
    PageHeader,
    ResponsiveRecordList,
    StatusBadge,
} from '../../../Common/ui'
import { filterGovernanceFindings } from '../../../Common/AuditGovernance/auditGovernanceState'
import { FINDINGS, DEPARTMENTS, SEVERITY_OPTIONS } from './findingsComplianceData'

const INITIAL_FILTERS = {
    query: '', department: '', severity: '', rcaStatus: '', capaStatus: '', verificationStatus: '', closureStatus: '',
}

const selectClass = 'min-h-10 w-full rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 py-2 text-sm text-[var(--erp-ink)] outline-none focus:border-[var(--erp-primary)] focus:ring-2 focus:ring-[var(--erp-primary)]/15'

const FindingLink = ({ finding }) => (
    <NavLink to={`/joint-director-audit/findings-compliance/view/${finding.id}`} className='inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--erp-primary)] px-3 py-1.5 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary)] hover:text-white'>
        Review record <ArrowRight size={15} aria-hidden='true' />
    </NavLink>
)

const FilterSelect = ({ label, value, options, onChange }) => (
    <label>
        <span className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>{label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
            <option value=''>All</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
)

const FindingsComplianceList = () => {
    const [filters, setFilters] = useState(INITIAL_FILTERS)
    const records = useMemo(() => filterGovernanceFindings(FINDINGS, filters), [filters])
    const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }))

    const columns = [
        { key: 'id', label: 'Finding', render: (row) => <span className='font-semibold text-[var(--erp-primary)]'>{row.id}</span> },
        { key: 'title', label: 'Risk / department', render: (row) => <span>{row.title}<small className='mt-0.5 block font-normal text-[var(--erp-muted)]'>{row.department} · {row.auditId}</small></span> },
        { key: 'severity', label: 'Severity', render: (row) => <StatusBadge status={row.severity} /> },
        { key: 'owner', label: 'Owner / due', render: (row) => <span>{row.owner}<small className='mt-0.5 block font-normal text-[var(--erp-muted)]'>Due {row.dueDate}</small></span> },
        { key: 'rcaStatus', label: 'RCA', render: (row) => <StatusBadge status={row.rcaStatus} /> },
        { key: 'capaStatus', label: 'CAPA', render: (row) => <StatusBadge status={row.capaStatus} /> },
        { key: 'verificationStatus', label: 'Verification', render: (row) => <StatusBadge status={row.verificationStatus} /> },
        { key: 'closureStatus', label: 'Closure', render: (row) => <StatusBadge status={row.closureStatus} /> },
    ]

    return (
        <section>
            <PageHeader
                title='Findings & compliance'
                description='Review risk, ownership, root cause, corrective action, independent verification and closure as one governed record.'
                context={`${records.length} of ${FINDINGS.length} reference findings`}
                actions={<button type='button' disabled title='Requires reporting and document services' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 py-2 text-sm font-semibold text-white opacity-50'><Download size={16} aria-hidden='true' /> Export</button>}
            />

            <IntegrationNotice state='demo' title='Reference audit records' description='These records are static frontend reference data. Authoritative evidence files, auditee submissions, immutable history, reminders, verification signatures, closure approvals and export require the audit backend.' className='mb-5' />

            <div className='mb-5 rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white p-4 shadow-[var(--erp-shadow-subtle)]'>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                    <label className='sm:col-span-2 xl:col-span-2'>
                        <span className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>Search finding, audit or owner</span>
                        <span className='relative block'>
                            <Search className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--erp-muted)]' size={16} aria-hidden='true' />
                            <input value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} className={`${selectClass} pl-9`} placeholder='e.g. transport, FND-2026-038' />
                        </span>
                    </label>
                    <FilterSelect label='Department' value={filters.department} options={DEPARTMENTS} onChange={(value) => updateFilter('department', value)} />
                    <FilterSelect label='Severity' value={filters.severity} options={SEVERITY_OPTIONS} onChange={(value) => updateFilter('severity', value)} />
                    <FilterSelect label='RCA' value={filters.rcaStatus} options={['Not recorded', 'Pending', 'Submitted', 'Approved']} onChange={(value) => updateFilter('rcaStatus', value)} />
                    <FilterSelect label='CAPA' value={filters.capaStatus} options={['Not started', 'In progress', 'Completed']} onChange={(value) => updateFilter('capaStatus', value)} />
                    <FilterSelect label='Verification' value={filters.verificationStatus} options={['Pending', 'Verified']} onChange={(value) => updateFilter('verificationStatus', value)} />
                    <FilterSelect label='Closure' value={filters.closureStatus} options={['Open', 'Closed']} onChange={(value) => updateFilter('closureStatus', value)} />
                </div>
                <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--erp-line)] pt-4'>
                    <p className='text-sm text-[var(--erp-slate)]' aria-live='polite'>{records.length} matching findings</p>
                    <button type='button' onClick={() => setFilters(INITIAL_FILTERS)} className='inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--erp-slate)] hover:border-[var(--erp-primary)] hover:text-[var(--erp-primary)]'><RotateCcw size={15} aria-hidden='true' /> Reset filters</button>
                </div>
            </div>

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white shadow-[var(--erp-shadow-subtle)]'>
                {records.length ? <>
                    <ResponsiveRecordList rows={records} columns={columns} getRowKey={(row) => row.id} renderActions={(row) => <FindingLink finding={row} />} />
                    <div className='hidden overflow-x-auto md:block'>
                        <table className='w-full min-w-[1120px] text-left text-sm'>
                            <thead className='bg-[var(--erp-canvas)] text-xs uppercase tracking-wide text-[var(--erp-navy)]'><tr>{columns.map((column) => <th key={column.key} className='px-4 py-3 font-semibold'>{column.label}</th>)}<th className='px-4 py-3 font-semibold'>Action</th></tr></thead>
                            <tbody className='divide-y divide-[var(--erp-line)]'>
                                {records.map((row) => <tr key={row.id} className='align-top hover:bg-[var(--erp-canvas)]/70'>{columns.map((column) => <td key={column.key} className='px-4 py-4 text-[var(--erp-slate)]'>{column.render ? column.render(row) : row[column.key]}</td>)}<td className='px-4 py-4'><FindingLink finding={row} /></td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </> : <div className='px-6 py-12 text-center'><p className='font-semibold text-[var(--erp-ink)]'>No findings match these filters.</p><p className='mt-1 text-sm text-[var(--erp-muted)]'>Reset filters or broaden the search.</p></div>}
            </div>
        </section>
    )
}

export default FindingsComplianceList
