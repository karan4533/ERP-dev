import React, { useCallback, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { CalendarRange, BadgePercent, CircleCheck, Download, Calendar, XCircle, ArrowRight } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AttendanceCalendar from './Components/AttendanceCalendar'
import PlacementAwaitingNotice, { isStudentPlaced } from './Components/PlacementAwaitingNotice'
import { NavLink } from 'react-router-dom'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { studentAttendanceCalendarApi } from '../../../services/attendanceApi'

const MINIMUM_REQUIRED = 75
const RECENT_LIMIT = 5
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const recentStatusStyles = {
    P: 'bg-[#E8F0FE] text-[#0C1E5B]',
    A: 'bg-[#FDF3F4] text-[#980E0F]',
    H: 'bg-[#EDEEF5] text-[#808080]',
}

const statusLabel = { P: 'Present', A: 'Absent', H: 'Holiday' }

const firstOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)

// Holidays are not working days; the percentage is present ÷ (present + absent).
const summarise = (marks) => {
    const codes = Object.values(marks || {})
    const present = codes.filter((code) => code === 'P').length
    const absent = codes.filter((code) => code === 'A').length
    const holidays = codes.filter((code) => code === 'H').length
    const working = present + absent
    return {
        working,
        present,
        absent,
        holidays,
        percentage: working ? (present / working) * 100 : null,
    }
}

const ratingFor = (percentage) => {
    if (percentage == null) return { label: 'No marks yet', className: 'text-[#808080]' }
    if (percentage >= MINIMUM_REQUIRED) return { label: 'Good', className: 'text-[#008000]' }
    return { label: `Below ${MINIMUM_REQUIRED}%`, className: 'text-[#980E0F]' }
}

