import React, { useMemo } from 'react'
import { toast } from 'react-toastify'
import { employeeName, getAttendance, getEmployees, saveAttendance } from '../domain/hrStore'
import {
    DateField,
    GhostButton,
    PageIntro,
    PrimaryButton,
    SearchBox,
    Select,
    TableWrap,
    formatFormDate,
    parseFormDate,
    td,
    th,
    useFilters,
    useHrTick,
    matches,
} from '../components/HrUi'

const STATUSES = ['Present', 'Late', 'Leave', 'Absent', 'Permission']

const toDayKey = (value) => {
    const date = parseFormDate(value)
    if (!date) return ''
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

const displayDate = (value) => formatFormDate(value) || String(value || '—')

const todayFormDate = () => formatFormDate(new Date())

const isLeaveSource = (row) => String(row?.source || '').toLowerCase().includes('leave')

const Attendance = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getAttendance(), [tick])
    const employees = useMemo(() => getEmployees(), [tick])
    const defaultDate = useMemo(() => todayFormDate(), [])
    const { filters, set, clear, setFilters } = useFilters({
        search: '',
        status: '',
        date: todayFormDate(),
        fromDate: '',
        toDate: '',
    })

    // Date picker defaults to today; user can change it or use quick-date chips.
    const selectedDate = filters.date || defaultDate
    const selectedKey = toDayKey(selectedDate)

    const activeEmployees = useMemo(
        () => employees.filter((employee) => employee?.id && String(employee.status || '').toLowerCase() !== 'inactive'),
        [employees],
    )

    const availableDates = useMemo(() => {
        const keys = new Set()
        rows.forEach((row) => {
            const key = toDayKey(row.date)
            if (key) keys.add(key)
        })
        return [...keys].sort((a, b) => (a < b ? 1 : -1)).map((key) => {
            const [year, month, day] = key.split('-')
            return `${day}-${month}-${year}`
        })
    }, [rows])

    /** One row per active employee for the selected attendance date. */
    const dayRegister = useMemo(() => {
        const dayRows = rows.filter((row) => toDayKey(row.date) === selectedKey)
        const byEmployee = new Map()
        dayRows.forEach((row) => {
            const existing = byEmployee.get(row.employeeId)
            // Prefer leave-approval / explicit status over a bare punch if both exist.
            if (!existing || isLeaveSource(row)) byEmployee.set(row.employeeId, row)
        })

        return activeEmployees
            .map((employee) => {
                const existing = byEmployee.get(employee.id)
                if (existing) return existing
                return {
                    id: `ATT-PLACEHOLDER-${selectedKey}-${employee.id}`,
                    employeeId: employee.id,
                    date: selectedDate,
                    punchIn: '',
                    punchOut: '',
                    checkIn: '—',
                    checkOut: '—',
                    status: 'Absent',
                    source: 'Not punched',
                    placeholder: true,
                }
            })
            .sort((a, b) => employeeName(a.employeeId).localeCompare(employeeName(b.employeeId)))
    }, [rows, activeEmployees, selectedKey, selectedDate])

    const filtered = useMemo(() => {
        const fromKey = toDayKey(filters.fromDate)
        const toKey = toDayKey(filters.toDate)
        const useRange = Boolean(fromKey || toKey)

        const source = useRange
            ? rows
                .filter((row) => {
                    const key = toDayKey(row.date)
                    if (!key) return false
                    if (fromKey && key < fromKey) return false
                    if (toKey && key > toKey) return false
                    return true
                })
                .sort((a, b) => {
                    const dateCmp = toDayKey(b.date).localeCompare(toDayKey(a.date))
                    if (dateCmp !== 0) return dateCmp
                    return employeeName(a.employeeId).localeCompare(employeeName(b.employeeId))
                })
            : dayRegister

        return source.filter(
            (row) =>
                (!filters.status || row.status === filters.status)
                && matches(`${employeeName(row.employeeId)} ${row.employeeId}`, filters.search),
        )
    }, [rows, dayRegister, filters.status, filters.search, filters.fromDate, filters.toDate])

    const summary = useMemo(() => {
        const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]))
        filtered.forEach((row) => {
            if (counts[row.status] != null) counts[row.status] += 1
        })
        return counts
    }, [filtered])

    const changeStatus = (row, status) => {
        if (row.status === status) return
        const all = getAttendance()
        if (row.placeholder) {
            const created = {
                id: `ATT-${toDayKey(row.date)}-${row.employeeId}`,
                employeeId: row.employeeId,
                date: formatFormDate(row.date) || row.date,
                status,
                punchIn: status === 'Present' || status === 'Late' ? '08:30' : '',
                punchOut: status === 'Present' || status === 'Late' ? '16:30' : '',
                checkIn: status === 'Present' || status === 'Late' ? '08:30 AM' : '—',
                checkOut: status === 'Present' || status === 'Late' ? '04:30 PM' : '—',
                source: status === 'Leave' || status === 'Permission' ? 'Manual' : 'Manual',
                statusChangedBy: 'HR',
                statusChangedAt: formatFormDate(new Date()),
            }
            saveAttendance([created, ...all])
        } else {
            saveAttendance(
                all.map((item) =>
                    item.id === row.id
                        ? {
                            ...item,
                            previousStatus: item.status,
                            status,
                            statusChangedBy: 'HR',
                            statusChangedAt: formatFormDate(new Date()),
                        }
                        : item,
                ),
            )
        }
        toast.success(`${row.status} changed to ${status}. Payroll uses the saved status.`)
    }

    const syncDemo = () => {
        const day = selectedDate || defaultDate
        const dayKey = toDayKey(day)
        const others = getAttendance().filter((row) => toDayKey(row.date) !== dayKey)
        const existingDay = getAttendance().filter((row) => toDayKey(row.date) === dayKey)
        const byEmployee = new Map(existingDay.map((row) => [row.employeeId, row]))

        const synced = activeEmployees.map((employee) => {
            const existing = byEmployee.get(employee.id)
            if (existing && isLeaveSource(existing)) return existing
            return {
                id: existing?.id || `ATT-SYNC-${dayKey}-${employee.id}`,
                employeeId: employee.id,
                date: formatFormDate(day) || day,
                status: 'Present',
                punchIn: '08:05',
                punchOut: '16:40',
                checkIn: '08:05 AM',
                checkOut: '04:40 PM',
                source: 'ESSL Demo',
            }
        })

        // Keep leave rows for that day that belong to inactive / unknown employees.
        existingDay.forEach((row) => {
            if (isLeaveSource(row) && !synced.some((item) => item.id === row.id || item.employeeId === row.employeeId)) {
                synced.push(row)
            }
        })

        saveAttendance([...synced, ...others])
        setFilters((current) => ({ ...current, date: formatFormDate(day) || day, fromDate: '', toDate: '' }))
        toast.success(`Demo biometric sync applied for ${displayDate(day)} (${synced.length} employees).`)
    }

    const usingRange = Boolean(filters.fromDate || filters.toDate)
    const title = usingRange
        ? `Attendance ${filters.fromDate || '…'} – ${filters.toDate || '…'}`
        : `Attendance · ${displayDate(selectedDate)}`

    return (
        <section>
            <PageIntro text='Attendance is shown date-wise. Pick a day to see every active employee for that date, or use From/To to review a range. Demo Sync writes punches for the selected day only.'>
                <div className='grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
                    <DateField
                        label='Attendance date'
                        value={selectedDate}
                        onChange={(value) => setFilters((current) => ({ ...current, date: value, fromDate: '', toDate: '' }))}
                        bound='any'
                    />
                    <DateField
                        label='From'
                        value={filters.fromDate}
                        onChange={(value) => setFilters((current) => ({ ...current, fromDate: value }))}
                        bound='any'
                    />
                    <DateField
                        label='To'
                        value={filters.toDate}
                        onChange={(value) => setFilters((current) => ({ ...current, toDate: value }))}
                        bound='any'
                    />
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Employee' />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={STATUSES} />
                    <div className='flex flex-col gap-y-2 justify-end'>
                        <GhostButton
                            onClick={() => {
                                clear()
                                setFilters({ search: '', status: '', date: defaultDate, fromDate: '', toDate: '' })
                            }}
                        >
                            Clear Filters
                        </GhostButton>
                    </div>
                </div>
                {availableDates.length > 0 ? (
                    <div className='flex flex-wrap gap-2 mt-4'>
                        <span className='text-xs text-[#667085] self-center mr-1'>Quick dates:</span>
                        {availableDates.slice(0, 8).map((date) => (
                            <button
                                key={date}
                                type='button'
                                onClick={() => setFilters((current) => ({ ...current, date, fromDate: '', toDate: '' }))}
                                className={`text-xs px-3 py-1.5 rounded-md border cursor-pointer ${
                                    !usingRange && toDayKey(selectedDate) === toDayKey(date)
                                        ? 'bg-[#515DEF] text-white border-[#515DEF]'
                                        : 'bg-white text-[#515DEF] border-[#D9D9D9] hover:border-[#515DEF]'
                                }`}
                            >
                                {date}
                            </button>
                        ))}
                    </div>
                ) : null}
                <div className='grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4'>
                    {STATUSES.map((status) => (
                        <div key={status} className='rounded-xl border border-[#E2E8F0] px-3 py-2'>
                            <p className='text-xs text-[#667085]'>{status}</p>
                            <p className='text-lg font-semibold text-[#1E1E1E]'>{summary[status]}</p>
                        </div>
                    ))}
                </div>
            </PageIntro>

            <TableWrap
                title={title}
                action={(
                    <>
                        <span className='text-sm text-[#667085] self-center'>{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
                        <PrimaryButton onClick={syncDemo}>Demo Sync</PrimaryButton>
                    </>
                )}
            >
                <table className='w-full text-left'>
                    <thead className='bg-[#EDEEF5]'>
                        <tr>{['Employee', 'Date', 'Punch In', 'Punch Out', 'Status', 'Source'].map((heading) => <th key={heading} className={th}>{heading}</th>)}</tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td className={`${td} text-center text-[#667085]`} colSpan={6}>
                                    No attendance rows for the selected date filters.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                    <td className={td}>
                                        {employeeName(row.employeeId)}
                                        <div className='text-xs text-[#98A2B3]'>{row.employeeId}</div>
                                    </td>
                                    <td className={td}>{displayDate(row.date)}</td>
                                    <td className={td}>{row.punchIn || '—'}</td>
                                    <td className={td}>{row.punchOut || '—'}</td>
                                    <td className={td}>
                                        <select
                                            className='border rounded-md px-2 py-1 text-sm'
                                            value={row.status}
                                            onChange={(event) => changeStatus(row, event.target.value)}
                                        >
                                            {STATUSES.map((item) => <option key={item}>{item}</option>)}
                                        </select>
                                        {row.previousStatus ? <div className='text-xs'>Was {row.previousStatus}</div> : null}
                                    </td>
                                    <td className={td}>{row.source}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableWrap>
        </section>
    )
}

export default Attendance
