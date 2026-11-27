export const AUDIT_COMPONENTS_KEY = 'schoolerp-audit-components-v1'
export const AUDIT_DEVIATIONS_KEY = 'schoolerp-audit-shared-deviations-v1'
export const AUDIT_REWORK_KEY = 'schoolerp-audit-rework-v1'

const splitRubrics = (value = '') => {
    const parts = String(value).split(',').map((item) => item.trim()).filter(Boolean)
    return {
        rubric1: parts[0] || '',
        rubric2: parts[1] || '',
        rubric3: parts[2] || '',
        rubric4: parts[3] || '',
    }
}

export const COMPONENT_SEED = [
    { id: 'AC-001', component: 'Teachers Class Observation', grades: '1-12', subComponent: 'Instruction', ...splitRubrics('Engagement, pacing, questioning, differentiation'), frequency: 'MONTHLY', ratingScale: 5, duration: '40 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-002', component: 'Notebook / Content Book / Worksheet', grades: '1-10', subComponent: 'Correction', ...splitRubrics('Coverage, feedback, neatness, follow-up'), frequency: 'MONTHLY', ratingScale: 5, duration: '20 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-003', component: 'Journal', grades: '6-12', subComponent: 'Reflection', ...splitRubrics('Completeness, depth, regularity, presentation'), frequency: 'TERMLY', ratingScale: 3, duration: '15 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-004', component: 'Bulletin Board', grades: 'All', subComponent: 'Display', ...splitRubrics('Relevance, currency, creativity, student voice'), frequency: 'MONTHLY', ratingScale: 3, duration: '10 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-005', component: 'Circle Time', grades: 'Pre-primary', subComponent: 'Routine', ...splitRubrics('Participation, engagement, routine, listening'), frequency: 'WEEKLY', ratingScale: 5, duration: '20 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-006', component: 'Bridge Hour', grades: '1-8', subComponent: 'Support', ...splitRubrics('Target group coverage, remediation, tracking, outcomes'), frequency: 'WEEKLY', ratingScale: 5, duration: '40 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-007', component: 'CA / RCT score update', grades: '1-12', subComponent: 'Assessment', ...splitRubrics('Timely entry, accuracy, completeness, review'), frequency: 'MONTHLY', ratingScale: 3, duration: '15 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-008', component: 'Homework', grades: '1-12', subComponent: 'Home Fun', ...splitRubrics('Load, feedback, quality, parent communication'), frequency: 'WEEKLY', ratingScale: 5, duration: '15 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-009', component: 'Communication Video', grades: 'All', subComponent: 'Parent communication', ...splitRubrics('Clarity, relevance, delivery, engagement'), frequency: 'MONTHLY', ratingScale: 3, duration: '10 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-010', component: 'Book Review', grades: '3-12', subComponent: 'Reading', ...splitRubrics('Evidence of review, comprehension, reflection, presentation'), frequency: 'TERMLY', ratingScale: 5, duration: '15 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-011', component: 'Lesson Plan', grades: 'All', subComponent: 'Planning', ...splitRubrics('Alignment to syllabus, objectives, differentiation, assessment'), frequency: 'WEEKLY', ratingScale: 5, duration: '20 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-012', component: 'Process compliance walkthrough', grades: 'N/A', subComponent: 'SOP', ...splitRubrics('SOP adherence, documentation, controls, follow-up'), frequency: 'MONTHLY', ratingScale: 3, duration: '45 min', stream: 'PROCESS', active: 'Yes' },
]

export const DEVIATION_SEED = [
    { id: 'DEV-2026-0001', observationId: 'OBS-QA-2026-001', stream: 'QUALITY', component: 'Lesson Plan', department: 'Academics', severity: 'Medium', owner: 'Coordinator', status: 'Open', rcaStatus: 'Pending', atrStatus: 'Pending', createdAt: '2026-09-01' },
    { id: 'DEV-2026-0002', observationId: 'OBS-PA-2026-014', stream: 'PROCESS', component: 'Stores issue register', department: 'Stores', severity: 'High', owner: 'Stores Manager', status: 'Open', rcaStatus: 'Submitted', atrStatus: 'Pending', createdAt: '2026-09-04' },
    { id: 'DEV-2026-0003', observationId: 'OBS-QA-2026-008', stream: 'QUALITY', component: 'Homework', department: 'Academics', severity: 'Critical', owner: 'Principal', status: 'Open', rcaStatus: 'Pending', atrStatus: 'Pending', createdAt: '2026-09-08' },
]

export const AUDIT_FREQUENCIES = ['ONE_TIME', 'DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'TERMLY', 'YEARLY']

export const OVERALL_REMARKS = [
    { component: 'Lesson Plan', pqaAppreciation: 'Plans map to outcomes', pqaImprovement: 'Differentiation notes', spqaAppreciation: 'Weekly submission', spqaImprovement: 'Reflection column' },
    { component: 'Homework', pqaAppreciation: 'Load is balanced', pqaImprovement: 'Feedback turnaround', spqaAppreciation: 'Correction evidence', spqaImprovement: 'Parent communication' },
]
