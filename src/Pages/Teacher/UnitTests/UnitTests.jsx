import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    ChevronLeft,
    ChevronRight,
    Download,
    EllipsisIcon,
    Plus,
    CheckCircle2,
    ClipboardPen,
    Eye,
    Edit2,
    Trash2,
    X,
    Filter,
    Award
} from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import pdf_icon from '../../../assets/images/pdf-icon.png'
import noAssign from '../../../assets/images/no-assign.png'
import {
    CLASSES,
    filterUnitTests,
    formatTestDate,
    getUnitTests,
    saveUnitTests,
    calculateGrade,
    ROUTE_BASE,
    SECTIONS,
    SUBJECTS,
} from './unitTestsData'
import { useAuth } from '../../../context/AuthContext'
import { canRoleDelete } from '../../../Common/RBAC/actionPermissions'

const emptyFilters = {
    search: '',
    subject: '',
    className: '',
    section: '',
}

const DEFAULT_STUDENT_MARKS = [
    { studentId: 'STU-2024-1042', name: 'Aarav Sharma', roll: '10A-01', marks: '46' },
    { studentId: 'STU-2024-1087', name: 'Diya Nair', roll: '10A-02', marks: '42' },
    { studentId: 'STU-2024-1156', name: 'Rohan Verma', roll: '10A-03', marks: '44' },
    { studentId: 'STU-2024-1203', name: 'Ananya Reddy', roll: '10A-04', marks: '48' },
    { studentId: 'STU-2024-1318', name: 'Aditya Menon', roll: '10A-05', marks: '36' },
    { studentId: 'STU-2024-1425', name: 'Kavya Krishnan', roll: '10A-06', marks: '45' }
]

