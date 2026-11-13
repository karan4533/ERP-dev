import { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    Phone,
    Users
} from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { getStudentsList, GENDERS } from './studentsListData'
import { CLASSES, SECTIONS } from '../AssignedClass/assignedClassData'

const StudentsList = () => {
    const [students] = useState(getStudentsList())
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClass, setSelectedClass] = useState('10')
    const [selectedSection, setSelectedSection] = useState('A')
    const [selectedGender, setSelectedGender] = useState('')
    const [selectedFeeStatus, setSelectedFeeStatus] = useState('All')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)

    const handleClearFilters = () => {
        setSearchTerm('')
        setSelectedClass('10')
        setSelectedSection('A')
        setSelectedGender('')
        setSelectedFeeStatus('All')
        setFromDate(null)
        setToDate(null)
    }

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const matchesSearch =
                !searchTerm ||
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesClass =
                !selectedClass || student.className.includes(selectedClass)
            const matchesSection =
                !selectedSection || student.section === selectedSection
            const matchesGender =
                !selectedGender || student.gender === selectedGender
            const matchesFee =
                selectedFeeStatus === 'All' || student.feeStatus === selectedFeeStatus

            return matchesSearch && matchesClass && matchesSection && matchesGender && matchesFee
        })
    }, [students, searchTerm, selectedClass, selectedSection, selectedGender, selectedFeeStatus])

    return (
        <section className='space-y-6'>
            {/* Allotted Class Context Banner */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-5'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h2 className='text-xl font-bold text-slate-800'>Allotted Class Student Roster</h2>
                            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                                <UserCheck size={13} />
                                Class Teacher: Class 10-A
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-1'>
                            Consolidated view of students, nested parent/guardian profiles, student academic history, and real-time fee payment status.
                        </p>
                    </div>

                    <div className='flex items-center gap-3 self-start md:self-auto'>
                        <div className='text-right'>
                            <span className='text-xs text-slate-400 block'>Class Strength</span>
                            <span className='text-sm font-bold text-slate-800'>{students.length} Students</span>
                        </div>
                        <div className='h-8 w-px bg-slate-200' />
                        <div className='text-right'>
                            <span className='text-xs text-slate-400 block'>Fee Compliance</span>
                            <span className='text-sm font-bold text-emerald-600'>
                                {Math.round((students.filter(s => s.feeStatus === 'Paid').length / students.length) * 100)}% Paid
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={handleClearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Reset to Allotted (10-A)
                    </button>
                    <span className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                        Student & Parent Directory
                    </span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-1.5'>
                        <label htmlFor='search' className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>Search</label>
                        <input
                            type='text'
                            id='search'
                            placeholder='Student name, parent, ID...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-lg px-3 py-2 w-full focus:outline-[#515DEF]'
                        />
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label htmlFor='fee-filter' className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>Fee Status</label>
                        <select
                            id='fee-filter'
                            value={selectedFeeStatus}
                            onChange={(e) => setSelectedFeeStatus(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-lg px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value='All'>All Statuses</option>
                            <option value='Paid'>Paid</option>
                            <option value='Pending'>Pending</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label htmlFor='class-filter' className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>Class</label>
                        <select
                            id='class-filter'
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-lg px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Classes</option>
                            {CLASSES.map((item) => (
                                <option key={item} value={item}>Class {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label htmlFor='section-filter' className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>Section</label>
                        <select
                            id='section-filter'
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-lg px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Sections</option>
                            {SECTIONS.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label htmlFor='gender-filter' className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>Gender</label>
                        <select
                            id='gender-filter'
                            value={selectedGender}
                            onChange={(e) => setSelectedGender(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-lg px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Genders</option>
                            {GENDERS.map((gender) => (
                                <option key={gender} value={gender}>{gender}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div className='flex items-center gap-2'>
                        <Users className='text-[#515DEF]' size={20} />
                        <h2 className='text-lg font-bold text-slate-800'>Students & Parent Details</h2>
                    </div>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center rounded-s-lg'>Roll & Student</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission No</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Sec</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Parent / Guardian Information</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Fee Status</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Academic & History</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='text-center py-8 text-slate-400'>
                                        No students found matching current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-3 py-4 rounded-s-lg'>
                                            <div className='flex items-center gap-3'>
                                                <img
                                                    src={student.profile}
                                                    alt={student.name}
                                                    className='w-10 h-10 rounded-full object-cover ring-2 ring-slate-100'
                                                />
                                                <div>
                                                    <span className='font-bold text-slate-900 block'>{student.name}</span>
                                                    <span className='text-xs text-[#515DEF] font-semibold'>{student.rollNumber}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-3 py-4 font-medium text-slate-800 whitespace-nowrap'>
                                            {student.admissionNumber}
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap font-medium text-slate-700'>
                                            {student.className} - {student.section}
                                        </td>
                                        <td className='px-3 py-4 max-w-xs'>
                                            <div className='space-y-0.5'>
                                                <span className='font-semibold text-slate-900 block text-xs'>
                                                    {student.parentName} ({student.parentRelation || 'Father'})
                                                </span>
                                                {student.motherName && (
                                                    <span className='text-xs text-slate-500 block'>
                                                        Mother: {student.motherName}
                                                    </span>
                                                )}
                                                <span className='inline-flex items-center gap-1 text-xs text-slate-600'>
                                                    <Phone size={11} className='text-slate-400' />
                                                    {student.parentContact}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            {student.feeStatus === 'Paid' ? (
                                                <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                                                    <CheckCircle2 size={12} />
                                                    Paid in Full
                                                </span>
                                            ) : (
                                                <div>
                                                    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200'>
                                                        <AlertCircle size={12} />
                                                        Pending
                                                    </span>
                                                    <span className='block text-xs font-semibold text-rose-600 mt-0.5'>
                                                        {student.pendingFeeAmount} Due
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className='px-3 py-4 text-xs max-w-xs'>
                                            <span className='font-medium text-slate-800 block'>
                                                {student.studentHistory?.academicStanding || 'A Grade'}
                                            </span>
                                            <span className='text-slate-400 block'>
                                                Attn: {student.studentHistory?.attendanceRate || '95%'} • Conduct: {student.studentHistory?.conduct || 'Good'}
                                            </span>
                                        </td>
                                        <td className='px-3 py-4 text-center rounded-e-lg whitespace-nowrap'>
                                            <NavLink
                                                to={`/teacher/user-management/students-list/view/${student.id}`}
                                                className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#515DEF] text-white hover:bg-[#434ecb] rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer'
                                                title='View Student Profile, Parents & Fee History'
                                            >
                                                <Eye size={13} /> View Profile & History
                                            </NavLink>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredStudents.length} of {students.length} entries
                </p>
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default StudentsList
