import { SCHOOL_PROFILE } from '../../constants/schoolProfile'

export const PLANNING_COLUMNS = [
    { key: 'day', label: 'Day' },
    { key: 'mainConcepts', label: 'Main Concepts' },
    { key: 'subConcepts', label: 'Sub Concepts' },
    { key: 'learningOutcomes', label: 'Learning Outcome(s)' },
    { key: 'cognitiveLevel', label: 'Cognitive Level (for each LO)' },
    { key: 'formativeAssessment', label: 'Formative assessment tasks planned' },
    { key: 'methodology', label: 'Teaching methodology & Activities / Student Driven (in brief)' },
    { key: 'additionalStrategies', label: 'Additional Strategies, Global, & SDG Connects' },
    { key: 'resources', label: 'Resources, Worksheets & video links (Specify the requirements)' },
]

export const emptyPlanningRow = () => ({
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    day: '',
    mainConcepts: '',
    subConcepts: '',
    learningOutcomes: '',
    cognitiveLevel: '',
    formativeAssessment: '',
    methodology: '',
    additionalStrategies: '',
    resources: '',
})

const cell = (value) => (value === undefined || value === null || String(value).trim() === '' ? 'NA' : String(value))

export const planningRowsFromPlan = (plan) => {
    if (Array.isArray(plan?.planningRows) && plan.planningRows.length) return plan.planningRows
    if (!plan) return [emptyPlanningRow()]
    return [{
        ...emptyPlanningRow(),
        day: 'Day 1',
        mainConcepts: plan.title || '',
        learningOutcomes: plan.description || '',
    }]
}

export const lessonPlanPrintHtml = (plan) => {
    const rows = planningRowsFromPlan(plan)
    const headerCells = PLANNING_COLUMNS.map((column) => `<th>${column.label}</th>`).join('')
    const body = rows.map((row) => `<tr>${PLANNING_COLUMNS.map((column) => `<td style="white-space:pre-wrap">${escapeHtml(cell(row[column.key]))}</td>`).join('')}</tr>`).join('')
    return `<div>
        <p style="text-align:center;font-size:12px">${SCHOOL_PROFILE.name}</p>
        <h1 style="text-align:center;font-size:16px;margin:8px 0">Lesson Plan</h1>
        <p style="margin-bottom:8px"><strong>MONTH:</strong> ${escapeHtml(cell(plan.month))} &nbsp;&nbsp; <strong>WEEK NO:</strong> ${escapeHtml(cell(plan.weekNo))} &nbsp;&nbsp; <strong>ACADEMIC YEAR:</strong> ${escapeHtml(cell(plan.academicYear))}</p>
        <table>
            <tr>
                <th>Grade &amp; Section</th><th>Teacher</th><th>Subject</th><th>Planning Period (From - To dates)</th><th>Number of Sessions</th><th>Chapter No. and Name</th>
            </tr>
            <tr>
                <td>${escapeHtml(cell(plan.className))} ${escapeHtml(cell(plan.section))}</td>
                <td>${escapeHtml(cell(plan.submitterName))}</td>
                <td>${escapeHtml(cell(plan.subject))}</td>
                <td>${escapeHtml(cell(plan.fromDate))} to ${escapeHtml(cell(plan.toDate))}</td>
                <td>${escapeHtml(cell(plan.numberOfSessions))}</td>
                <td>${escapeHtml(cell(plan.chapterName || plan.title))}</td>
            </tr>
        </table>
        <table style="margin-top:8px"><thead><tr>${headerCells}</tr></thead><tbody>${body}</tbody></table>
        <p style="margin-top:10px;white-space:pre-wrap"><strong>Details of students who need special attention:</strong> ${escapeHtml(cell(plan.specialAttention))}</p>
        <p style="white-space:pre-wrap"><strong>Modified classroom setup for students requiring special care:</strong> ${escapeHtml(cell(plan.classroomSetup))}</p>
        <p style="white-space:pre-wrap"><strong>Teacher notes influencing learners or sessions:</strong> ${escapeHtml(cell(plan.teacherNotes))}</p>
        <p style="white-space:pre-wrap"><strong>Reflection:</strong> ${escapeHtml(cell(plan.reflection))}</p>
        <table style="margin-top:8px">
            <tr><th>Subject Mentor</th><th>Evaluator</th><th>Coordinator</th><th>Total No. of SDG Planned</th><th>Total No. of SDC Planned</th><th>Total No. of Worksheets Planned</th></tr>
            <tr>
                <td>${escapeHtml(cell(plan.subjectMentor))}</td>
                <td>${escapeHtml(cell(plan.evaluator))}</td>
                <td>${escapeHtml(cell(plan.coordinatorSignoff))}</td>
                <td>${escapeHtml(cell(plan.sdgPlanned))}</td>
                <td>${escapeHtml(cell(plan.sdcPlanned))}</td>
                <td>${escapeHtml(cell(plan.worksheetsPlanned))}</td>
            </tr>
        </table>
    </div>`
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}
