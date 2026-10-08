import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { employeeName, getAttendance, saveAttendance } from '../domain/hrStore'
import { Badge, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, td, th, useFilters, useHrTick, matches } from '../components/HrUi'

const Attendance = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getAttendance(), [tick])
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
        toast.success('Demo biometric sync applied. No device was contacted.')
    }

    return (
        <section>
            <PageIntro text='Punch source is an ESSL-style demo label. Sync updates mock punches in this browser only.'>
                <div className='grid md:grid-cols-3 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Employee' />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={['Present', 'Late', 'Leave', 'Absent']} />
                </div>
            </PageIntro>
            <TableWrap title='Attendance' action={<PrimaryButton onClick={syncDemo}>Demo Sync</PrimaryButton>}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Date', 'Punch In', 'Punch Out', 'Status', 'Source'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{filtered.map((row) => <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{employeeName(row.employeeId)}</td><td className={td}>{row.date}</td><td className={td}>{row.punchIn || '—'}</td><td className={td}>{row.punchOut || '—'}</td><td className={td}><select className='border rounded-md px-2 py-1 text-sm' value={row.status} onChange={(event) => changeStatus(row, event.target.value)}>{['Present', 'Late', 'Leave', 'Absent'].map((item) => <option key={item}>{item}</option>)}</select>{row.previousStatus && <div className='text-xs'>Was {row.previousStatus}</div>}</td><td className={td}>{row.source}</td></tr>)}</tbody>
                </table>
            </TableWrap>
        </section>
    )
}

export default Attendance
