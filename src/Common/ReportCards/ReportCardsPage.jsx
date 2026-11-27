import React, { useEffect, useMemo, useState } from 'react'
import { canUseExamsApi, listExamsApi, mapExamFromApi } from '../../services/examsApi'
import { getReportCardApi } from '../../services/resultsApi'
import { listStudentsApi } from '../../services/studentsApi'

const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

const studentName = (row) => row.fullName || row.full_name || row.name || row.admissionNumber || row.admission_number || ''
const studentClass = (row) => row.className || row.class_name || ''

const fmt = (value) => (value == null ? '—' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 }))

/** Marks per exam type for one subject line (several exams of one type are added together). */
const componentCell = (components, examType) => {
    const rows = (components || []).filter((row) => row.examType === examType)
    if (!rows.length) return '—'
    const sat = rows.filter((row) => !row.absent)
    if (!sat.length) return 'AB'
    const marks = sat.reduce((sum, row) => sum + Number(row.marks || 0), 0)
    const max = sat.reduce((sum, row) => sum + Number(row.maxMarks || 0), 0)
    return `${fmt(marks)} / ${fmt(max)}`
}

const ReportCardsPage = () => {
    const api = canUseExamsApi()
    const [exams, setExams] = useState([])
    const [students, setStudents] = useState([])
    const [className, setClassName] = useState('')
    const [section, setSection] = useState('')
    const [studentId, setStudentId] = useState('')
    const [academicYear, setAcademicYear] = useState('')
    const [term, setTerm] = useState('')
    const [selectedTypes, setSelectedTypes] = useState([])
    const [loaded, setLoaded] = useState(false)
    const [loadError, setLoadError] = useState('')
    const [card, setCard] = useState(null)
    const [cardLoading, setCardLoading] = useState(false)
    const [cardError, setCardError] = useState('')

    useEffect(() => {
        if (!api) return undefined
        let cancelled = false
        Promise.all([listExamsApi(), listStudentsApi()])
            .then(([examRows, studentRows]) => {
                if (cancelled) return
                setExams(examRows.map(mapExamFromApi))
                setStudents(Array.isArray(studentRows) ? studentRows : [])
                setLoadError('')
            })
            .catch((err) => {
                if (!cancelled) setLoadError(err?.message || 'Could not load exams or students.')
            })
            .finally(() => {
                if (!cancelled) setLoaded(true)
            })
        return () => {
            cancelled = true
        }
    }, [api])
    const loading = api && !loaded

    const classOptions = useMemo(
        () => [...new Set(students.map(studentClass).filter(Boolean))].sort(),
        [students],
    )
    const sectionOptions = useMemo(() => {
        const rows = className ? students.filter((row) => studentClass(row) === className) : students
        return [...new Set(rows.map((row) => row.section).filter(Boolean))].sort()
    }, [students, className])
    const filteredStudents = useMemo(() => students.filter((row) => {
        if (className && studentClass(row) !== className) return false
        if (section && row.section !== section) return false
        return true
    }), [students, className, section])

    const classExams = useMemo(
        () => exams.filter((exam) => exam.status === 'approved' && (!className || exam.className === className)),
        [exams, className],
    )
    const yearOptions = useMemo(
        () => [...new Set(classExams.map((exam) => exam.academicYear).filter(Boolean))].sort(),
        [classExams],
    )
    const typeOptions = useMemo(() => {
        const seen = new Map()
        classExams
            .filter((exam) => !academicYear || exam.academicYear === academicYear)
            .forEach((exam) => {
                if (exam.examType && !seen.has(exam.examType)) seen.set(exam.examType, exam.examTypeName || exam.examType)
            })
        return [...seen.entries()].map(([code, label]) => ({ code, label }))
    }, [classExams, academicYear])

    const toggleType = (code) => {
        setSelectedTypes((current) => (current.includes(code) ? current.filter((item) => item !== code) : [...current, code]))
    }

    const generate = async () => {
        if (!studentId) {
            setCardError('Select a student first.')
            return
        }
        setCardLoading(true)
        setCardError('')
        setCard(null)
        try {
            const payload = await getReportCardApi(studentId, {
                academicYear,
                examTypes: selectedTypes,
                term,
            })
            setCard(payload)
        } catch (err) {
            setCardError(err?.message || 'Could not generate the report card.')
        } finally {
            setCardLoading(false)
        }
    }

    if (!api) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <h2 className='text-xl font-medium text-black'>Report Cards</h2>
                <p className='text-sm text-[#667085] mt-2'>
                    Sign in against the live API to generate report cards from published exam marks.
                </p>
            </section>
        )
    }

    const columns = card?.examTypes || []
    const hasSubjects = Boolean(card?.subjects?.length)
    const rule = card?.gradingRule

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 print:hidden'>
                <h2 className='text-xl font-medium text-black'>Report Cards</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Generated by the server from Director-published marks only. A term is the set of exam types you tick
                    (leave all unticked to include every published exam of the student&apos;s class).
                </p>
                {loadError ? <p className='text-sm text-[#B42318] mt-2'>{loadError}</p> : null}
                {loading ? <p className='text-sm text-[#667085] mt-2'>Loading exams and students…</p> : null}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4'>
                    <label className='text-sm text-[#808080] flex flex-col gap-1'>Class
                        <select
                            value={className}
                            onChange={(e) => {
                                setClassName(e.target.value)
                                setSection('')
                                setStudentId('')
                                setSelectedTypes([])
                                setCard(null)
                            }}
                            className={inputClass}
                        >
                            <option value=''>All</option>
                            {classOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className='text-sm text-[#808080] flex flex-col gap-1'>Section
                        <select
                            value={section}
                            onChange={(e) => {
                                setSection(e.target.value)
                                setStudentId('')
                                setCard(null)
                            }}
                            className={inputClass}
                        >
                            <option value=''>All</option>
                            {sectionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className='text-sm text-[#808080] flex flex-col gap-1'>Student
                        <select
                            value={studentId}
                            onChange={(e) => {
                                setStudentId(e.target.value)
                                setCard(null)
                            }}
                            className={inputClass}
                        >
                            <option value=''>{filteredStudents.length ? 'Select student' : 'No students'}</option>
                            {filteredStudents.map((row) => (
                                <option key={row.id} value={row.id}>
                                    {studentName(row)} ({row.admissionNumber || row.admission_number || row.id})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className='text-sm text-[#808080] flex flex-col gap-1'>Academic Year
                        <select
                            value={academicYear}
                            onChange={(e) => {
                                setAcademicYear(e.target.value)
                                setSelectedTypes([])
                                setCard(null)
                            }}
                            className={inputClass}
                        >
                            <option value=''>Current class</option>
                            {yearOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className='text-sm text-[#808080] flex flex-col gap-1'>Term label
                        <input
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            placeholder='e.g. Term 1'
                            className={inputClass}
                        />
                    </label>
                </div>
                <div className='mt-4'>
                    <p className='text-sm text-[#808080] mb-2'>Exam types in this term</p>
                    {typeOptions.length === 0 ? (
                        <p className='text-sm text-[#667085]'>
                            {className ? 'No Director-approved exams for this class yet.' : 'Select a class to choose exam types.'}
                        </p>
                    ) : (
                        <div className='flex flex-wrap gap-3'>
                            {typeOptions.map((type) => (
                                <label key={type.code} className='text-sm text-[#1E1E1E] flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={selectedTypes.includes(type.code)}
                                        onChange={() => toggleType(type.code)}
                                    />
                                    {type.label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div className='mt-4 flex flex-wrap gap-3'>
                    <button
                        type='button'
                        onClick={generate}
                        disabled={cardLoading || !studentId}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {cardLoading ? 'Generating…' : 'Generate Report Card'}
                    </button>
                    <button
                        type='button'
                        onClick={() => window.print()}
                        disabled={!hasSubjects}
                        className='bg-white text-[#515DEF] border border-[#515DEF] text-sm px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Print / Save Report Card
                    </button>
                </div>
                {cardError ? <p className='text-sm text-[#B42318] mt-2'>{cardError}</p> : null}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-6' id='report-card-print'>
                {!card ? (
                    <p className='text-sm text-[#667085] text-center py-6'>
                        {cardLoading ? 'Generating report card…' : 'Select a student and generate the report card.'}
                    </p>
                ) : (
                    <div className='border border-[#E2E8F0] rounded-xl p-6'>
                        <h3 className='text-2xl font-semibold text-[#0C1E5B] text-center'>QMIS Report Card</h3>
                        <p className='text-center text-sm text-[#667085] mt-1'>
                            {card.term || 'All published exams'}{card.academicYear ? ` · ${card.academicYear}` : ''}
                        </p>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-sm'>
                            <p><span className='text-[#808080]'>Student:</span> {card.studentName}</p>
                            <p><span className='text-[#808080]'>Admission No:</span> {card.admissionNumber || '—'}</p>
                            <p><span className='text-[#808080]'>Class:</span> {card.className || '—'}</p>
                            <p><span className='text-[#808080]'>Section:</span> {card.section || '—'}</p>
                            <p><span className='text-[#808080]'>Exams:</span> {card.exams.map((exam) => exam.examName).join(', ') || '—'}</p>
                            <p>
                                <span className='text-[#808080]'>Weighting:</span>{' '}
                                {card.weighting === 'weighted'
                                    ? card.weights.map((w) => `${w.examType} ${fmt(w.weight)}%`).join(', ')
                                    : 'Total marks ÷ maximum marks'}
                            </p>
                        </div>
                        {!hasSubjects ? (
                            <p className='text-sm text-[#667085] text-center py-6'>
                                No published marks for this student in the selected term.
                            </p>
                        ) : (
                            <div className='overflow-x-auto'>
                                <table className='w-full text-sm mt-6'>
                                    <thead className='bg-[#EDEEF5]'>
                                        <tr>
                                            <th className='text-left px-3 py-2'>Subject</th>
                                            {columns.map((code) => <th key={code} className='text-left px-3 py-2'>{code}</th>)}
                                            <th className='text-left px-3 py-2'>Total</th>
                                            <th className='text-left px-3 py-2'>%</th>
                                            <th className='text-left px-3 py-2'>Grade</th>
                                            <th className='text-left px-3 py-2'>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {card.subjects.map((row) => (
                                            <tr key={row.subject} className='border-b border-[#F2F4F7]'>
                                                <td className='px-3 py-2'>{row.subject}</td>
                                                {columns.map((code) => (
                                                    <td key={code} className='px-3 py-2'>{componentCell(row.components, code)}</td>
                                                ))}
                                                <td className='px-3 py-2'>{fmt(row.obtained)} / {fmt(row.maxMarks)}</td>
                                                <td className='px-3 py-2'>{fmt(row.percentage)}</td>
                                                <td className='px-3 py-2'>{row.grade}</td>
                                                <td className='px-3 py-2'>{row.result}</td>
                                            </tr>
                                        ))}
                                        {card.overall ? (
                                            <tr className='font-semibold'>
                                                <td className='px-3 py-2'>Overall</td>
                                                {columns.map((code) => <td key={code} className='px-3 py-2' />)}
                                                <td className='px-3 py-2'>{fmt(card.overall.obtained)} / {fmt(card.overall.maxMarks)}</td>
                                                <td className='px-3 py-2'>{fmt(card.overall.percentage)}</td>
                                                <td className='px-3 py-2'>{card.overall.grade || '—'}</td>
                                                <td className='px-3 py-2'>{card.overall.result || '—'}</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {rule ? (
                            <p className='text-xs text-[#667085] mt-4'>
                                Grades: {rule.bands.map((band) => `${band.grade} ≥ ${fmt(band.minPercent)}%`).join(', ')}.
                                {' '}Pass mark {fmt(rule.passMarkPercent)}% per subject. AB = absent.
                            </p>
                        ) : null}
                        <div className='flex justify-between mt-10 text-sm text-[#667085]'>
                            <span>Class Teacher</span>
                            <span>Principal</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default ReportCardsPage
