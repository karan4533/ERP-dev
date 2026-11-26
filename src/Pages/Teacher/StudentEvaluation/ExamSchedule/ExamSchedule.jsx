import React, { useState, useMemo } from 'react'
import { Calendar, Search, Filter, BookOpen, Clock, Eye, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import ExamTimeTableModal from '../../../Teacher/CreateExamSchedule/Components/ExamTimeTableModal'
import { buildTimetableFromSubjects } from '../../../Teacher/CreateExamSchedule/createExamScheduleData'

const STORAGE_KEY = 'schoolerp_evaluation_exam_schedules_v1'

const DEFAULT_EVAL_SCHEDULES = [
    {
        id: 'EXM-EV-2026-001',
        examId: 'EXM-EV-2026-001',
        examName: 'Secondary Mid-Term Examination 2026',
        className: '10',
        section: 'A',
        classLabel: 'Grade 10 - Section A',
        startDate: '15-09-2026',
        endDate: '22-09-2026',
        teacherName: 'Mrs. Priya Menon',
        status: 'In Progress',
        subjects: [
            { subject: 'Mathematics', examDate: '15-09-2026', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Monday', duration: '3 Hours' },
            { subject: 'Science & Lab', examDate: '17-09-2026', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Wednesday', duration: '3 Hours' },
            { subject: 'English Literature', examDate: '19-09-2026', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Friday', duration: '3 Hours' },
            { subject: 'Social Studies', examDate: '22-09-2026', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Monday', duration: '3 Hours' },
        ],
    },
    {
        id: 'EXM-EV-2026-002',
        examId: 'EXM-EV-2026-002',
        examName: 'Senior Secondary Periodic Assessment 2',
        className: '12',
        section: 'A',
        classLabel: 'Grade 12 - Section A',
        startDate: '20-09-2026',
        endDate: '26-09-2026',
        teacherName: 'Dr. Arthur Pendelton',
        status: 'Pending',
        subjects: [
            { subject: 'Physics', examDate: '20-09-2026', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Monday', duration: '3 Hours' },
            { subject: 'Chemistry', examDate: '22-09-2026', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Wednesday', duration: '3 Hours' },
            { subject: 'Mathematics', examDate: '24-09-2026', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Friday', duration: '3 Hours' },
            { subject: 'Computer Science', examDate: '26-09-2026', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Saturday', duration: '3 Hours' },
        ],
    },
    {
        id: 'EXM-EV-2026-003',
        examId: 'EXM-EV-2026-003',
        examName: 'Middle School Formative Assessment 1',
        className: '8',
        section: 'B',
        classLabel: 'Grade 8 - Section B',
        startDate: '01-09-2026',
        endDate: '05-09-2026',
        teacherName: 'Mr. Anil Kumar',
        status: 'Completed',
        subjects: [
            { subject: 'General Science', examDate: '01-09-2026', startTime: '10:00 AM', endTime: '11:30 AM', day: 'Monday', duration: '1.5 Hours' },
            { subject: 'Basic Mathematics', examDate: '03-09-2026', startTime: '10:00 AM', endTime: '11:30 AM', day: 'Wednesday', duration: '1.5 Hours' },
            { subject: 'English Grammar', examDate: '05-09-2026', startTime: '10:00 AM', endTime: '11:30 AM', day: 'Friday', duration: '1.5 Hours' },
        ],
    },
    {
        id: 'EXM-EV-2026-004',
        examId: 'EXM-EV-2026-004',
        examName: 'Primary Term End Examination',
        className: '5',
        section: 'A',
        classLabel: 'Grade 5 - Section A',
        startDate: '18-10-2026',
        endDate: '22-10-2026',
        teacherName: 'Mrs. Sunita Krishnan',
        status: 'Pending',
        subjects: [
            { subject: 'Environmental Studies', examDate: '18-10-2026', startTime: '09:30 AM', endTime: '11:00 AM', day: 'Monday', duration: '1.5 Hours' },
            { subject: 'Mathematics', examDate: '20-10-2026', startTime: '09:30 AM', endTime: '11:00 AM', day: 'Wednesday', duration: '1.5 Hours' },
            { subject: 'Language Arts', examDate: '22-10-2026', startTime: '09:30 AM', endTime: '11:00 AM', day: 'Friday', duration: '1.5 Hours' },
        ],
    },
]

const loadSchedules = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* fallback */
    }
    return DEFAULT_EVAL_SCHEDULES
}

const statusBadgeClasses = {
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const ExamSchedule = () => {
    const [schedules, setSchedules] = useState(loadSchedules)
    const [search, setSearch] = useState('')
    const [selectedGrade, setSelectedGrade] = useState('All')
    const [selectedStatus, setSelectedStatus] = useState('All')
    const [modalExam, setModalExam] = useState(null)

    const handleStatusChange = (examId, newStatus) => {
        const next = schedules.map((item) => {
            if (item.examId === examId || item.id === examId) {
                return { ...item, status: newStatus }
            }
            return item
        })
        setSchedules(next)
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
            /* ignore */
        }
        toast.success(`Exam schedule ${examId} status updated to "${newStatus}"`)
    }

    const filtered = useMemo(() => {
        return schedules.filter((item) => {
            if (search.trim()) {
                const q = search.toLowerCase()
                const match =
                    item.examId.toLowerCase().includes(q) ||
                    item.examName.toLowerCase().includes(q) ||
                    item.teacherName.toLowerCase().includes(q) ||
                    item.classLabel.toLowerCase().includes(q)
                if (!match) return false
            }
            if (selectedGrade !== 'All' && item.className !== selectedGrade) return false
            if (selectedStatus !== 'All' && item.status !== selectedStatus) return false
            return true
        })
    }, [schedules, search, selectedGrade, selectedStatus])

    const stats = useMemo(() => {
        return {
            total: schedules.length,
            pending: schedules.filter((s) => s.status === 'Pending').length,
            inProgress: schedules.filter((s) => s.status === 'In Progress').length,
            completed: schedules.filter((s) => s.status === 'Completed').length,
        }
    }, [schedules])

    const modalTimetable = useMemo(() => {
        if (!modalExam) return null
        return buildTimetableFromSubjects(modalExam.subjects || [])
    }, [modalExam])

    return (
        <section className='space-y-6'>
            {/* Header with Stats */}
            <div className='bg-white rounded-2xl shadow-md p-6 border border-slate-100'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-bold text-slate-900'>Examination Schedule Management</h2>
                        <p className='text-sm text-slate-500 mt-1'>
                            Schedule, review, and update active academic evaluation phases across grade levels.
                        </p>
                    </div>

                    <div className='flex items-center gap-2 flex-wrap'>
                        <div className='px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold'>
                            Total: <span className='font-bold'>{stats.total}</span>
                        </div>
                        <div className='px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold'>
                            Pending: <span className='font-bold'>{stats.pending}</span>
                        </div>
                        <div className='px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold'>
                            In Progress: <span className='font-bold'>{stats.inProgress}</span>
                        </div>
                        <div className='px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold'>
                            Completed: <span className='font-bold'>{stats.completed}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100'>
                    <div className='relative'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Search by exam title, ID, teacher...'
                            className='w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        />
                    </div>
                    <div>
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className='w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700'
                        >
                            <option value='All'>All Grades</option>
                            <option value='12'>Grade 12</option>
                            <option value='10'>Grade 10</option>
                            <option value='8'>Grade 8</option>
                            <option value='5'>Grade 5</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className='w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700'
                        >
                            <option value='All'>All Statuses</option>
                            <option value='Pending'>Pending</option>
                            <option value='In Progress'>In Progress</option>
                            <option value='Completed'>Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl shadow-md p-6 border border-slate-100'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs uppercase bg-slate-50 text-slate-600 font-semibold border-b border-slate-200'>
                            <tr>
                                <th className='px-4 py-3.5 rounded-s-lg'>Exam ID</th>
                                <th className='px-4 py-3.5'>Examination Title</th>
                                <th className='px-4 py-3.5'>Grade & Section</th>
                                <th className='px-4 py-3.5'>Schedule Window</th>
                                <th className='px-4 py-3.5 text-center'>Sessions</th>
                                <th className='px-4 py-3.5'>Coordinator / Teacher</th>
                                <th className='px-4 py-3.5'>Status Control</th>
                                <th className='px-4 py-3.5 text-center rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {filtered.map((item) => (
                                <tr key={item.id} className='hover:bg-slate-50/80 transition-colors'>
                                    <td className='px-4 py-4 font-mono font-bold text-indigo-600 whitespace-nowrap'>
                                        {item.examId}
                                    </td>
                                    <td className='px-4 py-4 font-semibold text-slate-900 max-w-xs'>
                                        {item.examName}
                                    </td>
                                    <td className='px-4 py-4 whitespace-nowrap'>
                                        <span className='px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700'>
                                            {item.classLabel}
                                        </span>
                                    </td>
                                    <td className='px-4 py-4 text-slate-600 whitespace-nowrap text-xs'>
                                        {item.startDate} &rarr; {item.endDate}
                                    </td>
                                    <td className='px-4 py-4 text-center'>
                                        <span className='inline-flex items-center gap-1 font-semibold text-slate-700'>
                                            <BookOpen size={14} className='text-slate-400' />
                                            {item.subjects?.length || 0}
                                        </span>
                                    </td>
                                    <td className='px-4 py-4 text-slate-700 text-xs font-medium'>
                                        {item.teacherName}
                                    </td>
                                    <td className='px-4 py-4 whitespace-nowrap'>
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusChange(item.examId, e.target.value)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer outline-none transition ${statusBadgeClasses[item.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                                        >
                                            <option value='Pending'>Pending</option>
                                            <option value='In Progress'>In Progress</option>
                                            <option value='Completed'>Completed</option>
                                        </select>
                                    </td>
                                    <td className='px-4 py-4 text-center whitespace-nowrap'>
                                        <button
                                            type='button'
                                            onClick={() => setModalExam(item)}
                                            className='inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition'
                                        >
                                            <Eye size={13} />
                                            View Timetable
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className='text-center py-10 text-slate-400 text-sm'>
                                        No exam schedules found matching the filter parameters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Timetable Modal */}
            {modalExam && (
                <ExamTimeTableModal
                    open={Boolean(modalExam)}
                    onClose={() => setModalExam(null)}
                    examName={`${modalExam.examName} (${modalExam.classLabel})`}
                    timetable={modalTimetable}
                />
            )}
        </section>
    )
}

export default ExamSchedule
