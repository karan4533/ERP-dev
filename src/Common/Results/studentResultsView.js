/**
 * Turns the server's published results (GET /results/students/{id}) into what the result screens show.
 * Grades and pass/fail use the school's existing rules (gradeRules.js); nothing is invented when no
 * result is published.
 */
import { PASS_MARK_PERCENT, getGradeFromPercentage } from '../MarkEntryApproval/gradeRules'

/** Bands already used by the result page's performance summary. */
export const PERFORMANCE_BANDS = [
    { label: 'Excellent', range: '90 - 100%', min: 90, color: '#4CAF50' },
    { label: 'Very Good', range: '75 - 89%', min: 75, color: '#00B0FF' },
    { label: 'Good', range: '50 - 74%', min: 50, color: '#FF9800' },
    { label: 'Need Improvement', range: '<50%', min: 0, color: '#F44336' },
]

const round2 = (value) => Math.round(value * 100) / 100

export const formatPercent = (value) => (value == null || Number.isNaN(value) ? '—' : `${round2(value)} %`)

/** One row per exam and subject. */
export const buildResultRows = (payload) => {
    const exams = Array.isArray(payload?.exams) ? payload.exams : []
    const rows = []
    exams.forEach((exam) => {
        ;(exam.subjects || []).forEach((subject) => {
            const max = Number(subject.maxMarks)
            const absent = Boolean(subject.absent)
            const marks = subject.marks == null ? null : Number(subject.marks)
            const percent = !absent && marks != null && max > 0 ? (marks / max) * 100 : null
            rows.push({
                id: `${exam.examId}|${subject.subject}`,
                examId: exam.examId,
                examName: exam.examName,
                examType: exam.examType || '',
                className: exam.className || '',
                section: exam.section || '',
                academicYear: exam.academicYear || '',
                subject: subject.subject,
                totalMarks: max || '—',
                obtainedMarks: absent ? 'Absent' : marks ?? '—',
                percent,
                percentage: percent == null ? '—' : `${Math.round(percent)}%`,
                grade: percent == null ? '—' : getGradeFromPercentage(percent),
                resultStatus: absent ? 'Absent' : percent == null ? '—' : percent >= PASS_MARK_PERCENT ? 'Pass' : 'Fail',
                teacherRemarks: subject.remarks || '—',
            })
        })
    })
    return rows
}

/** Subject counts per performance band (absent subjects are not counted). */
export const bandCounts = (rows) =>
    PERFORMANCE_BANDS.map((band, index) => {
        const upper = index === 0 ? Infinity : PERFORMANCE_BANDS[index - 1].min
        return {
            ...band,
            subjects: rows.filter((row) => row.percent != null && row.percent >= band.min && row.percent < upper).length,
        }
    })

/**
 * Overall percentage: the server's weighted final when the school has configured weightage for the class,
 * otherwise all published marks over all maximum marks.
 */
export const buildResultSummary = (payload, rows = buildResultRows(payload)) => {
    const exams = Array.isArray(payload?.exams) ? payload.exams : []
    const weighted = payload?.weighted?.finalPercentage
    let overall = null
    let basis = ''
    if (weighted != null) {
        overall = Number(weighted)
        basis = payload.weighted.complete ? 'Weighted final' : 'Weighted (not all exam types published yet)'
    } else {
        const total = exams.reduce((sum, exam) => sum + Number(exam.total || 0), 0)
        const max = exams.reduce((sum, exam) => sum + Number(exam.maxTotal || 0), 0)
        if (max > 0) {
            overall = (total / max) * 100
            basis = 'All published marks'
        }
    }
    const scored = rows.filter((row) => row.percent != null)
    const best = scored.reduce((top, row) => (top == null || row.percent > top.percent ? row : top), null)
    return {
        examAppeared: exams.length,
        overallPercent: overall == null ? null : round2(overall),
        overallBasis: basis,
        overallGrade: overall == null ? '—' : getGradeFromPercentage(overall),
        highestMark: best ? `${best.obtainedMarks}/${best.totalMarks}` : '—',
        highestSubject: best ? `${best.subject} · ${best.examName}` : '—',
    }
}
