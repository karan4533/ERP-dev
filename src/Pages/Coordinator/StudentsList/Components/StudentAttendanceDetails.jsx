import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { CalendarRange, BadgePercent, CircleCheck, Download, Calendar, XCircle, ArrowRight } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import AttendanceCalendar from './AttendanceCalendar'

const attendanceStats = {
    percentage: 75,
    totalClasses: 8,
    classesAttended: 6,
    classesMissed: 2,
    minimumRequired: 75,
}

const subjectWiseAttendance = [
    { subject: 'Mathematics', total: 8, present: 7, absent: 1, percentage: 87.5 },
    { subject: 'Science', total: 7, present: 6, absent: 1, percentage: 85.71 },
    { subject: 'English', total: 6, present: 5, absent: 1, percentage: 83.33 },
    { subject: 'Social Science', total: 5, present: 3, absent: 2, percentage: 60 },
    { subject: 'Hindi', total: 6, present: 5, absent: 1, percentage: 83.33 },
]

const recentAttendance = [
    { status: 'P', date: '21 May 2025', subject: 'Science' },
    { status: 'P', date: '20 May 2025', subject: 'Mathematics' },
    { status: 'A', date: '19 May 2025', subject: 'English' },
    { status: 'P', date: '18 May 2025', subject: 'Science' },
    { status: 'H', date: '17 May 2025', subject: 'Holiday' },
]

const recentStatusStyles = {
    P: 'bg-[#E8F0FE] text-[#0C1E5B]',
    A: 'bg-[#FDF3F4] text-[#980E0F]',
    H: 'bg-[#EDEEF5] text-[#808080]',
}

