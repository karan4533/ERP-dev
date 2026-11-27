import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    CalendarRange,
    BadgePercent,
    BookOpenCheck,
    CircleCheck,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Download,
    Star,
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import resultImg from '../../../assets/images/result-img.png'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import {
    getApprovedMarksForStudent,
    getGradeFromPercentage,
    getStudentResultSummary,
    PASS_MARK_PERCENT,
} from '../../../Common/MarkEntryApproval/markEntryApprovalData'
import { canUseResultsApi, getStudentResultsApi } from '../../../services/resultsApi'

const CATEGORY_DEFS = [
    { label: 'Excellent', range: '90 - 100%', min: 90, max: 100, color: '#4CAF50' },
    { label: 'Very Good', range: '75 - 89%', min: 75, max: 89.999, color: '#00B0FF' },
    { label: 'Good', range: '50 - 74%', min: 50, max: 74.999, color: '#FF9800' },
    { label: 'Need Improvement', range: '<50%', min: 0, max: 49.999, color: '#F44336' },
]

const badgeColor = {
    Pass: 'bg-[#4CAF5033] text-[#4CAF50]',
    Fail: 'bg-[#FF000033] text-[#FF0000]',
    Absent: 'bg-[#FF980033] text-[#FF9800]',
}

const flattenApiExamRows = (payload, studentName = '') => {
    const exams = Array.isArray(payload?.exams) ? payload.exams : []
    const rows = []
    exams.forEach((exam, examIndex) => {
        const subjects = Array.isArray(exam.subjects) ? exam.subjects : []
        if (subjects.length) {
            subjects.forEach((subject, subjectIndex) => {
                const maxMarks = Number(subject.maxMarks)
                const marks = subject.marks
                const absent = Boolean(subject.absent)
                let percentage = null
                let grade = '—'
                let resultStatus = 'Absent'
                let displayPercent = '—'
                let obtainedMarks = '—'

                if (absent) {
                    resultStatus = 'Absent'
                } else if (marks != null && maxMarks > 0) {
                    percentage = (Number(marks) / maxMarks) * 100
                    grade = getGradeFromPercentage(percentage)
                    resultStatus = percentage >= PASS_MARK_PERCENT ? 'Pass' : 'Fail'
                    displayPercent = `${Math.round(percentage)}%`
                    obtainedMarks = marks
                }

                rows.push({
                    id: `${exam.examId || examIndex}-${subject.subject || subjectIndex}`,
                    examName: exam.examName || 'Exam',
                    examType: exam.examType || '',
                    examId: exam.examId || '',
                    subject: subject.subject || '—',
                    totalMarks: Number.isFinite(maxMarks) && maxMarks > 0 ? maxMarks : '—',
                    obtainedMarks,
                    grade,
                    percentage: displayPercent,
                    percentageValue: percentage,
                    resultStatus,
                    teacherRemarks: '—',
                    studentName,
                    source: 'api',
                })
            })
            return
        }

        // Exam-level aggregate when subject breakdown is missing
        if (exam.percentage != null || exam.total != null) {
            const percentage = exam.percentage != null ? Number(exam.percentage) : null
            rows.push({
                id: `${exam.examId || examIndex}-overall`,
                examName: exam.examName || 'Exam',
                examType: exam.examType || '',
                examId: exam.examId || '',
                subject: 'Overall',
                totalMarks: exam.maxTotal ?? '—',
                obtainedMarks: exam.total ?? '—',
                grade: percentage != null ? getGradeFromPercentage(percentage) : '—',
                percentage: percentage != null ? `${Math.round(percentage)}%` : '—',
                percentageValue: percentage,
                resultStatus:
                    percentage == null
                        ? '—'
                        : percentage >= PASS_MARK_PERCENT
                            ? 'Pass'
                            : 'Fail',
                teacherRemarks: '—',
                studentName,
                source: 'api',
            })
        }
    })
    return rows
}

