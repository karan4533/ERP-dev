import { useMemo, useState } from 'react'
import { Banknote } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { PAYROLL_STAFF, SALARY_SUMMARY } from '../transportFinanceData'
import { StaffAvatar, SummaryCards } from './TransportShared'

const ROLE_FILTERS = ['All roles', 'Driver', 'Transport Manager']
const STATUS_FILTERS = ['All statuses', 'Paid', 'Pending']

const StaffSalariesTab = ({ payrollStaff = PAYROLL_STAFF }) => {
    const [query, setQuery] = useState('')
    const [role, setRole] = useState(ROLE_FILTERS[0])
    const [status, setStatus] = useState(STATUS_FILTERS[0])
    const rows = useMemo(() => payrollStaff.filter((row) => {
        if (role !== ROLE_FILTERS[0] && row.role !== role) return false
        if (status !== STATUS_FILTERS[0] && row.status !== status) return false
        const normalizedQuery = query.trim().toLowerCase()
        return !normalizedQuery || [row.name, row.role, row.netPay, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    }), [payrollStaff, query, role, status])
    const columns = [
        { key: 'name', label: 'Staff', required: true, render: (row) => <StaffAvatar initials={row.initials} name={row.name} /> },
        { key: 'role', label: 'Role' },
        { key: 'baseSalary', label: 'Base salary' },
        { key: 'allowance', label: 'Allowance' },
        { key: 'deductions', label: 'Deductions' },
        { key: 'netPay', label: 'Net pay', required: true, render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.netPay}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]
    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample transport payroll allocation' description='Figures and statuses are reference data. Payroll calculation, approval, bank payment, payslip generation and delivery remain in the dedicated connected payroll workflow.' />
            <SummaryCards cards={SALARY_SUMMARY} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='transport-payroll-title'>
                <div className='flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5'><div><h3 id='transport-payroll-title' className='text-base font-semibold text-[var(--erp-ink)]'>Transport staff payroll reference</h3><p className='mt-1 text-sm text-[var(--erp-slate)]'>June 2026 · sample allocation only</p></div><button type='button' disabled title='Run payroll from the connected payroll service.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'><Banknote aria-hidden='true' size={16} /> Run payroll unavailable</button></div>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search transport payroll' searchPlaceholder='Staff, role or amount…' resultCount={rows.length} onReset={() => { setQuery(''); setRole(ROLE_FILTERS[0]); setStatus(STATUS_FILTERS[0]) }} filters={<><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Role<select value={role} onChange={(event) => setRole(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{ROLE_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status<select value={status} onChange={(event) => setStatus(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{STATUS_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label></>} />
                <DataTable caption='Transport staff payroll reference' rows={rows} columns={columns} rowKey='id' emptyTitle='No payroll records found' emptyDescription='Reset the filters to review available sample allocations.' renderActions={() => <button type='button' disabled title='Payslip generation requires the connected payroll service.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Payslip unavailable</button>} />
            </section>
        </div>
    )
}

export default StaffSalariesTab
