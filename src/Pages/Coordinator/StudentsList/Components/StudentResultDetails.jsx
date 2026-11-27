import React, { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { getStudentResultsApi } from '../../../../services/resultsApi'
import { getAccessToken, isApiAuthEnabled } from '../../../../services/apiClient'

const badgeColor = {
    Pass: 'bg-[#4CAF5033] text-[#4CAF50]',
    Fail: 'bg-[#FF000033] text-[#FF0000]',
}

const flattenResultRows = (payload) => {
    const exams = Array.isArray(payload) ? payload : payload?.exams || payload?.results || []
    const rows = []
    exams.forEach((exam) => {
        const subjects = exam.subjects || exam.subjectMarks || exam.marks || []
        if (Array.isArray(subjects) && subjects.length) {
            subjects.forEach((subject, index) => {
                rows.push({
                    id: `${exam.id || exam.examId || 'exam'}-${subject.subject || subject.name || index}`,
                    examName: exam.title || exam.examName || exam.name || 'Exam',
                    subject: subject.subject || subject.name || '—',
                    marks: subject.marks ?? subject.score ?? subject.obtained ?? '—',
                    maxMarks: subject.maxMarks ?? subject.total ?? exam.maxMarks ?? '—',
                    grade: subject.grade || exam.grade || '—',
                    status: subject.status || exam.status || (Number(subject.marks) >= Number(subject.passMarks || 0) ? 'Pass' : '—'),
                })
            })
        } else if (exam.subject || exam.marks != null) {
            rows.push({
                id: String(exam.id || exam.examId || rows.length),
                examName: exam.title || exam.examName || 'Exam',
                subject: exam.subject || '—',
                marks: exam.marks ?? exam.score ?? '—',
                maxMarks: exam.maxMarks ?? exam.total ?? '—',
                grade: exam.grade || '—',
                status: exam.status || '—',
            })
        }
    })
    return rows
}

const StudentResultDetails = ({ studentId }) => {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!studentId || !isApiAuthEnabled() || !getAccessToken()) {
            setRows([])
            return undefined
        }
        let cancelled = false
        setLoading(true)
        setError('')
        getStudentResultsApi(studentId)
            .then((payload) => {
                if (!cancelled) setRows(flattenResultRows(payload))
            })
            .catch((err) => {
                if (!cancelled) {
                    setRows([])
                    setError(err.message || 'Could not load results.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [studentId])

    const summary = useMemo(() => {
        const numeric = rows
            .map((row) => {
                const marks = Number(row.marks)
                const max = Number(row.maxMarks)
                if (!Number.isFinite(marks) || !Number.isFinite(max) || max <= 0) return null
                return (marks / max) * 100
            })
            .filter((value) => value != null)
        const average = numeric.length
            ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length
            : 0
        const buckets = [
            { label: 'Excellent', range: '90 - 100%', min: 90, color: '#4CAF50', count: 0 },
            { label: 'Very Good', range: '75 - 89%', min: 75, color: '#00B0FF', count: 0 },
            { label: 'Good', range: '50 - 74%', min: 50, color: '#FF9800', count: 0 },
            { label: 'Need Improvement', range: '<50%', min: 0, color: '#F44336', count: 0 },
        ]
        numeric.forEach((pct) => {
            if (pct >= 90) buckets[0].count += 1
            else if (pct >= 75) buckets[1].count += 1
            else if (pct >= 50) buckets[2].count += 1
            else buckets[3].count += 1
        })
        return { average, buckets, total: numeric.length }
    }, [rows])

    const pieChartOption = useMemo(() => ({
        series: [{
            type: 'pie',
            radius: ['64%', '91%'],
            center: ['50%', '50%'],
            startAngle: 90,
            padAngle: 3,
            silent: true,
            data: summary.buckets
                .filter((item) => item.count > 0)
                .map((item) => ({
                    value: item.count,
                    name: item.label,
                    itemStyle: { color: item.color },
                })),
            label: { show: false },
            labelLine: { show: false },
        }],
    }), [summary.buckets])

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                <div className='bg-white rounded-2xl shadow-md p-4 lg:col-span-1'>
                    <h3 className='text-base font-semibold text-black mb-2'>Performance snapshot</h3>
                    {loading ? (
                        <p className='text-sm text-[#667085]'>Loading results…</p>
                    ) : summary.total === 0 ? (
                        <p className='text-sm text-[#667085]'>No published results for this student yet.</p>
                    ) : (
                        <>
                            <div className='relative'>
                                <ReactECharts option={pieChartOption} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
                                <p className='absolute inset-0 flex items-center justify-center text-lg font-semibold pointer-events-none'>
                                    {summary.average.toFixed(1)}%
                                </p>
                            </div>
                            <ul className='space-y-1 text-sm mt-2'>
                                {summary.buckets.map((bucket) => (
                                    <li key={bucket.label} className='flex justify-between border-b border-[#F2F4F7] py-1 last:border-0'>
                                        <span className='text-[#667085]'>{bucket.label}</span>
                                        <span>{bucket.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {error ? <p className='text-sm text-[#F44336] mt-2'>{error}</p> : null}
                </div>

                <div className='bg-white rounded-2xl shadow-md p-4 lg:col-span-2 overflow-x-auto'>
                    <h3 className='text-base font-semibold text-black mb-3'>Subject results</h3>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5]'>
                            <tr>
                                {['Exam', 'Subject', 'Marks', 'Max', 'Grade', 'Status'].map((heading) => (
                                    <th key={heading} className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>{heading}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-2 py-8 text-center text-[#667085]'>
                                        No published exam marks yet.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                        <td className='px-2 py-3 text-[#1E1E1E]'>{row.examName}</td>
                                        <td className='px-2 py-3'>{row.subject}</td>
                                        <td className='px-2 py-3'>{row.marks}</td>
                                        <td className='px-2 py-3'>{row.maxMarks}</td>
                                        <td className='px-2 py-3'>{row.grade}</td>
                                        <td className='px-2 py-3'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default StudentResultDetails
