import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Search,
    RotateCcw,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    Users,
    UserCheck,
    GraduationCap,
    UserX,
} from 'lucide-react'
import ExportModal from '../CommonComponents/ExportModal'
import {
    getIntegratedStudentsList,
    DEFAULT_ACADEMIC_YEARS,
    CURRENT_ACADEMIC_YEAR,
    STUDENT_DEPARTMENTS,
} from './userDatabaseIntegrator'
import mo_user from '../../assets/images/no-profile.png'

const statusBadgeClasses = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Graduated: 'bg-blue-50 text-blue-700 border-blue-200',
    Withdrawn: 'bg-slate-100 text-slate-700 border-slate-300',
    Promoted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

const StudentDatabaseListView = ({
    routeBase = '/front-office/student-management',
    title = 'Student Database',
    renderExtraActions,
}) => {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
    const [department, setDepartment] = useState('')
    const [className, setClassName] = useState('')
    const [section, setSection] = useState('')
    const [status, setStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Fetch integrated students from central aggregator
    const students = useMemo(() => {
        return getIntegratedStudentsList({
            search,
            academicYear,
            department,
            className,
            section,
            status,
        })
    }, [search, academicYear, department, className, section, status])

    // KPI Summary
    const totalStudents = students.length
    const activeCount = useMemo(() => students.filter((s) => s.currentStatus === 'Active').length, [students])
    const graduatedCount = useMemo(() => students.filter((s) => s.currentStatus === 'Graduated').length, [students])
    const withdrawnCount = useMemo(() => students.filter((s) => s.currentStatus === 'Withdrawn').length, [students])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(students.length / itemsPerPage))
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return students.slice(start, start + itemsPerPage)
    }, [students, currentPage])

    const handleClearFilters = () => {
        setSearch('')
        setAcademicYear(CURRENT_ACADEMIC_YEAR)
        setDepartment('')
        setClassName('')
        setSection('')
        setStatus('')
        setCurrentPage(1)
    }

    return (
        <section className='space-y-6'>
            {/* Header with Title and Export */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>{title}</h1>
                    <p className='text-sm text-slate-500 mt-0.5'>
                        Centralized student information and historical records across all academic programs.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors cursor-pointer'
                    >
                        <Download size={16} />
                        Export
                    </button>
                    {renderExtraActions && renderExtraActions()}
                </div>
            </div>

            {/* Quick KPI Count Strip */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3'>
                    <div className='p-2 bg-indigo-50 text-indigo-600 rounded-lg'>
                        <Users size={18} />
                    </div>
                    <div>
                        <div className='text-xs text-slate-500 font-medium'>Total Listed</div>
                        <div className='text-lg font-bold text-slate-900'>{totalStudents}</div>
                    </div>
                </div>
                <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3'>
                    <div className='p-2 bg-emerald-50 text-emerald-600 rounded-lg'>
                        <UserCheck size={18} />
                    </div>
                    <div>
                        <div className='text-xs text-slate-500 font-medium'>Active Enrolled</div>
                        <div className='text-lg font-bold text-emerald-700'>{activeCount}</div>
                    </div>
                </div>
                <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3'>
                    <div className='p-2 bg-blue-50 text-blue-600 rounded-lg'>
                        <GraduationCap size={18} />
                    </div>
                    <div>
                        <div className='text-xs text-slate-500 font-medium'>Graduated</div>
                        <div className='text-lg font-bold text-blue-700'>{graduatedCount}</div>
                    </div>
                </div>
                <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3'>
                    <div className='p-2 bg-slate-100 text-slate-600 rounded-lg'>
                        <UserX size={18} />
                    </div>
                    <div>
                        <div className='text-xs text-slate-500 font-medium'>Withdrawn</div>
                        <div className='text-lg font-bold text-slate-700'>{withdrawnCount}</div>
                    </div>
                </div>
            </div>

            {/* Filter Control Bar */}
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200 p-4'>
                <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3'>
                    {/* Search */}
                    <div className='lg:col-span-2'>
                        <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>Search Student</label>
                        <div className='relative'>
                            <input
                                type='text'
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setCurrentPage(1)
                                }}
                                placeholder='Search by Name, Student ID, or Admission No...'
                                className='w-full text-sm text-slate-800 border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                            />
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>

                    {/* Academic Year */}
                    <div>
                        <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>Academic Year</label>
                        <select
                            value={academicYear}
                            onChange={(e) => {
                                setAcademicYear(e.target.value)
                                setCurrentPage(1)
                            }}
                            className='w-full text-sm text-slate-800 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white'
                        >
                            {DEFAULT_ACADEMIC_YEARS.map((yr) => (
                                <option key={yr} value={yr}>
                                    {yr}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Department */}
                    <div>
                        <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>Department</label>
                        <select
                            value={department}
                            onChange={(e) => {
                                setDepartment(e.target.value)
                                setCurrentPage(1)
                            }}
                            className='w-full text-sm text-slate-800 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white'
                        >
                            <option value=''>All Departments</option>
                            {STUDENT_DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept.split('(')[0].trim()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Class & Section */}
                    <div>
                        <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>Class & Section</label>
                        <div className='flex gap-1'>
                            <select
                                value={className}
                                onChange={(e) => {
                                    setClassName(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className='w-2/3 text-sm text-slate-800 border border-slate-300 rounded-lg px-1.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white'
                            >
                                <option value=''>All Class</option>
                                <option value='10'>Grade 10</option>
                                <option value='9'>Grade 9</option>
                                <option value='8'>Grade 8</option>
                                <option value='7'>Grade 7</option>
                                <option value='6'>Grade 6</option>
                            </select>
                            <select
                                value={section}
                                onChange={(e) => {
                                    setSection(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className='w-1/3 text-sm text-slate-800 border border-slate-300 rounded-lg px-1 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white'
                            >
                                <option value=''>Sec</option>
                                <option value='A'>A</option>
                                <option value='B'>B</option>
                                <option value='C'>C</option>
                            </select>
                        </div>
                    </div>

                    {/* Current Status */}
                    <div>
                        <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>Status</label>
                        <div className='flex gap-1.5'>
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className='w-full text-sm text-slate-800 border border-slate-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white'
                            >
                                <option value=''>All Statuses</option>
                                <option value='Active'>Active</option>
                                <option value='Graduated'>Graduated</option>
                                <option value='Withdrawn'>Withdrawn</option>
                            </select>
                            <button
                                type='button'
                                onClick={handleClearFilters}
                                title='Reset Filters'
                                className='px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0'
                            >
                                <RotateCcw size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Student Directory Table */}
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold border-b border-slate-200'>
                            <tr>
                                <th scope='col' className='px-4 py-3 text-center w-14'>Profile Photo</th>
                                <th scope='col' className='px-4 py-3'>Name</th>
                                <th scope='col' className='px-4 py-3'>Unique ID</th>
                                <th scope='col' className='px-4 py-3'>Class / Section</th>
                                <th scope='col' className='px-4 py-3'>Department</th>
                                <th scope='col' className='px-4 py-3 text-center'>Current Status</th>
                                <th scope='col' className='px-4 py-3 text-center'>Attendance</th>
                                <th scope='col' className='px-4 py-3 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {paginatedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-4 py-12 text-center text-slate-500'>
                                        <Users size={32} className='mx-auto text-slate-300 mb-2' />
                                        No students found matching your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedStudents.map((student) => (
                                    <tr key={student.id} className='hover:bg-slate-50 transition-colors'>
                                        {/* Profile Photo */}
                                        <td className='px-4 py-3 text-center'>
                                            <img
                                                src={student.profilePhoto || mo_user}
                                                alt={student.name}
                                                className='w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 mx-auto'
                                            />
                                        </td>

                                        {/* Student Name */}
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`${routeBase}/view/${student.id}`}
                                                className='font-semibold text-slate-900 hover:text-indigo-600 transition-colors'
                                            >
                                                {student.name}
                                            </Link>
                                            <div className='text-xs text-slate-500 mt-0.5'>
                                                Adm: {student.admissionNumber}
                                            </div>
                                        </td>

                                        {/* Unique ID */}
                                        <td className='px-4 py-3 font-mono text-xs font-medium text-slate-700'>
                                            {student.studentId}
                                        </td>

                                        {/* Class / Section */}
                                        <td className='px-4 py-3 font-medium text-slate-800'>
                                            {student.classSection}
                                        </td>

                                        {/* Department */}
                                        <td className='px-4 py-3 text-xs text-slate-600'>
                                            {student.department.split('(')[0].trim()}
                                        </td>

                                        {/* Current Status */}
                                        <td className='px-4 py-3 text-center'>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                    statusBadgeClasses[student.currentStatus] || statusBadgeClasses.Active
                                                }`}
                                            >
                                                {student.currentStatus}
                                            </span>
                                        </td>

                                        {/* Attendance */}
                                        <td className='px-4 py-3 text-center'>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                                    student.attendanceValue >= 90
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : student.attendanceValue >= 80
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-rose-50 text-rose-700'
                                                }`}
                                            >
                                                {student.attendancePercentage}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className='px-4 py-3 text-right'>
                                            <Link
                                                to={`${routeBase}/view/${student.id}`}
                                                className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer'
                                            >
                                                <Eye size={14} />
                                                View Profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Pagination */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 bg-slate-50'>
                    <div className='text-xs text-slate-600'>
                        Showing <span className='font-semibold'>{students.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className='font-semibold'>{Math.min(currentPage * itemsPerPage, students.length)}</span> of{' '}
                        <span className='font-semibold'>{students.length}</span> students
                    </div>
                    {totalPages > 1 && (
                        <div className='flex items-center gap-1.5'>
                            <button
                                type='button'
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className='p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className='px-3 py-1 text-xs font-semibold text-slate-700'>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type='button'
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className='p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default StudentDatabaseListView
