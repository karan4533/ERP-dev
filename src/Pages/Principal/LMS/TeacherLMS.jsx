import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon } from "lucide-react"
import Dropdown from '../../../Common/CommonComponents/Dropdown'

const TEACHER_LMS_LIST = [
    {
        teacherId: 'STF-2024-0156',
        teacherName: 'Anita Verma',
        taskType: 'Homework',
        className: 'Class 10',
        section: 'Section A',
        subject: 'Mathematics',
        homeworkName: 'Algebra Worksheet – Chapter 5',
        assignedDate: '03-03-2026',
        reviewedDate: '06-03-2026',
        remarks: 'Most students submitted on time. Review completed.',
    },
    {
        teacherId: 'STF-2024-0156',
        teacherName: 'Anita Verma',
        taskType: 'Assignment',
        className: 'Class 10',
        section: 'Section A',
        subject: 'Mathematics',
        homeworkName: 'Mid Term Revision Assignment',
        assignedDate: '08-03-2026',
        reviewedDate: '11-03-2026',
        remarks: 'Good performance overall. Few need improvement in problem 4.',
    },
    {
        teacherId: 'STF-2024-0189',
        teacherName: 'John Milton',
        taskType: 'Homework',
        className: 'Class 9',
        section: 'Section B',
        subject: 'Science',
        homeworkName: 'Photosynthesis Lab Report',
        assignedDate: '04-03-2026',
        reviewedDate: '07-03-2026',
        remarks: 'Lab diagrams need clearer labelling.',
    },
    {
        teacherId: 'STF-2024-0189',
        teacherName: 'John Milton',
        taskType: 'Assignment',
        className: 'Class 9',
        section: 'Section B',
        subject: 'Science',
        homeworkName: 'Electricity Chapter Test Prep',
        assignedDate: '09-03-2026',
        reviewedDate: '—',
        remarks: 'Review pending — submissions still coming in.',
    },
]

const taskTypeBadge = {
    Homework: 'bg-[#2196F333] text-[#2196F3]',
    Assignment: 'bg-[#FF980033] text-[#FF9800]',
}

const TeacherLMS = () => {
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
                        <label className='text-base font-medium text-[#808080]'>Task Type</label>
                        <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            <option value="homework">Homework</option>
                            <option value="assignment">Assignment</option>
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
                    <h2 className='text-xl font-medium text-black'>Teacher Home Fun List</h2>
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
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Teacher Name</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Task Type</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Class</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Section</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Subject</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Homework Name</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Assigned Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Reviewed Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Remarks</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TEACHER_LMS_LIST.map((row) => (
                                <tr
                                    key={`${row.teacherId}-${row.homeworkName}-${row.assignedDate}`}
                                    className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]"
                                >
                                    <td className="px-2 py-4 rounded-s-lg">{row.teacherName}</td>
                                    <td className="px-2 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${taskTypeBadge[row.taskType]}`}>
                                            {row.taskType}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4">{row.className}</td>
                                    <td className="px-2 py-4">{row.section}</td>
                                    <td className="px-2 py-4">{row.subject}</td>
                                    <td className="px-2 py-4">{row.homeworkName}</td>
                                    <td className="px-2 py-4">{row.assignedDate}</td>
                                    <td className="px-2 py-4">{row.reviewedDate}</td>
                                    <td className="px-2 py-4 max-w-[200px] truncate" title={row.remarks}>{row.remarks}</td>
                                    <td className="px-2 py-4 text-center rounded-e-lg">
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to="/principal/lms/view-teacher-lms"
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
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {TEACHER_LMS_LIST.length} of {TEACHER_LMS_LIST.length} entries</p>
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

export default TeacherLMS