const AttendanceDetails = () => {
    const { routePrefix, activeStudent } = useActiveStudent()
    const [selectMonth, setSelectMonth] = useState(() => firstOfMonth(new Date()))
    const [marks, setMarks] = useState({})
    const [loadError, setLoadError] = useState(null)

    const placed = isStudentPlaced(activeStudent)
    const studentId = activeStudent?.id

    const fetchAttendance = useCallback(
        async (year, month) => {
            if (!isApiAuthEnabled() || !getAccessToken() || !studentId) return {}
            if (!UUID_RE.test(String(studentId))) {
                throw new Error('Attendance will appear once the student profile has loaded from the school records.')
            }
            return studentAttendanceCalendarApi(studentId, year, month)
        },
        [studentId],
    )

    const handleLoaded = useCallback((data, { error }) => {
        setMarks(data && typeof data === 'object' ? data : {})
        setLoadError(error)
    }, [])

    const stats = useMemo(() => summarise(marks), [marks])
    const rating = ratingFor(stats.percentage)
    const percentText = stats.percentage == null ? '—' : `${stats.percentage.toFixed(2)}%`

    const recentAttendance = useMemo(() => (
        Object.entries(marks)
            .filter(([, code]) => statusLabel[code])
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, RECENT_LIMIT)
            .map(([dateKey, code]) => {
                const date = new Date(`${dateKey}T12:00:00`)
                return {
                    dateKey,
                    status: code,
                    date: Number.isNaN(date.getTime())
                        ? dateKey
                        : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    label: statusLabel[code],
                }
            })
    ), [marks])

    const attendanceChartOption = useMemo(() => ({
        series: [{
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            min: 0,
            max: 100,
            pointer: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            progress: {
                show: true,
                width: 18,
                roundCap: true,
                itemStyle: { color: '#FF8C00' },
            },
            axisLine: {
                lineStyle: {
                    width: 18,
                    color: [[1, 'rgba(255, 152, 0, 0.25)']],
                },
            },
            data: [{ value: stats.percentage ?? 0 }],
            detail: { show: false },
        }],
    }), [stats.percentage])

    const monthLabel = selectMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

    if (!placed) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-4 mt-2'>
                <PlacementAwaitingNotice studentName={activeStudent?.name} featureLabel='attendance' />
            </section>
        )
    }

    return (
        <section>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-2'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='attendance-month' className='text-base font-medium text-[#808080]'>Select Month</label>

                        <div className='relative w-full'>
                            <DatePicker
                                id='attendance-month'
                                selected={selectMonth}
                                onChange={(date) => setSelectMonth(firstOfMonth(date || new Date()))}
                                dateFormat='MMMM yyyy'
                                showMonthYearPicker
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />

                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>

                    <NavLink
                        to={`${routePrefix}/class/attendance-report`}
                        className='bg-[#515DEF] text-white flex items-center gap-x-2 justify-center uppercase text-sm px-6 py-3 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        <Download className='w-4 h-4' />
                        Download Report
                    </NavLink>

                    <button
                        type='button'
                        onClick={() => setSelectMonth(firstOfMonth(new Date()))}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-3 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <p className='text-sm text-[#667085] mb-4'>
                    {monthLabel}{loadError ? ` · ${loadError}` : ''}
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4'>
                    <div className='bg-[#F0F8FE] border border-[#D2E2F0] rounded-xl p-4 flex justify-center items-center'>
                        <div className='flex flex-col items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#BFD9F8] p-4'>
                                <CalendarRange className='text-[#515DEF] w-10 h-10' />
                            </div>
                            <div className='flex flex-col items-center gap-y-2'>
                                <h3 className='text-lg font-bold text-[#0C1E5B]'>Marked Working Days</h3>
                                <span className='text-4xl font-bold text-[#0C1E5B]'>{stats.working}</span>
                            </div>
                        </div>
                    </div>
                    <div className='bg-[#F1FCF2] border border-[#D1E7CC] rounded-xl p-4 flex justify-center items-center'>
                        <div className='flex flex-col items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#C7E9C7] p-4'>
                                <CircleCheck className='text-[#0B6D2C] w-10 h-10' />
                            </div>
                            <div className='flex flex-col items-center gap-y-2'>
                                <h3 className='text-lg font-bold text-[#0B6D2C]'>Present Days</h3>
                                <span className='text-4xl font-bold text-[#0B6D2C]'>{stats.present}</span>
                            </div>
                        </div>
                    </div>
                    <div className='bg-[#FDF3F4] border border-[#F5D7DA] rounded-xl p-4 flex justify-center items-center'>
                        <div className='flex flex-col items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#F2C9CB] p-4'>
                                <XCircle className='text-[#980E0F] w-10 h-10' />
                            </div>
                            <div className='flex flex-col items-center gap-y-2'>
                                <h3 className='text-lg font-bold text-[#980E0F]'>Absent Days</h3>
                                <span className='text-4xl font-bold text-[#980E0F]'>{stats.absent}</span>
                            </div>
                        </div>
                    </div>
                    <div className='bg-[#F9F7FE] border border-[#DFDDEF] rounded-xl p-4 flex justify-center items-center'>
                        <div className='flex flex-col items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#E1D7FD] p-4'>
                                <BadgePercent className='text-[#2515B4] w-10 h-10' />
                            </div>
                            <div className='flex flex-col items-center gap-y-2'>
                                <h3 className='text-lg font-bold text-[#2515B4]'>Attendance Percentage</h3>
                                <span className='text-4xl font-bold text-[#2515B4]'>{percentText}</span>
                                <span className={`text-sm font-medium ${rating.className}`}>{rating.label}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-4 mt-6'>
                <div className='col-span-4'>
                    <AttendanceCalendar
                        fetchAttendance={fetchAttendance}
                        year={selectMonth.getFullYear()}
                        month={selectMonth.getMonth()}
                        onMonthChange={(year, month) => setSelectMonth(new Date(year, month, 1))}
                        onLoaded={handleLoaded}
                    />
                </div>

                <div className='col-span-2'>
                    <div className='bg-white rounded-2xl shadow-md p-6 flex flex-col gap-6 h-full'>
                        <h3 className='text-xl font-bold text-[#0C1E5B] text-center'>Month Attendance</h3>

                        <div className='relative w-[200px] h-[200px] mx-auto shrink-0'>
                            <ReactECharts
                                option={attendanceChartOption}
                                style={{ height: '200px', width: '200px' }}
                                opts={{ renderer: 'svg' }}
                            />
                            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                                <span className='text-2xl font-bold text-[#0C1E5B]'>{percentText}</span>
                                <span className='text-sm font-medium text-[#FF8C00] mt-1'>{monthLabel}</span>
                            </div>
                        </div>

                        <div className='flex flex-col gap-4'>
                            <div className='flex items-center justify-between'>
                                <span className='text-base font-bold text-[#0C1E5B]'>Days Marked</span>
                                <span className='text-base font-bold text-[#0C1E5B]'>{stats.working}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-base font-bold text-[#0C1E5B]'>Days Present</span>
                                <span className='text-base font-bold text-[#0C1E5B]'>{stats.present}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-base font-bold text-[#0C1E5B]'>Days Absent</span>
                                <span className='text-base font-bold text-[#0C1E5B]'>{stats.absent}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-base font-bold text-[#0C1E5B]'>Holidays</span>
                                <span className='text-base font-bold text-[#0C1E5B]'>{stats.holidays}</span>
                            </div>
                        </div>

                        <hr className='border-t border-[#E0E0E0] rounded-full' />

                        <p className='text-sm text-[#808080]'>
                            Note: Minimum {MINIMUM_REQUIRED}% attendance required. Attendance is marked once per school day.
                        </p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-4 mt-6'>
                <div className='col-span-4'>
                    <div className='bg-white rounded-2xl shadow-md p-6'>
                        <h3 className='text-lg font-bold text-[#0C1E5B] mb-4'>Subject-wise Attendance Summary</h3>
                        <p className='text-sm text-[#667085]'>
                            Attendance is recorded per school day, not per subject period, so there is no subject-wise breakdown.
                        </p>
                    </div>
                </div>

                <div className='col-span-2'>
                    <div className='bg-white rounded-2xl shadow-md p-6 flex flex-col h-full'>
                        <h3 className='text-lg font-bold text-[#0C1E5B] mb-4'>Recent Attendance</h3>

                        <div className='flex flex-col gap-5 flex-1'>
                            {recentAttendance.length === 0 && (
                                <p className='text-sm text-[#667085]'>No attendance marked for {monthLabel}.</p>
                            )}
                            {recentAttendance.map((item) => (
                                <div key={item.dateKey} className='flex items-center gap-3'>
                                    <span
                                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${recentStatusStyles[item.status]}`}
                                    >
                                        {item.status}
                                    </span>
                                    <div className='flex flex-1 items-center justify-between gap-2 min-w-0'>
                                        <span className='text-sm font-bold text-[#0C1E5B] whitespace-nowrap'>{item.date}</span>
                                        <span className='text-sm text-[#0C1E5B] truncate'>{item.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <NavLink to={`${routePrefix}/class/attendance-report`} className='flex justify-center items-center gap-1.5 text-base font-medium text-[#515DEF] text-center underline-offset-8 underline decoration-[#515DEF] mt-6 hover:opacity-80 transition-opacity cursor-pointer'>
                            View Full Report
                            <ArrowRight className='w-4 h-4' />
                        </NavLink>
                    </div>
                </div>
            </div>

        </section>
    )
}

export default AttendanceDetails
