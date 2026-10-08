import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CalendarRange, BadgePercent, BookOpenCheck, CircleCheck, ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react'
import ReactECharts from 'echarts-for-react'

const performanceCategories = [
    { label: 'Excellent', range: '90 - 100%', subjects: 1, color: '#4CAF50' },
    { label: 'Very Good', range: '75 - 89%', subjects: 2, color: '#00B0FF' },
    { label: 'Good', range: '50 - 74%', subjects: 1, color: '#FF9800' },
    { label: 'Need Improvement', range: '<50%', subjects: 0, color: '#F44336' },
]

const chartData = performanceCategories
    .filter((item) => item.subjects > 0)
    .map((item) => ({ name: item.label, value: item.subjects, color: item.color }))

const badgeColor = {
    Pass: 'bg-[#4CAF5033] text-[#4CAF50]',
    Fail: 'bg-[#FF000033] text-[#FF0000]',
}

const StudentResultDetails = () => {
    const [selectMonth, setSelectMonth] = useState(new Date())

    const pieChartOption = useMemo(() => ({
        series: [{
            type: 'pie',
            radius: ['64%', '91%'],
            center: ['50%', '50%'],
            startAngle: 90,
            padAngle: 3,
            silent: true,
            data: chartData.map((item) => ({
                value: item.value,
                name: item.name,
                itemStyle: { color: item.color },
            })),
            label: { show: false },
            labelLine: { show: false },
            emphasis: { disabled: true },
        }],
    }), [])

    return (
        <div className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='bg-[#F0F8FE] border border-[#D2E2F0] rounded-xl p-4'>
                        <div className='flex items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#BFD9F8] p-4'>
                                <CalendarRange className='text-[#515DEF] w-10 h-10' />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <h3 className='text-lg font-bold text-[#0C1E5B]'>Exam Appeared</h3>
                                <span className='text-4xl font-bold text-[#0C1E5B]'>4</span>
                                <span className='text-sm font-medium text-[#0C1E5B]'>This Term</span>
                            </div>
                        </div>
                    </div>
                    <div className='bg-[#F1FCF2] border border-[#D1E7CC] rounded-xl p-4'>
                        <div className='flex items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#C7E9C7] p-4'>
                                <BadgePercent className='text-[#0B6D2C] w-10 h-10' />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <h3 className='text-lg font-bold text-[#0B6D2C]'>Average Percent</h3>
                                <span className='text-4xl font-bold text-[#0B6D2C]'>84 %</span>
                                <span className='text-sm font-medium text-[#0B6D2C]'>This Term</span>
                            </div>
                        </div>
                    </div>
                    <div className='bg-[#FDF3F4] border border-[#F5D7DA] rounded-xl p-4'>
                        <div className='flex items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#F2C9CB] p-4'>
                                <BookOpenCheck className='text-[#980E0F] w-10 h-10' />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <h3 className='text-lg font-bold text-[#980E0F]'>Highest Mark</h3>
                                <span className='text-4xl font-bold text-[#980E0F]'>92/100</span>
                                <span className='text-sm font-medium text-[#980E0F]'>Mathematics</span>
                            </div>
                        </div>
                    </div>
                    <div className='bg-[#F9F7FE] border border-[#DFDDEF] rounded-xl p-4'>
                        <div className='flex items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#E1D7FD] p-4'>
                                <CircleCheck className='text-[#2515B4] w-10 h-10' />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <h3 className='text-lg font-bold text-[#2515B4]'>Overall Grade</h3>
                                <span className='text-4xl font-bold text-[#2515B4]'>A</span>
                                <span className='text-sm font-medium text-[#2515B4]'>This Term</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                        Export
                    </button>
                    <button type='button' className='bg-[#515DEF] text-white uppercase text-sm px-6 py-3 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Exam Result List</h2>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Exam Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Total Marks</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Obtained Marks</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Grade</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Percentage</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Result Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Teacher Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                <td className='px-2 py-4 rounded-s-lg'>Mid Term</td>
                                <td className='px-2 py-4'>Mathematics</td>
                                <td className='px-2 py-4'>100</td>
                                <td className='px-2 py-4'>92</td>
                                <td className='px-2 py-4'>A+</td>
                                <td className='px-2 py-4'>92%</td>
                                <td className='px-2 py-4'>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${badgeColor.Pass}`}>
                                        Pass
                                    </span>
                                </td>
                                <td className='px-2 py-4 rounded-e-lg'>Excellent performance</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to 1 of 1 entries</p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-6'>
                <h3 className='text-xl font-bold text-[#0C1E5B] mb-6'>Professional Summary</h3>
                <div className='flex items-center gap-6 flex-wrap md:flex-nowrap'>
                    <div className='relative w-[180px] h-[180px] shrink-0 mx-auto md:mx-0'>
                        <ReactECharts
                            option={pieChartOption}
                            style={{ height: '180px', width: '180px' }}
                            opts={{ renderer: 'svg' }}
                        />
                        <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                            <span className='text-sm text-[#808080]'>Average</span>
                            <span className='text-2xl font-bold text-[#0C1E5B]'>80.25 %</span>
                        </div>
                    </div>
                    <div className='flex flex-col gap-4 flex-1 w-full'>
                        {performanceCategories.map((item) => (
                            <div key={item.label} className='flex items-center justify-between gap-4'>
                                <div className='flex items-center gap-2 min-w-0'>
                                    <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ backgroundColor: item.color }} />
                                    <span className='text-sm font-medium text-[#0C1E5B] truncate'>
                                        {item.label} ({item.range})
                                    </span>
                                </div>
                                <span className='text-sm text-[#808080] whitespace-nowrap shrink-0'>
                                    {item.subjects} Subject{item.subjects !== 1 ? 's' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentResultDetails
