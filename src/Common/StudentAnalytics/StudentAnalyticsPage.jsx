import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useActiveStudent } from '../../context/ActiveStudentContext'
import { canUseResultsApi, getStudentResultsApi } from '../../services/resultsApi'

const round1 = (value) => Math.round(value * 10) / 10

/** Per-exam percentage and per-subject average from the child's own published results. */
const buildStudentAnalytics = (payload) => {
    const exams = Array.isArray(payload?.exams) ? payload.exams : []
    const trend = exams
        .filter((exam) => Number(exam.maxTotal) > 0)
        .map((exam) => ({
            label: exam.examName || exam.examType || 'Exam',
            className: exam.className || '',
            percentage: round1(Number(exam.percentage)),
        }))
    const subjects = new Map()
    exams.forEach((exam) => {
        ;(exam.subjects || []).forEach((subject) => {
            if (subject.absent || subject.marks == null || !Number(subject.maxMarks)) return
            const row = subjects.get(subject.subject) || { subject: subject.subject, marks: 0, max: 0, papers: 0 }
            row.marks += Number(subject.marks)
            row.max += Number(subject.maxMarks)
            row.papers += 1
            subjects.set(subject.subject, row)
        })
    })
    const subjectRows = [...subjects.values()]
        .map((row) => ({ subject: row.subject, papers: row.papers, percentage: round1((row.marks / row.max) * 100) }))
        .sort((a, b) => a.subject.localeCompare(b.subject))
    return { trend, subjects: subjectRows }
}

export default function StudentAnalyticsPage() {
    const { activeStudent } = useActiveStudent()
    const api = canUseResultsApi()
    const studentId = activeStudent?.id
    const [loaded, setLoaded] = useState({ studentId: null, payload: null, error: '' })

    useEffect(() => {
        if (!api || !studentId) return undefined
        let cancelled = false
        getStudentResultsApi(studentId)
            .then((data) => {
                if (!cancelled) setLoaded({ studentId, payload: data, error: '' })
            })
            .catch((err) => {
                if (!cancelled) {
                    setLoaded({ studentId, payload: null, error: err?.message || 'Could not load published results.' })
                }
            })
        return () => {
            cancelled = true
        }
    }, [api, studentId])

    const current = loaded.studentId === studentId ? loaded : null
    const loading = Boolean(api && studentId && !current)
    const payload = current?.payload || null
    const error = current?.error || (api && !studentId ? 'No student is selected.' : '')

    const analytics = useMemo(() => buildStudentAnalytics(payload), [payload])

    const trendOption = useMemo(() => ({
        color: ['#515DEF'],
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: analytics.trend.map((row) => row.label) },
        yAxis: { type: 'value', min: 0, max: 100 },
        series: [{ name: 'Score %', type: 'line', data: analytics.trend.map((row) => row.percentage) }],
    }), [analytics])

    const subjectOption = useMemo(() => ({
        color: ['#B4C4FF'],
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: analytics.subjects.map((row) => row.subject) },
        yAxis: { type: 'value', min: 0, max: 100 },
        series: [{ name: 'Average %', type: 'bar', data: analytics.subjects.map((row) => row.percentage) }],
    }), [analytics])

    const name = payload?.studentName || activeStudent?.name || ''
    const classLabel = payload?.className || ''

    return (
        <section className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
            <div>
                <h2 className='text-xl font-semibold'>Performance analytics</h2>
                <p className='text-sm text-[#667085]'>
                    {name ? `${name}${classLabel ? `, ${classLabel}` : ''}. ` : ''}
                    Built from results published after Director approval.
                </p>
            </div>
            {!api ? (
                <p className='text-sm text-[#667085]'>Sign in against the live API to see published results.</p>
            ) : loading ? (
                <p className='text-sm text-[#667085]'>Loading published results…</p>
            ) : error ? (
                <p className='text-sm text-[#B42318]'>{error}</p>
            ) : !analytics.trend.length ? (
                <p className='text-sm text-[#667085]'>No published results yet. Analytics appear once marks are published.</p>
            ) : (
                <>
                    <div>
                        <h3 className='text-base font-medium text-[#1E1E1E]'>Score by exam</h3>
                        <ReactECharts option={trendOption} style={{ height: 300 }} />
                    </div>
                    <div>
                        <h3 className='text-base font-medium text-[#1E1E1E]'>Subject average across exams</h3>
                        <ReactECharts option={subjectOption} style={{ height: 300 }} />
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='text-left text-[#667085] border-b'>
                                    <th className='py-2 pr-3'>Subject</th>
                                    <th className='py-2 pr-3'>Papers</th>
                                    <th className='py-2'>Average %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.subjects.map((row) => (
                                    <tr key={row.subject} className='border-b border-[#F0F0F0]'>
                                        <td className='py-2 pr-3'>{row.subject}</td>
                                        <td className='py-2 pr-3'>{row.papers}</td>
                                        <td className='py-2'>{row.percentage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    )
}