const UnitTests = () => {
    const { role } = useAuth()
    const canDelete = canRoleDelete(role)
    const isTeacher = role === 'teacher'

    const [allTests, setAllTests] = useState([])
    const [filters, setFilters] = useState(emptyFilters)
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [entriesPerPage, setEntriesPerPage] = useState(10)

    // Mark / Grade Entry Modal State
    const [markEntryModalTest, setMarkEntryModalTest] = useState(null)
    const [studentScores, setStudentScores] = useState([])

    useEffect(() => {
        setAllTests(getUnitTests())
    }, [])

    // Restrict visibility: Teachers only see their own tests (Anita Verma / Mathematics)
    // Higher roles (Coordinator, Principal, Director, Admin) see all tests
    const roleScopedTests = useMemo(() => {
        if (isTeacher) {
            return allTests.filter(
                (test) => test.teacher === 'Anita Verma' || test.subject === 'Mathematics'
            )
        }
        return allTests
    }, [allTests, isTeacher])

    const filteredItems = useMemo(
        () => filterUnitTests(roleScopedTests, filters),
        [roleScopedTests, filters]
    )

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }))
    }

    const clearFilters = () => setFilters(emptyFilters)

    const handleOpenMarkEntry = (test) => {
        setMarkEntryModalTest(test)
        setStudentScores(
            DEFAULT_STUDENT_MARKS.map((s) => ({
                ...s,
                marks: test.marksEntered ? s.marks : ''
            }))
        )
    }

    const handleScoreChange = (studentId, value) => {
        setStudentScores((prev) =>
            prev.map((s) => (s.studentId === studentId ? { ...s, marks: value } : s))
        )
    }

    const handleSaveMarks = (e) => {
        e.preventDefault()
        if (!markEntryModalTest) return

        const validScores = studentScores
            .map((s) => Number(s.marks))
            .filter((val) => !isNaN(val) && val > 0)
        const avg = validScores.length > 0
            ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1))
            : null

        const updated = allTests.map((t) =>
            t.id === markEntryModalTest.id
                ? { ...t, marksEntered: true, averageScore: avg }
                : t
        )
        setAllTests(updated)
        saveUnitTests(updated)
        setMarkEntryModalTest(null)
    }

    return (
        <section className='space-y-6'>
            {/* Header / Scope Banner */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-5'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h2 className='text-xl font-bold text-slate-800'>CA / PCA Assessment Management</h2>
                            {isTeacher ? (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200'>
                                    Teacher Scope: Mathematics (Anita Verma)
                                </span>
                            ) : (
                                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200'>
                                    Institution Oversight: All Academic Wings
                                </span>
                            )}
                        </div>
                        <p className='text-xs text-slate-500 mt-1'>
                            Continuous Assessments (CA) and Periodic Continuous Assessments (PCA) schedule, question papers, and marks & grade recording.
                        </p>
                    </div>

                    <div className='flex items-center gap-2'>
                        <NavLink
                            to={`${ROUTE_BASE}/add`}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create CA / PCA Test
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <span className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                        Assessment Filters
                    </span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={filters.search}
                            onChange={(event) => updateFilter('search', event.target.value)}
                            placeholder='Entry ID, title, teacher...'
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='subject-filter' className='text-base font-medium text-[#808080]'>Subject</label>
                        <select
                            id='subject-filter'
                            value={filters.subject}
                            onChange={(event) => updateFilter('subject', event.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Subjects</option>
                            {SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={filters.className}
                            onChange={(event) => updateFilter('className', event.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Classes</option>
                            {CLASSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={filters.section}
                            onChange={(event) => updateFilter('section', event.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Sections</option>
                            {SECTIONS.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>CA / PCA Assessment List</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            {isTeacher
                                ? 'Showing assessments allotted to your teaching profile'
                                : 'Showing all institutional continuous assessment schedules'
                            }
                        </p>
                    </div>
                    <div className='flex gap-x-2'>
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

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Entry ID & Type</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject & Faculty</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Sec</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assessment Title</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Test Date</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Marks / Time</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Marks Status</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='text-center py-8 text-slate-400'>
                                        No CA / PCA assessments found for current filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.slice(0, entriesPerPage).map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-3 py-4 font-semibold text-slate-800 rounded-s-lg whitespace-nowrap'>
                                            {record.entryId}
                                            <span className={`block text-xs font-bold ${
                                                record.type === 'PCA' ? 'text-purple-600' : 'text-blue-600'
                                            }`}>
                                                {record.type || 'CA'}
                                            </span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            <span className='font-bold text-slate-900 block'>{record.subject}</span>
                                            <span className='text-xs text-slate-500'>{record.teacher}</span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap font-medium text-slate-700'>
                                            {record.className} - {record.section}
                                        </td>
                                        <td className='px-3 py-4 max-w-xs'>
                                            <span className='font-medium text-slate-900 block line-clamp-1'>{record.title}</span>
                                            <span className='text-xs text-slate-400 line-clamp-1'>{record.description}</span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>{formatTestDate(record.testDate)}</td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            <span className='font-bold text-slate-800 block'>{record.totalMarks} Marks</span>
                                            <span className='text-xs text-slate-400'>{record.duration} mins</span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            {record.marksEntered ? (
                                                <div>
                                                    <span className='inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200'>
                                                        <CheckCircle2 size={12} />
                                                        Marks Recorded
                                                    </span>
                                                    {record.averageScore && (
                                                        <span className='block text-xs text-slate-500 mt-0.5'>
                                                            Class Avg: {record.averageScore}/{record.totalMarks}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    type='button'
                                                    onClick={() => handleOpenMarkEntry(record)}
                                                    className='inline-flex items-center gap-1 text-xs font-bold text-[#515DEF] bg-indigo-50 hover:bg-[#515DEF] hover:text-white px-2.5 py-1 rounded-lg border border-indigo-200 transition-all'
                                                >
                                                    <ClipboardPen size={12} />
                                                    Enter Marks
                                                </button>
                                            )}
                                        </td>
                                        <td className='px-3 py-4 text-center rounded-e-lg whitespace-nowrap'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`${ROUTE_BASE}/view/${record.id}`}
                                                    className='flex items-center gap-2 w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-xs'
                                                >
                                                    <Eye size={13} />
                                                    View Details
                                                </NavLink>
                                                <button
                                                    type='button'
                                                    onClick={() => handleOpenMarkEntry(record)}
                                                    className='flex items-center gap-2 w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-xs font-semibold text-[#515DEF]'
                                                >
                                                    <ClipboardPen size={13} />
                                                    {record.marksEntered ? 'Edit Marks & Grades' : 'Enter Marks / Grades'}
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => setEditRequestModal(true)}
                                                    className='flex items-center gap-2 w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-xs'
                                                >
                                                    <Edit2 size={13} />
                                                    Edit Schedule
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        type='button'
                                                        onClick={() => setDeleteRequestModal(true)}
                                                        className='flex items-center gap-2 w-full text-left p-2 hover:bg-rose-600 hover:text-white rounded cursor-pointer text-xs text-rose-600'
                                                    >
                                                        <Trash2 size={13} />
                                                        Delete
                                                    </button>
                                                )}
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {Math.min(filteredItems.length, entriesPerPage)} of {filteredItems.length} entries
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

            {/* ENTER MARKS / GRADES MODAL */}
            {markEntryModalTest && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <ClipboardPen className='text-[#515DEF]' size={22} />
                                <div>
                                    <h3 className='text-lg font-bold text-slate-800'>Enter Assessment Marks & Grades</h3>
                                    <p className='text-xs text-slate-500'>
                                        {markEntryModalTest.title} • {markEntryModalTest.className} - {markEntryModalTest.section} (Max: {markEntryModalTest.totalMarks} Marks)
                                    </p>
                                </div>
                            </div>
                            <button
                                type='button'
                                onClick={() => setMarkEntryModalTest(null)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMarks} className='space-y-4'>
                            <div className='overflow-x-auto'>
                                <table className='w-full text-xs text-left'>
                                    <thead className='bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold'>
                                        <tr>
                                            <th className='px-3 py-2.5'>Roll & Student Name</th>
                                            <th className='px-3 py-2.5'>Max Marks</th>
                                            <th className='px-3 py-2.5'>Marks Obtained</th>
                                            <th className='px-3 py-2.5'>Percentage</th>
                                            <th className='px-3 py-2.5 text-center'>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-slate-100'>
                                        {studentScores.map((student) => {
                                            const total = markEntryModalTest.totalMarks
                                            const marks = Number(student.marks)
                                            const pct = !isNaN(marks) && marks > 0 ? ((marks / total) * 100).toFixed(1) : '—'
                                            const grade = calculateGrade(marks, total)

                                            return (
                                                <tr key={student.studentId} className='hover:bg-slate-50/50'>
                                                    <td className='px-3 py-3 font-medium text-slate-800'>
                                                        <span className='font-bold block'>{student.name}</span>
                                                        <span className='text-slate-400'>{student.roll}</span>
                                                    </td>
                                                    <td className='px-3 py-3 text-slate-600 font-semibold'>
                                                        {total}
                                                    </td>
                                                    <td className='px-3 py-3'>
                                                        <input
                                                            type='number'
                                                            min='0'
                                                            max={total}
                                                            step='0.5'
                                                            required
                                                            value={student.marks}
                                                            onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                                                            className='w-24 px-2.5 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                                            placeholder='0 - 50'
                                                        />
                                                    </td>
                                                    <td className='px-3 py-3 font-semibold text-slate-700'>
                                                        {pct !== '—' ? `${pct}%` : '—'}
                                                    </td>
                                                    <td className='px-3 py-3 text-center'>
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                                            grade === 'A+' || grade === 'A'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : grade === 'B+' || grade === 'B'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : grade === 'C'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {grade}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className='flex justify-between items-center pt-3 border-t'>
                                <span className='text-xs text-slate-400'>
                                    Grades are automatically determined by institutional percentage scale.
                                </span>
                                <div className='flex items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => setMarkEntryModalTest(null)}
                                        className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        className='px-4 py-2 bg-[#515DEF] hover:bg-[#434ecb] text-white rounded-lg text-sm font-semibold shadow-sm'
                                    >
                                        Save Marks & Calculate Grades
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            {canDelete && <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />}
        </section>
    )
}

export default UnitTests
