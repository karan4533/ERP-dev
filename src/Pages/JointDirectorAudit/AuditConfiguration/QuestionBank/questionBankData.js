import { AUDIT_TEMPLATES } from '../AuditTemplates/auditTemplatesData'
import { CHECKLIST_SECTIONS } from '../ChecklistSections/checklistSectionsData'

export const QUESTION_STATUS_OPTIONS = ['Active', 'Inactive']

export const MANDATORY_FILTER_OPTIONS = ['All', 'Mandatory', 'Optional']

export const questionStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
}

export const mandatoryBadgeColor = {
    Yes: 'bg-[#FF57221A] text-[#FF5722]',
    No: 'bg-[#515DEF1A] text-[#515DEF]',
}

export const DEFAULT_QUESTION_FORM = {
    sectionId: '',
    question: '',
    description: '',
    responseType: '',
    mandatory: false,
    weightage: '1',
    order: '1',
    active: true,
}

export const getDepartmentByTemplateId = (templateId) => (
    AUDIT_TEMPLATES.find((template) => template.id === templateId)?.department ?? ''
)

export const SECTION_OPTIONS = CHECKLIST_SECTIONS
    .filter((section) => section.active)
    .map((section) => ({
        id: section.id,
        label: `${section.sectionName} — ${section.templateName}`,
        sectionName: section.sectionName,
        templateName: section.templateName,
        templateId: section.templateId,
        department: getDepartmentByTemplateId(section.templateId),
    }))

export const DEPARTMENT_OPTIONS = [...new Set(SECTION_OPTIONS.map((section) => section.department))].sort()

export const getSectionMeta = (sectionId) => (
    SECTION_OPTIONS.find((section) => section.id === sectionId) ?? null
)

export const getQuestionStatus = (active) => (active ? 'Active' : 'Inactive')

export const QUESTION_BANK = [
    {
        id: 'QN-2026-001',
        sectionId: 'SEC-2026-001',
        sectionName: 'Classroom',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Are classrooms clean and well-maintained?',
        description: 'Check seating, boards, lighting, and overall classroom hygiene.',
        responseType: 'Yes / No',
        mandatory: true,
        weightage: 5,
        order: 1,
        active: true,
    },
    {
        id: 'QN-2026-002',
        sectionId: 'SEC-2026-001',
        sectionName: 'Classroom',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Rate the quality of teaching aids available in the classroom.',
        description: 'Evaluate charts, models, digital boards, and reference material.',
        responseType: 'Star Rating',
        mandatory: true,
        weightage: 8,
        order: 2,
        active: true,
    },
    {
        id: 'QN-2026-003',
        sectionId: 'SEC-2026-002',
        sectionName: 'Laboratory',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Are all lab safety instructions displayed prominently?',
        description: 'Verify visibility of safety signage and emergency instructions.',
        responseType: 'Yes / No / NA',
        mandatory: true,
        weightage: 6,
        order: 1,
        active: true,
    },
    {
        id: 'QN-2026-004',
        sectionId: 'SEC-2026-002',
        sectionName: 'Laboratory',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'How many non-functional lab equipment items were observed?',
        description: 'Count equipment that is broken, uncalibrated, or unavailable for practicals.',
        responseType: 'Number',
        mandatory: false,
        weightage: 4,
        order: 2,
        active: true,
    },
    {
        id: 'QN-2026-005',
        sectionId: 'SEC-2026-003',
        sectionName: 'Library',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Provide remarks on library cataloguing accuracy.',
        description: 'Note mismatches between physical stock and digital records.',
        responseType: 'Textarea',
        mandatory: false,
        weightage: 3,
        order: 1,
        active: true,
    },
    {
        id: 'QN-2026-006',
        sectionId: 'SEC-2026-004',
        sectionName: 'Safety',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Select the type of fire safety equipment available.',
        description: 'Choose all applicable safety equipment present on campus.',
        responseType: 'Dropdown',
        mandatory: true,
        weightage: 7,
        order: 1,
        active: true,
    },
    {
        id: 'QN-2026-007',
        sectionId: 'SEC-2026-004',
        sectionName: 'Safety',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Which emergency preparedness checks were completed?',
        description: 'Mark all completed emergency drills and readiness checks.',
        responseType: 'Checkbox',
        mandatory: true,
        weightage: 6,
        order: 2,
        active: true,
    },
    {
        id: 'QN-2026-008',
        sectionId: 'SEC-2026-005',
        sectionName: 'Attendance',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Date of last attendance audit review.',
        description: 'Record the most recent attendance verification date.',
        responseType: 'Date',
        mandatory: false,
        weightage: 2,
        order: 1,
        active: true,
    },
    {
        id: 'QN-2026-009',
        sectionId: 'SEC-2026-006',
        sectionName: 'Documentation',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Time when lesson plan register was last updated.',
        description: 'Capture the timestamp of the latest lesson plan update.',
        responseType: 'Time',
        mandatory: false,
        weightage: 2,
        order: 1,
        active: true,
    },
    {
        id: 'QN-2026-010',
        sectionId: 'SEC-2026-007',
        sectionName: 'Billing & Invoicing',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        question: 'Upload the latest fee reconciliation report.',
        description: 'Attach the monthly billing reconciliation document.',
        responseType: 'File Upload',
        mandatory: true,
        weightage: 10,
        order: 1,
        active: true,
    },
    {
        id: 'QN-2026-011',
        sectionId: 'SEC-2026-007',
        sectionName: 'Billing & Invoicing',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        question: 'Upload photo evidence of receipt counter setup.',
        description: 'Provide image proof of receipt books, stamps, and counter arrangement.',
        responseType: 'Image Upload',
        mandatory: false,
        weightage: 4,
        order: 2,
        active: true,
    },
    {
        id: 'QN-2026-012',
        sectionId: 'SEC-2026-008',
        sectionName: 'Payment Approvals',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        question: 'Upload walkthrough video of payment approval workflow.',
        description: 'Short video demonstrating approval steps in the finance system.',
        responseType: 'Video Upload',
        mandatory: false,
        weightage: 5,
        order: 1,
        active: true,
    },
    {
        id: 'QN-2026-013',
        sectionId: 'SEC-2026-008',
        sectionName: 'Payment Approvals',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        question: 'Capture authorized signatory confirmation.',
        description: 'Obtain digital signature from the approving finance officer.',
        responseType: 'Signature',
        mandatory: true,
        weightage: 9,
        order: 2,
        active: true,
    },
    {
        id: 'QN-2026-014',
        sectionId: 'SEC-2026-008',
        sectionName: 'Payment Approvals',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        question: 'Enter the payment approval reference number.',
        description: 'Provide the unique reference used in the approval trail.',
        responseType: 'Text',
        mandatory: true,
        weightage: 6,
        order: 3,
        active: false,
    },
    {
        id: 'QN-2026-015',
        sectionId: 'SEC-2026-001',
        sectionName: 'Classroom',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        question: 'Is the student seating capacity within approved limits?',
        description: 'Verify that classroom occupancy does not exceed sanctioned capacity.',
        responseType: 'Yes / No',
        mandatory: false,
        weightage: 3,
        order: 3,
        active: true,
    },
]

export const createQuestionId = (questions) => {
    const max = questions.reduce((current, question) => {
        const match = question.id.match(/QN-2026-(\d+)/)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `QN-2026-${String(max + 1).padStart(3, '0')}`
}
