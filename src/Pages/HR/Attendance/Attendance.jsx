import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { employeeName, getAttendance, saveAttendance } from '../domain/hrStore'
import { PageIntro, PrimaryButton, SearchBox, Select, TableWrap } from '../components/HrUi'
import { matches, useFilters, useHrTick } from '../components/hrUiState'
import { ConfirmAction, DataTable, IntegrationNotice } from '../../../Common/ui'

const Attendance = () => {
    const tick = useHrTick()
    const rows = useMemo(() => {
        void tick
        return getAttendance()
    }, [tick])
    const [syncConfirmOpen, setSyncConfirmOpen] = useState(false)
    const { filters, set } = useFilters({ search: '', status: '' })
    const filtered = rows.filter((row) => (!filters.status || row.status === filters.status) && matches(`${employeeName(row.employeeId)} ${row.employeeId}`, filters.search))

    const changeStatus = (row, status) => {
        if (row.status === status) return
        saveAttendance(getAttendance().map((item) => item.id === row.id ? { ...item, previousStatus: item.status, status, statusChangedBy: 'HR', statusChangedAt: '24-09-2026' } : item))
        toast.success(`${row.status} changed to ${status}. Payroll uses the saved status.`)
    }

    const syncDemo = () => {
        const next = getAttendance().map((row) => row.status === 'Absent' ? { ...row, status: 'Present', punchIn: '08:05', punchOut: '16:40', checkIn: '08:05 AM', checkOut: '04:40 PM', source: 'ESSL Demo' } : row)
        saveAttendance(next)
        setSyncConfirmOpen(false)
        toast.success('Demo biometric sync applied. No device was contacted.')
    }

    const columns = [
        { key: 'employeeId', label: 'Employee', required: true, render: (row) => <><span className='font-semibold text-[var(--erp-ink)]'>{employeeName(row.employeeId)}</span><span className='block text-xs text-[var(--erp-muted)]'>{row.employeeId}</span></> },
        { key: 'date', label: 'Date' },
        { key: 'punchIn', label: 'Punch in', render: (row) => row.punchIn || '—' },
        { key: 'punchOut', label: 'Punch out', render: (row) => row.punchOut || '—' },
        { key: 'status', label: 'Status', required: true, render: (row) => <><select aria-label={`Attendance status for ${employeeName(row.employeeId)}`} className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-2 text-sm' value={row.status} onChange={(event) => changeStatus(row, event.target.value)}>{['Present', 'Late', 'Leave', 'Absent'].map((item) => <option key={item}>{item}</option>)}</select>{row.previousStatus ? <span className='mt-1 block text-xs text-[var(--erp-muted)]'>Was {row.previousStatus}</span> : null}</> },
        { key: 'source', label: 'Source' },
    ]

    return (
        <section>
            <IntegrationNotice
                state='demo'
                title='Biometric device not connected'
                description='Demo Sync changes browser data only. It does not contact an ESSL device or import authoritative attendance punches.'
                className='mb-4'
            />
            <PageIntro text='Review attendance status and exception history before payroll processing.'>
                <div className='grid md:grid-cols-3 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Employee' />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={['Present', 'Late', 'Leave', 'Absent']} />
                </div>
            </PageIntro>
            <TableWrap title='Attendance' action={<PrimaryButton onClick={() => setSyncConfirmOpen(true)}>Apply demo sync</PrimaryButton>}>
                <DataTable caption='HR attendance register' rows={filtered} columns={columns} rowKey='id' emptyTitle='No attendance records found' emptyDescription='Change the search or status filter to review other attendance records.' />
            </TableWrap>
            <ConfirmAction open={syncConfirmOpen} onClose={() => setSyncConfirmOpen(false)} onConfirm={syncDemo} title='Apply demo biometric sync?' description='This changes browser-stored absent records to present. It does not contact a biometric device and is not authoritative attendance evidence.' confirmLabel='Apply local demo sync' />
        </section>
    )
}

export default Attendance
