import { useMemo, useState } from 'react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { COMPLIANCE_DOCS, COMPLIANCE_SUMMARY } from '../transportFinanceData'
import { SummaryCards } from './TransportShared'

const TYPE_FILTERS = ['All types', 'Insurance', 'Fitness Certificate', 'Route Permit', 'Pollution Certificate', 'Driving License']
const STATUS_FILTERS = ['All statuses', 'Valid', 'Expiring Soon', 'Expired']

const ComplianceTab = ({ complianceDocs = COMPLIANCE_DOCS }) => {
    const [query, setQuery] = useState('')
    const [type, setType] = useState(TYPE_FILTERS[0])
    const [status, setStatus] = useState(STATUS_FILTERS[0])
    const rows = useMemo(() => complianceDocs.filter((row) => {
        if (type !== TYPE_FILTERS[0] && row.docType !== type) return false
        if (status !== STATUS_FILTERS[0] && row.status !== status) return false
        const normalizedQuery = query.trim().toLowerCase()
        return !normalizedQuery || [row.entity, row.docType, row.validTill, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    }), [complianceDocs, query, status, type])
    const columns = [
        { key: 'entity', label: 'Vehicle / staff', required: true },
        { key: 'docType', label: 'Document', required: true },
        { key: 'issuedOn', label: 'Issued on' },
        { key: 'validTill', label: 'Valid till' },
        { key: 'daysLeft', label: 'Remaining' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]
    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample compliance register' description='Dates and statuses are reference records. Production renewal, file viewing, reminders and validation require document storage plus transport compliance APIs.' />
            <SummaryCards cards={COMPLIANCE_SUMMARY} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='compliance-register-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='compliance-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Compliance & documentation register</h3></div>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search compliance documents' searchPlaceholder='Vehicle, staff or document…' resultCount={rows.length} onReset={() => { setQuery(''); setType(TYPE_FILTERS[0]); setStatus(STATUS_FILTERS[0]) }} filters={<><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Document type<select value={type} onChange={(event) => setType(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{TYPE_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status<select value={status} onChange={(event) => setStatus(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{STATUS_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label></>} />
                <DataTable caption='Transport compliance document register' rows={rows} columns={columns} rowKey='id' emptyTitle='No compliance documents found' emptyDescription='Reset the filters to review available sample documents.' renderActions={(row) => <button type='button' disabled title='Document viewing and renewal require the connected compliance API.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>{row.status === 'Valid' ? 'View unavailable' : 'Renew unavailable'}</button>} />
            </section>
        </div>
    )
}

export default ComplianceTab
