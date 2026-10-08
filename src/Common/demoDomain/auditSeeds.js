export const AUDIT_COMPONENTS_KEY = 'schoolerp-audit-components-v1'
export const AUDIT_DEVIATIONS_KEY = 'schoolerp-audit-shared-deviations-v1'
export const AUDIT_REWORK_KEY = 'schoolerp-audit-rework-v1'

export const COMPONENT_SEED = [
    { id: 'AC-001', component: 'Teachers Class Observation', grades: '1-12', subComponent: 'Instruction', rubrics: 'Engagement, pacing, questioning', frequency: 'MONTHLY', ratingScale: 5, duration: '40 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-002', component: 'Notebook / Content Book / Worksheet', grades: '1-10', subComponent: 'Correction', rubrics: 'Coverage, feedback, neatness', frequency: 'MONTHLY', ratingScale: 5, duration: '20 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-003', component: 'Journal', grades: '6-12', subComponent: 'Reflection', rubrics: 'Completeness', frequency: 'TERMLY', ratingScale: 3, duration: '15 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-004', component: 'Bulletin Board', grades: 'All', subComponent: 'Display', rubrics: 'Relevance, currency', frequency: 'MONTHLY', ratingScale: 3, duration: '10 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-005', component: 'Circle Time', grades: 'Pre-primary', subComponent: 'Routine', rubrics: 'Participation', frequency: 'WEEKLY', ratingScale: 5, duration: '20 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-006', component: 'Bridge Hour', grades: '1-8', subComponent: 'Support', rubrics: 'Target group coverage', frequency: 'WEEKLY', ratingScale: 5, duration: '40 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-007', component: 'CA / RCT score update', grades: '1-12', subComponent: 'Assessment', rubrics: 'Timely entry', frequency: 'MONTHLY', ratingScale: 3, duration: '15 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-008', component: 'Homework', grades: '1-12', subComponent: 'Home Fun', rubrics: 'Load and feedback', frequency: 'WEEKLY', ratingScale: 5, duration: '15 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-009', component: 'Communication Video', grades: 'All', subComponent: 'Parent communication', rubrics: 'Clarity', frequency: 'MONTHLY', ratingScale: 3, duration: '10 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-010', component: 'Book Review', grades: '3-12', subComponent: 'Reading', rubrics: 'Evidence of review', frequency: 'TERMLY', ratingScale: 5, duration: '15 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-011', component: 'Lesson Plan', grades: 'All', subComponent: 'Planning', rubrics: 'Alignment to syllabus', frequency: 'WEEKLY', ratingScale: 5, duration: '20 min', stream: 'QUALITY', active: 'Yes' },
    { id: 'AC-012', component: 'Process compliance walkthrough', grades: 'N/A', subComponent: 'SOP', rubrics: 'SOP adherence', frequency: 'MONTHLY', ratingScale: 3, duration: '45 min', stream: 'PROCESS', active: 'Yes' },
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
