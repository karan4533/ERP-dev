export const TEMPLATE_DEPARTMENTS = [
    'Operations',
    'HR',
    'Academic',
    'Finance',
    'Transport',
    'IT Support',
    'Canteen',
    'Housekeeping',
    'Stationery Store',
]

export const TEMPLATE_AUDIT_CATEGORIES = [
    'Process Audit',
    'Quality Audit',
    'HR Audit',
    'Compliance Audit',
    'Financial Audit',
    'Safety Audit',
]

export const TEMPLATE_STATUS_OPTIONS = ['Draft', 'Published', 'Archived']

export const TEMPLATE_VERSION_OPTIONS = ['All Versions', 'v1.0', 'v1.1', 'v2.0', 'v2.1', 'v3.0']

export const templateStatusBadgeColor = {
    Draft: 'bg-[#FF98001A] text-[#FF9800]',
    Published: 'bg-[#4CAF501A] text-[#4CAF50]',
    Archived: 'bg-[#6670851A] text-[#667085]',
}

export const DEFAULT_TEMPLATE_FORM = {
    templateName: '',
    department: '',
    auditCategory: '',
    description: '',
    version: 'v1.0',
    status: 'Draft',
}

export const AUDIT_TEMPLATES = [
    {
        id: 'TPL-2026-001',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        auditCategory: 'Process Audit',
        description: 'Standard checklist for finance process compliance reviews across billing, payments, and reconciliation.',
        version: 'v2.1',
        sections: 8,
        questions: 45,
        status: 'Published',
        createdBy: 'R. Mehta',
        updatedOn: '08-07-2026',
    },
    {
        id: 'TPL-2026-002',
        templateName: 'HR Onboarding & Attendance',
        department: 'HR',
        auditCategory: 'HR Audit',
        description: 'Covers staff onboarding documentation, attendance tracking, and leave policy adherence.',
        version: 'v1.2',
        sections: 6,
        questions: 32,
        status: 'Published',
        createdBy: 'A. Khan',
        updatedOn: '05-07-2026',
    },
    {
        id: 'TPL-2026-003',
        templateName: 'Transport Safety Inspection',
        department: 'Transport',
        auditCategory: 'Safety Audit',
        description: 'Vehicle safety checks, driver compliance, route documentation, and emergency preparedness.',
        version: 'v3.0',
        sections: 10,
        questions: 58,
        status: 'Draft',
        createdBy: 'S. Priya',
        updatedOn: '09-07-2026',
    },
    {
        id: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        auditCategory: 'Quality Audit',
        description: 'Classroom quality standards, curriculum delivery, and academic record maintenance.',
        version: 'v2.0',
        sections: 7,
        questions: 40,
        status: 'Published',
        createdBy: 'V. Lakshmi',
        updatedOn: '01-07-2026',
    },
    {
        id: 'TPL-2026-005',
        templateName: 'Canteen Hygiene & Operations',
        department: 'Canteen',
        auditCategory: 'Compliance Audit',
        description: 'Food safety, kitchen hygiene, vendor compliance, and daily operations checklist.',
        version: 'v1.0',
        sections: 5,
        questions: 28,
        status: 'Archived',
        createdBy: 'D. Joseph',
        updatedOn: '20-06-2026',
    },
    {
        id: 'TPL-2026-006',
        templateName: 'IT Infrastructure Audit',
        department: 'IT Support',
        auditCategory: 'Process Audit',
        description: 'Server health, backup policies, access controls, and incident response procedures.',
        version: 'v1.1',
        sections: 9,
        questions: 52,
        status: 'Draft',
        createdBy: 'R. Mehta',
        updatedOn: '10-07-2026',
    },
]

export const createTemplateId = (templates) => {
    const max = templates.reduce((current, template) => {
        const match = template.id.match(/TPL-2026-(\d+)/)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `TPL-2026-${String(max + 1).padStart(3, '0')}`
}

export const formatToday = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}-${month}-${year}`
}