const StudentAttendanceDetails = () => {
    const [selectMonth, setSelectMonth] = useState(new Date())

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
            data: [{ value: attendanceStats.percentage }],
            detail: { show: false },
        }],
    }), [])

    return (
        <div className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Select Month</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={selectMonth}
                                onChange={(date) => setSelectMonth(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='exams-filter' className='text-base font-medium text-[#808080]'>Exams Filter</label>
                        <select id='exams-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <option value=''>All</option>
                        </select>
                    </div>
                    <button type='button' className='bg-[#515DEF] text-white flex items-center gap-x-2 justify-center uppercase text-sm px-6 py-3 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        <Download className='w-4 h-4' />
                        Download Report
                    </button>
                    <button type='button' className='bg-[#515DEF] text-white uppercase text-sm px-6 py-3 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4'>
                    <div className='bg-[#F0F8FE] border border-[#D2E2F0] rounded-xl p-4 flex justify-center items-center'>
                        <div className='flex flex-col items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#BFD9F8] p-4'>
                                <CalendarRange className='text-[#515DEF] w-10 h-10' />
                            </div>
                            <div className='flex flex-col items-center gap-y-2'>
                                <h3 className='text-lg font-bold text-[#0C1E5B]'>Total Working Days</h3>
                                <span className='text-4xl font-bold text-[#0C1E5B]'>22</span>
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
                                <span className='text-4xl font-bold text-[#0B6D2C]'>18</span>
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
                                <span className='text-4xl font-bold text-[#980E0F]'>4</span>
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
                                <span className='text-4xl font-bold text-[#2515B4]'>81.82%</span>
                                <span className='text-sm font-medium text-[#008000]'>Good</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-4'>
                <div className='col-span-4'>
                    <AttendanceCalendar />
                </div>
                <div className='col-span-2'>
                    <div className='bg-white rounded-2xl shadow-md p-6 flex flex-col gap-6 h-full'>
                        <h3 className='text-xl font-bold text-[#0C1E5B] text-center'>Overall Attendance</h3>
                        <div className='relative w-[200px] h-[200px] mx-auto shrink-0'>
                            <ReactECharts
                                option={attendanceChartOption}
                                style={{ height: '200px', width: '200px' }}
                                opts={{ renderer: 'svg' }}
                            />
                            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                                <span className='text-2xl font-bold text-[#0C1E5B]'>
                                    {attendanceStats.percentage.toFixed(2)}%
                                </span>
                                <span className='text-sm font-medium text-[#FF8C00] mt-1'>Average</span>
                            </div>
                        </div>
                        <div className='flex flex-col gap-4'>
                            <div className='flex items-center justify-between'>
                                <span className='text-base font-bold text-[#0C1E5B]'>Total Classes</span>
                                <span className='text-base font-bold text-[#0C1E5B]'>{attendanceStats.totalClasses}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-base font-bold text-[#0C1E5B]'>Classes Attended</span>
                                <span className='text-base font-bold text-[#0C1E5B]'>{attendanceStats.classesAttended}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-base font-bold text-[#0C1E5B]'>Classes Missed</span>
                                <span className='text-base font-bold text-[#0C1E5B]'>{attendanceStats.classesMissed}</span>
                            </div>
                        </div>
                        <hr className='border-t border-[#E0E0E0] rounded-full' />
                        <p className='text-sm text-[#808080]'>
                            Note: Minimum {attendanceStats.minimumRequired}% attendance required
                        </p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-4'>
                <div className='col-span-4'>
                    <div className='bg-white rounded-2xl shadow-md p-6'>
                        <h3 className='text-lg font-bold text-[#0C1E5B] mb-4'>Subject-wise Attendance Summary</h3>
                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left rtl:text-right'>
                                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                    <tr>
                                        <th className='px-4 py-3.5 text-[#0C1E5B] font-semibold rounded-s-lg'>Subject</th>
                                        <th className='px-4 py-3.5 text-[#0C1E5B] font-semibold text-center'>Total Classes</th>
                                        <th className='px-4 py-3.5 text-[#0C1E5B] font-semibold text-center'>Present</th>
                                        <th className='px-4 py-3.5 text-[#0C1E5B] font-semibold text-center'>Absent</th>
                                        <th className='px-4 py-3.5 text-[#0C1E5B] font-semibold text-center rounded-e-lg'>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectWiseAttendance.map((row) => (
                                        <tr key={row.subject} className='border-b text-[#0C1E5B] border-[#E0E0E0] hover:bg-[#f9fafb]'>
                                            <td className='px-4 py-4 font-medium rounded-s-lg'>{row.subject}</td>
                                            <td className='px-4 py-4 text-center'>{row.total}</td>
                                            <td className='px-4 py-4 text-center'>{row.present}</td>
                                            <td className='px-4 py-4 text-center'>{row.absent}</td>
                                            <td className='px-4 py-4 rounded-e-lg'>
                                                <div className='flex flex-col items-center gap-1.5 min-w-[90px] mx-auto'>
                                                    <span className='font-medium'>{row.percentage.toFixed(2)}%</span>
                                                    <div className='w-full h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden'>
                                                        <div
                                                            className='h-full bg-[#4CAF50] rounded-full'
                                                            style={{ width: `${row.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className='col-span-2'>
                    <div className='bg-white rounded-2xl shadow-md p-6 flex flex-col h-full'>
                        <h3 className='text-lg font-bold text-[#0C1E5B] mb-4'>Recent Attendance</h3>
                        <div className='flex flex-col gap-5 flex-1'>
                            {recentAttendance.map((item) => (
                                <div key={`${item.date}-${item.subject}`} className='flex items-center gap-3'>
                                    <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${recentStatusStyles[item.status]}`}>
                                        {item.status}
                                    </span>
                                    <div className='flex flex-1 items-center justify-between gap-2 min-w-0'>
                                        <span className='text-sm font-bold text-[#0C1E5B] whitespace-nowrap'>{item.date}</span>
                                        <span className='text-sm text-[#0C1E5B] truncate'>{item.subject}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type='button' className='flex justify-center items-center gap-1.5 text-base font-medium text-[#515DEF] text-center underline-offset-8 underline decoration-[#515DEF] mt-6 hover:opacity-80 transition-opacity cursor-pointer'>
                            View Full Report
                            <ArrowRight className='w-4 h-4' />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentAttendanceDetails
