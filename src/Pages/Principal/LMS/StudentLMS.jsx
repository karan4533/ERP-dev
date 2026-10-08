import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon } from "lucide-react"
import Dropdown from '../../../Common/CommonComponents/Dropdown'

const HOMEWORK_LIST = [
    {
        studentId: 'STU-100842',
        studentName: 'Rahul Kumar Sharma',
        subject: 'Mathematics',
        homeworkTitle: 'Algebra Worksheet – Chapter 5',
        teacherName: 'Anita Verma',
        givenDate: '03-03-2026',
        uploadedDate: '05-03-2026',
    },
    {
        studentId: 'STU-100842',
        studentName: 'Rahul Kumar Sharma',
        subject: 'Science',
        homeworkTitle: 'Photosynthesis Lab Report',
        teacherName: 'John Milton',
        givenDate: '04-03-2026',
        uploadedDate: '07-03-2026',
    },
    {
        studentId: 'STU-100901',
        studentName: 'Priya Nair',
        subject: 'English',
        homeworkTitle: 'Essay on Environmental Protection',
        teacherName: 'Sarah Thomas',
        givenDate: '02-03-2026',
        uploadedDate: '06-03-2026',
    },
    {
        studentId: 'STU-100901',
        studentName: 'Priya Nair',
        subject: 'Mathematics',
        homeworkTitle: 'Statistics Practice Problems',
        teacherName: 'Anita Verma',
        givenDate: '05-03-2026',
        uploadedDate: '08-03-2026',
    },
]

const StudentLMS = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input type="text" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Subject</label>
                        <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable={true}
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Student Home Fun List</h2>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Student ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Student Name</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Homework Subject</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Homework Title</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Given By Teacher</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Homework Given Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Uploaded Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {HOMEWORK_LIST.map((row) => (
                                <tr key={`${row.studentId}-${row.subject}-${row.homeworkTitle}`} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 rounded-s-lg">{row.studentId}</td>
                                    <td className="px-2 py-4">{row.studentName}</td>
                                    <td className="px-2 py-4">{row.subject}</td>
                                    <td className="px-2 py-4">{row.homeworkTitle}</td>
                                    <td className="px-2 py-4">{row.teacherName}</td>
                                    <td className="px-2 py-4">{row.givenDate}</td>
                                    <td className="px-2 py-4">{row.uploadedDate}</td>
                                    <td className="px-2 py-4 text-center rounded-e-lg">
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to="/principal/lms/view-student-lms"
                                                className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer block"
                                            >
                                                View
                                            </NavLink>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {HOMEWORK_LIST.length} of {HOMEWORK_LIST.length} entries</p>
                <div className="flex justify-center gap-x-2 flex-wrap">
                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronLeft size={16} />
                    </button>
                    <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                        1
                    </button>
                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default StudentLMS