const buildSummaryFromRows = (rows, studentName = 'Student') => {
    const numeric = rows.filter(
        (row) => row.resultStatus !== 'Absent' && row.obtainedMarks !== '—' && row.percentageValue != null,
    )
    const percentages = numeric.map((row) => Number(row.percentageValue))
    const averagePercent = percentages.length
        ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
        : 0

    let highestRow = null
    numeric.forEach((row) => {
        const current = Number(row.obtainedMarks)
        if (!highestRow || current > Number(highestRow.obtainedMarks)) highestRow = row
    })

    const examNames = new Set(rows.map((row) => row.examName).filter(Boolean))

    return {
        examAppeared: examNames.size || rows.length,
        averagePercent,
        highestMark: highestRow
            ? `${highestRow.obtainedMarks}/${highestRow.totalMarks}`
            : '—',
        highestSubject: highestRow?.subject ?? '—',
        overallGrade: averagePercent ? getGradeFromPercentage(averagePercent) : '—',
        encouragementName: studentName.split(' ')[0] || studentName || 'Student',
    }
}

const ResultDetails = () => {
    const { activeStudent } = useActiveStudent()
    const [selectMonth, setSelectMonth] = useState(null)
    const [examFilter, setExamFilter] = useState('')
    const [pageSize, setPageSize] = useState(10)
    const [page, setPage] = useState(1)
    const [apiPayload, setApiPayload] = useState(null)
    const [apiError, setApiError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!canUseResultsApi() || !activeStudent?.id) {
            setApiPayload(null)
            setApiError('')
            setLoading(false)
            return undefined
        }
        // Skip demo placeholder ids that are not UUIDs
        if (!/^[0-9a-f-]{36}$/i.test(String(activeStudent.id))) {
            setApiPayload(null)
            setApiError('')
            setLoading(false)
            return undefined
        }

        let active = true
        setLoading(true)
        getStudentResultsApi(activeStudent.id)
            .then((payload) => {
                if (!active) return
                setApiPayload(payload)
                setApiError('')
            })
            .catch((error) => {
                if (!active) return
                setApiPayload(null)
                setApiError(error?.message || 'Results could not be loaded from the server.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => {
            active = false
        }
    }, [activeStudent?.id])

    const allRows = useMemo(() => {
        if (apiPayload?.exams?.length) {
            return flattenApiExamRows(apiPayload, activeStudent?.name)
        }
        return getApprovedMarksForStudent(activeStudent?.id).map((row) => {
            const match = String(row.percentage).match(/(\d+(?:\.\d+)?)/)
            return {
                ...row,
                percentageValue: match ? Number(match[1]) : null,
                source: 'local',
            }
        })
    }, [activeStudent?.id, activeStudent?.name, apiPayload])

    const examOptions = useMemo(() => {
        const names = [...new Set(allRows.map((row) => row.examName).filter(Boolean))]
        return names.sort((a, b) => a.localeCompare(b))
    }, [allRows])

    const filteredRows = useMemo(() => {
        let rows = allRows
        if (examFilter) {
            rows = rows.filter((row) => row.examName === examFilter)
        }
        // Month filter only applies when local rows carry examDate
        if (selectMonth) {
            const month = selectMonth.getMonth()
            const year = selectMonth.getFullYear()
            const withDates = rows.filter((row) => row.examDate)
            if (withDates.length) {
                rows = rows.filter((row) => {
                    if (!row.examDate) return true
                    const date = new Date(row.examDate)
                    if (Number.isNaN(date.getTime())) return true
                    return date.getMonth() === month && date.getFullYear() === year
                })
            }
        }
        return rows
    }, [allRows, examFilter, selectMonth])

    const summary = useMemo(() => {
        if (allRows.length) {
            return buildSummaryFromRows(allRows, activeStudent?.name || 'Student')
        }
        return getStudentResultSummary(activeStudent?.id)
    }, [activeStudent?.id, activeStudent?.name, allRows])

    const performanceCategories = useMemo(() => {
        const counts = CATEGORY_DEFS.map((def) => ({ ...def, subjects: 0 }))
        filteredRows.forEach((row) => {
            if (row.percentageValue == null || row.resultStatus === 'Absent') return
            const value = Number(row.percentageValue)
            const bucket = counts.find((item) => value >= item.min && value <= item.max)
            if (bucket) bucket.subjects += 1
        })
        return counts
    }, [filteredRows])

    const chartData = useMemo(
        () => performanceCategories.filter((item) => item.subjects > 0),
        [performanceCategories],
    )

    const averageForChart = useMemo(() => {
        const values = filteredRows
            .filter((row) => row.percentageValue != null && row.resultStatus !== 'Absent')
            .map((row) => Number(row.percentageValue))
        if (!values.length) return null
        return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
    }, [filteredRows])

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    useEffect(() => {
        setPage(1)
    }, [examFilter, selectMonth, pageSize, activeStudent?.id])

    const pieChartOption = useMemo(() => ({
        series: [{
            type: 'pie',
            radius: ['64%', '91%'],
            center: ['50%', '50%'],
            startAngle: 90,
            padAngle: 3,
            silent: true,
            data: (chartData.length ? chartData : [{ name: 'No data', value: 1, color: '#E5E7EB' }]).map((item) => ({
                value: item.value ?? item.subjects,
                name: item.name || item.label,
                itemStyle: { color: item.color },
            })),
            label: { show: false },
            labelLine: { show: false },
            emphasis: { disabled: true },
        }],
    }), [chartData])

    const clearFilters = () => {
        setSelectMonth(null)
        setExamFilter('')
        setPage(1)
    }

    const exportCsv = () => {
        const header = [
            'Exam Name',
            'Subject',
            'Total Marks',
            'Obtained Marks',
            'Grade',
            'Percentage',
            'Result Status',
            'Teacher Remarks',
        ]
        const lines = [
            header.join(','),
            ...filteredRows.map((row) => [
                row.examName,
                row.subject,
                row.totalMarks,
                row.obtainedMarks,
                row.grade,
                row.percentage,
                row.resultStatus,
                row.teacherRemarks,
            ].map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
        ]
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `exam-results-${activeStudent?.name || 'student'}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <section>
            {apiError ? <p className='text-sm text-[#B42318] mb-3'>{apiError}</p> : null}
            {loading ? <p className='text-sm text-[#667085] mb-3'>Loading published results…</p> : null}
            {apiPayload?.exams?.length ? (
                <p className='text-sm text-[#667085] mb-3'>
                    Showing published results for {activeStudent?.name}.
                </p>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='bg-[#F0F8FE] border border-[#D2E2F0] rounded-xl p-4'>
                        <div className='flex items-center gap-4'>
                            <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#BFD9F8] p-4'>
                                <CalendarRange className='text-[#515DEF] w-10 h-10' />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <h3 className='text-lg font-bold text-[#0C1E5B]'>Exam Appeared</h3>
                                <span className='text-4xl font-bold text-[#0C1E5B]'>{summary.examAppeared}</span>
                                <span className='text-sm font-medium text-[#0C1E5B]'>Published</span>
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
                                <span className='text-4xl font-bold text-[#0B6D2C]'>{summary.averagePercent}%</span>
                                <span className='text-sm font-medium text-[#0B6D2C]'>Across subjects</span>
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
                                <span className='text-4xl font-bold text-[#980E0F]'>{summary.highestMark}</span>
                                <span className='text-sm font-medium text-[#980E0F]'>{summary.highestSubject}</span>
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
                                <span className='text-4xl font-bold text-[#2515B4]'>{summary.overallGrade}</span>
                                <span className='text-sm font-medium text-[#2515B4]'>From average</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]' htmlFor='select-month'>Select Month</label>
                        <div className='relative w-full'>
                            <DatePicker
                                id='select-month'
                                selected={selectMonth}
                                onChange={(date) => setSelectMonth(date)}
                                isClearable
                                dateFormat='MM/yyyy'
                                showMonthYearPicker
                                placeholderText='All months'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='exams-filter' className='text-base font-medium text-[#808080]'>Exams Filter</label>
                        <select
                            id='exams-filter'
                            value={examFilter}
                            onChange={(event) => setExamFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'
                        >
                            <option value=''>All</option>
                            {examOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type='button'
                        onClick={exportCsv}
                        disabled={!filteredRows.length}
                        className='bg-[#515DEF] text-white flex items-center gap-x-2 justify-center uppercase text-sm px-6 py-3 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-50'
                    >
                        <Download className='w-4 h-4' />
                        Export
                    </button>

                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-3 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Exam Result List</h2>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select
                        value={pageSize}
                        onChange={(event) => setPageSize(Number(event.target.value))}
                        className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'
                    >
                        {[10, 20, 30, 40, 50].map((size) => (
                            <option key={size} value={size}>{size}</option>
                        ))}
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
                            {pageRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        {loading
                                            ? 'Loading results…'
                                            : 'No published exam results yet. Results appear here after marks are approved and published.'}
                                    </td>
                                </tr>
                            ) : (
                                pageRows.map((row) => (
                                    <tr key={row.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 rounded-s-lg'>{row.examName}</td>
                                        <td className='px-2 py-4'>{row.subject || '—'}</td>
                                        <td className='px-2 py-4'>{row.totalMarks ?? '—'}</td>
                                        <td className='px-2 py-4'>{row.obtainedMarks ?? '—'}</td>
                                        <td className='px-2 py-4'>{row.grade || '—'}</td>
                                        <td className='px-2 py-4'>{row.percentage || '—'}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${badgeColor[row.resultStatus] ?? badgeColor.Pass}`}>
                                                {row.resultStatus || '—'}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>{row.teacherRemarks || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {filteredRows.length} result{filteredRows.length !== 1 ? 's' : ''}
                    {filteredRows.length ? ` · page ${currentPage} of ${totalPages}` : ''}
                </p>

                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button
                        type='button'
                        disabled={currentPage <= 1}
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                        .slice(Math.max(0, currentPage - 2), currentPage + 1)
                        .map((pageNumber) => (
                            <button
                                key={pageNumber}
                                type='button'
                                onClick={() => setPage(pageNumber)}
                                className={`size-8 flex justify-center items-center p-2 border border-[#E2E8F0] rounded-full cursor-pointer ${
                                    pageNumber === currentPage
                                        ? 'bg-[#515DEF] text-white'
                                        : 'bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white'
                                }`}
                            >
                                {pageNumber}
                            </button>
                        ))}
                    <button
                        type='button'
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-6'>
                <div className='bg-white rounded-2xl shadow-md p-6'>
                    <h3 className='text-xl font-bold text-[#0C1E5B] mb-6'>Performance Summary</h3>
                    <div className='flex items-center gap-6 flex-wrap md:flex-nowrap'>
                        <div className='relative w-[180px] h-[180px] shrink-0 mx-auto md:mx-0'>
                            <ReactECharts
                                option={pieChartOption}
                                style={{ height: '180px', width: '180px' }}
                                opts={{ renderer: 'svg' }}
                            />
                            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                                <span className='text-sm text-[#808080]'>Average</span>
                                <span className='text-2xl font-bold text-[#0C1E5B]'>
                                    {averageForChart != null ? `${averageForChart}%` : '—'}
                                </span>
                            </div>
                        </div>

                        <div className='flex flex-col gap-4 flex-1 w-full'>
                            {performanceCategories.map((item) => (
                                <div key={item.label} className='flex items-center justify-between gap-4'>
                                    <div className='flex items-center gap-2 min-w-0'>
                                        <span
                                            className='w-2.5 h-2.5 rounded-full shrink-0'
                                            style={{ backgroundColor: item.color }}
                                        />
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

                <div
                    className='rounded-2xl shadow-md p-6 bg-cover bg-right bg-no-repeat min-h-[200px] flex items-center'
                    style={{ backgroundImage: `url(${resultImg})` }}
                >
                    <div className='flex items-center gap-4 max-w-[55%]'>
                        <Star className='w-14 h-14 md:w-16 md:h-16 text-[#0056D2] fill-[#0056D2] shrink-0' />
                        <div>
                            <h3 className='text-xl md:text-2xl lg:text-3xl font-bold text-[#0056D2] leading-tight'>
                                {summary.examAppeared > 0
                                    ? `Great Job, ${summary.encouragementName}!`
                                    : `Hello, ${summary.encouragementName}!`}
                            </h3>
                            <p className='text-sm md:text-base text-[#0C1E5B] mt-2 leading-relaxed'>
                                {summary.examAppeared > 0
                                    ? 'You are performing well. Keep up the good work and continue to achieve more!'
                                    : 'Your exam results will appear here once marks are approved and published.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-[#F1FCF2] rounded-2xl shadow-md border border-[#D1E7CC] p-4 mt-6'>
                <span className='text-base text-[#808080]'>
                    <strong className='text-[#0B6D2C]'>Note:</strong> For any queries regarding results, please contact your class teacher.
                </span>
            </div>
        </section>
    )
}

export default ResultDetails
