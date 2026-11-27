import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { CalendarRange, BadgePercent, CircleCheck, Calendar, XCircle } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AttendanceCalendar from './AttendanceCalendar'
import { getAccessToken, isApiAttendanceEnabled, isApiAuthEnabled } from '../../../../services/apiClient'
import { studentAttendanceCalendarApi } from '../../../../services/attendanceApi'

const recentStatusStyles = {
    P: 'bg-[#E8F0FE] text-[#0C1E5B]',
    A: 'bg-[#FDF3F4] text-[#980E0F]',
    H: 'bg-[#EDEEF5] text-[#808080]',
}

const summarizeCalendar = (calendar) => {
    let present = 0
    let absent = 0
    let holiday = 0
    Object.values(calendar || {}).forEach((code) => {
        if (code === 'P') present += 1
        else if (code === 'A') absent += 1
        else if (code === 'H') holiday += 1
    })
    const working = present + absent
    const percentage = working > 0 ? (present / working) * 100 : 0
    return { present, absent, holiday, working, percentage }
}

const StudentAttendanceDetails = ({ studentId }) => {
    const [selectMonth, setSelectMonth] = useState(new Date())
    const [calendar, setCalendar] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchAttendance = useCallback(
        async (year, month) => {
            if (!studentId || !isApiAuthEnabled() || !getAccessToken() || !isApiAttendanceEnabled()) {
                return {}
            }
            return studentAttendanceCalendarApi(studentId, year, month)
        },
        [studentId],
    )

    useEffect(() => {
        if (!studentId || !selectMonth) {
            setCalendar({})
            return undefined
        }
        let cancelled = false
        setLoading(true)
        setError('')
        const year = selectMonth.getFullYear()
        const month = selectMonth.getMonth() + 1
        fetchAttendance(year, month)
            .then((data) => {
                if (!cancelled) setCalendar(data && typeof data === 'object' ? data : {})
            })
            .catch((err) => {
                if (!cancelled) {
                    setCalendar({})
                    setError(err.message || 'Could not load attendance.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [studentId, selectMonth, fetchAttendance])

    const stats = useMemo(() => summarizeCalendar(calendar), [calendar])

    const recentAttendance = useMemo(
        () =>
            Object.entries(calendar)
                .map(([dateKey, status]) => {
                    const d = new Date(`${dateKey}T12:00:00`)
                    return {
                        status,
                        dateKey,
                        date: Number.isNaN(d.getTime())
                            ? dateKey
                            : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                        label: status === 'H' ? 'Holiday' : status === 'A' ? 'Absent' : 'Present',
                    }
                })
                .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
                .slice(0, 8),
        [calendar],
    )

    const attendanceChartOption = useMemo(
        () => ({
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
                data: [{ value: Number(stats.percentage.toFixed(2)) }],
                detail: { show: false },
            }],
        }),
        [stats.percentage],
    )

    const cards = [
        { label: 'Total Working Days', value: stats.working, icon: CalendarRange, tone: 'text-[#515DEF] bg-[#515DEF1A]' },
        { label: 'Present Days', value: stats.present, icon: CircleCheck, tone: 'text-[#4CAF50] bg-[#4CAF501A]' },
        { label: 'Absent Days', value: stats.absent, icon: XCircle, tone: 'text-[#F44336] bg-[#F443361A]' },
        {
            label: 'Attendance Percentage',
            value: `${stats.percentage.toFixed(2)}%`,
            hint: stats.working ? (stats.percentage >= 75 ? 'Good' : 'Below 75%') : 'No marks yet',
            icon: BadgePercent,
            tone: 'text-[#7B1FA2] bg-[#7B1FA21A]',
        },
    ]

    return (
        <div className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Select Month</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={selectMonth}
                                onChange={(date) => setSelectMonth(date || new Date())}
                                showMonthYearPicker
                                dateFormat='MM/yyyy'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
                {error ? <p className='text-sm text-[#F44336] mt-3'>{error}</p> : null}
                {loading ? <p className='text-sm text-[#667085] mt-3'>Loading attendance…</p> : null}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {cards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div key={card.label} className='bg-white rounded-2xl shadow-md p-4 flex items-start gap-3'>
                            <span className={`inline-flex items-center justify-center size-10 rounded-xl ${card.tone}`}>
                                <Icon size={18} />
                            </span>
                            <div>
                                <p className='text-sm text-[#667085]'>{card.label}</p>
                                <p className='text-xl font-semibold text-[#1E1E1E]'>{card.value}</p>
                                {card.hint ? <p className='text-xs text-[#98A2B3]'>{card.hint}</p> : null}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
                <div className='xl:col-span-2 bg-white rounded-2xl shadow-md p-4'>
                    <AttendanceCalendar
                        year={selectMonth.getFullYear()}
                        month={selectMonth.getMonth() + 1}
                        attendance={calendar}
                    />
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h3 className='text-base font-semibold text-black mb-2'>Overall Attendance</h3>
                    <div className='relative'>
                        <ReactECharts option={attendanceChartOption} style={{ height: 200 }} opts={{ renderer: 'svg' }} />
                        <p className='absolute inset-0 flex items-center justify-center text-lg font-semibold pointer-events-none'>
                            {stats.percentage.toFixed(2)}%
                        </p>
                    </div>
                    <div className='space-y-2 text-sm mt-2'>
                        <div className='flex justify-between border-b border-[#F2F4F7] py-1'><span className='text-[#667085]'>Working days</span><span>{stats.working}</span></div>
                        <div className='flex justify-between border-b border-[#F2F4F7] py-1'><span className='text-[#667085]'>Present</span><span>{stats.present}</span></div>
                        <div className='flex justify-between py-1'><span className='text-[#667085]'>Absent</span><span>{stats.absent}</span></div>
                    </div>
                    <p className='text-xs text-[#98A2B3] mt-3'>Subject-wise breakdown is not available from the attendance API yet.</p>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h3 className='text-base font-semibold text-black mb-3'>Recent marks</h3>
                {recentAttendance.length === 0 ? (
                    <p className='text-sm text-[#667085]'>No attendance marked for this month yet.</p>
                ) : (
                    <ul className='space-y-2'>
                        {recentAttendance.map((row) => (
                            <li key={row.dateKey} className='flex items-center justify-between text-sm border-b border-[#F2F4F7] py-2 last:border-0'>
                                <span className='text-[#1E1E1E]'>{row.date}</span>
                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${recentStatusStyles[row.status] || ''}`}>
                                    {row.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default StudentAttendanceDetails
