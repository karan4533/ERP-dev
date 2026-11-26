import { AUDIT_TEMPLATES } from '../AuditTemplates/auditTemplatesData'

export const TEMPLATE_OPTIONS = AUDIT_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.templateName,
}))

export const SECTION_STATUS_OPTIONS = ['Active', 'Inactive']

export const sectionStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
}

export const DEFAULT_SECTION_FORM = {
    templateId: '',
    sectionName: '',
    description: '',
    displayOrder: '1',
    active: true,
}

export const CHECKLIST_SECTIONS = [
    {
        id: 'SEC-2026-001',
        templateId: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        sectionName: 'Classroom',
        description: 'Classroom environment, teaching aids, seating arrangement, and learning material availability.',
        displayOrder: 1,
        questions: 8,
        active: true,
    },
    {
        id: 'SEC-2026-002',
        templateId: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        sectionName: 'Laboratory',
        description: 'Lab equipment safety, experiment documentation, and practical session readiness.',
        displayOrder: 2,
        questions: 7,
        active: true,
    },
    {
        id: 'SEC-2026-003',
        templateId: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        sectionName: 'Library',
        description: 'Library resources, borrowing records, and student access compliance.',
        displayOrder: 3,
        questions: 5,
        active: true,
    },
    {
        id: 'SEC-2026-004',
        templateId: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        sectionName: 'Safety',
        description: 'Emergency exits, fire safety equipment, and hazard reporting procedures.',
        displayOrder: 4,
        questions: 6,
        active: true,
    },
    {
        id: 'SEC-2026-005',
        templateId: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        sectionName: 'Attendance',
        description: 'Student attendance tracking, absentee follow-up, and record accuracy.',
        displayOrder: 5,
        questions: 4,
        active: true,
    },
    {
        id: 'SEC-2026-006',
        templateId: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        sectionName: 'Documentation',
        description: 'Lesson plans, assessment records, and academic report maintenance.',
        displayOrder: 6,
        questions: 10,
        active: true,
    },
    {
        id: 'SEC-2026-007',
        templateId: 'TPL-2026-001',
        templateName: 'Finance Process Compliance',
        sectionName: 'Billing & Invoicing',
        description: 'Fee billing accuracy, invoice generation, and receipt reconciliation.',
        displayOrder: 1,
        questions: 9,
        active: true,
    },
    {
        id: 'SEC-2026-008',
        templateId: 'TPL-2026-001',
        templateName: 'Finance Process Compliance',
        sectionName: 'Payment Approvals',
        description: 'Vendor payment workflows, approval limits, and authorization trails.',
        displayOrder: 2,
        questions: 11,
        active: true,
    },
    {
        id: 'SEC-2026-009',
        templateId: 'TPL-2026-003',
        templateName: 'Transport Safety Inspection',
        sectionName: 'Vehicle Inspection',
        description: 'Daily vehicle checks, maintenance logs, and fitness certificates.',
        displayOrder: 1,
        questions: 12,
        active: false,
    },
]

export const createSectionId = (sections) => {
    const max = sections.reduce((current, section) => {
        const match = section.id.match(/SEC-2026-(\d+)/)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `SEC-2026-${String(max + 1).padStart(3, '0')}`
}

export const getSectionStatus = (active) => (active ? 'Active' : 'Inactive')

export const getTemplateName = (templateId) => (
    TEMPLATE_OPTIONS.find((template) => template.id === templateId)?.name ?? ''
)
