import React, { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, Download, Calendar, Users, Eye, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import {
    GRADES,
    SECTIONS,
    DAYS,
    getClassTimetables,
    saveClassTimetables,
} from '../../../Principal/ClassTimetable/classTimetableData'

const TimeTable = () => {
    const [timetables, setTimetables] = useState(() => getClassTimetables())
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedSection, setSelectedSection] = useState('')
    const [selectedDay, setSelectedDay] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [viewMode, setViewMode] = useState('periods') // 'periods' | 'summary'

    const clearFilters = () => {
        setSelectedClass('')
        setSelectedSection('')
        setSelectedDay('')
        setSearchTerm('')
    }

    // Flatten all periods across matching timetables
    const flattenedPeriods = useMemo(() => {
        const result = []
        timetables.forEach((tt) => {
            if (selectedClass && tt.className !== selectedClass) return
            if (selectedSection && tt.section !== selectedSection) return

            (tt.timelines || []).forEach((tl) => {
                if (selectedDay && tl.day !== selectedDay) return
                if (searchTerm) {
                    const q = searchTerm.toLowerCase()
                    const match =
                        (tl.subject || '').toLowerCase().includes(q) ||
                        (tl.teacher || '').toLowerCase().includes(q) ||
                        (tt.className || '').toLowerCase().includes(q)
                    if (!match) return
                }
                result.push({
                    timetableId: tt.id,
                    timelineId: tl.id,
                    className: tt.className,
                    section: tt.section,
                    periodNumber: tl.periodNumber || '1',
                    day: tl.day,
                    subject: tl.subject,
                    teacher: tl.teacher,
                    timeDuration: `${tl.startTime || '09:00'} - ${tl.endTime || '09:45'}`,
                })
            })
        })
        return result
    }, [timetables, selectedClass, selectedSection, selectedDay, searchTerm])

    const handleDeletePeriod = (timetableId, timelineId) => {
        const updated = timetables.map((tt) => {
            if (tt.id === timetableId) {
                return {
                    ...tt,
                    timelines: tt.timelines.filter((tl) => tl.id !== timelineId),
                }
            }
            return tt
        })
        setTimetables(updated)
        saveClassTimetables(updated)
        toast.success('Period removed from class timetable.')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4 mb-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setViewMode(viewMode === 'periods' ? 'summary' : 'periods')}
                            className='px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                        >
                            {viewMode === 'periods' ? 'View Class Routines Summary' : 'View Periods List'}
                        </button>
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search-input' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search-input'
                            type='text'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder='Subject, Teacher, Class...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                        >
                            <option value=''>All Classes</option>
                            {GRADES.map((g) => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                        >
                            <option value=''>All Sections</option>
                            {SECTIONS.map((s) => (
                                <option key={s} value={s}>Section {s}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='day-filter' className='text-base font-medium text-[#808080]'>Day</label>
                        <select
                            id='day-filter'
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                        >
                            <option value=''>All Days</option>
                            {DAYS.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Class Timetable & Periods</h2>
                        <p className='text-xs text-slate-500'>
                            Managing period allocations, subjects, and teachers class-wise.
                        </p>
                    </div>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/admin/class/add-timetable'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add New Period
                        </NavLink>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                {viewMode === 'periods' ? (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class & Sec</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Day</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Period</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Time Duration</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teacher</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase text-right rounded-e-lg'>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {flattenedPeriods.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className='py-8 text-center text-slate-400'>
                                            No periods found matching filters.
                                        </td>
                                    </tr>
                                ) : (
                                    flattenedPeriods.map((item) => (
                                        <tr key={`${item.timetableId}-${item.timelineId}`} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                            <td className='px-2 py-4 font-semibold text-slate-900 rounded-s-lg'>{item.className} - {item.section}</td>
                                            <td className='px-2 py-4 font-medium text-slate-700'>{item.day}</td>
                                            <td className='px-2 py-4 font-mono'>Period {item.periodNumber}</td>
                                            <td className='px-2 py-4'>{item.timeDuration}</td>
                                            <td className='px-2 py-4 font-semibold text-slate-800'>{item.subject}</td>
                                            <td className='px-2 py-4'>{item.teacher}</td>
                                            <td className='px-2 py-4 text-right rounded-e-lg'>
                                                <button
                                                    type='button'
                                                    onClick={() => handleDeletePeriod(item.timetableId, item.timelineId)}
                                                    className='inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold text-xs px-2 py-1 rounded hover:bg-rose-50 cursor-pointer'
                                                >
                                                    <Trash2 size={13} />
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {timetables.map((tt) => (
                            <div key={tt.id} className='p-4 rounded-xl border border-slate-200 bg-slate-50'>
                                <div className='flex items-center justify-between mb-2'>
                                    <h3 className='font-bold text-slate-900'>{tt.className} - {tt.section}</h3>
                                    <span className='px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-semibold'>
                                        {tt.timelines?.length || 0} periods scheduled
                                    </span>
                                </div>
                                <p className='text-xs text-slate-500 mb-3'>Academic Year: {tt.academicYear} • Term: {tt.term}</p>
                                <div className='space-y-1.5'>
                                    {(tt.timelines || []).slice(0, 4).map((tl, idx) => (
                                        <div key={idx} className='flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100'>
                                            <span className='font-medium text-slate-800'>{tl.day} (P{tl.periodNumber})</span>
                                            <span className='text-slate-600'>{tl.subject} — {tl.teacher}</span>
                                        </div>
                                    ))}
                                    {(tt.timelines?.length || 0) > 4 && (
                                        <p className='text-[11px] text-slate-400 italic pt-1'>+ {tt.timelines.length - 4} more periods</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default TimeTable
