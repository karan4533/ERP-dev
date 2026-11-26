import { AUDIT_TEMPLATES } from '../AuditTemplates/auditTemplatesData'

export const VERSION_STATUS_OPTIONS = ['Published', 'Draft', 'Archived', 'Superseded', 'Restored']

export const versionStatusBadgeColor = {
    Published: 'bg-[#4CAF501A] text-[#4CAF50]',
    Draft: 'bg-[#FF98001A] text-[#FF9800]',
    Archived: 'bg-[#6670851A] text-[#667085]',
    Superseded: 'bg-[#515DEF1A] text-[#515DEF]',
    Restored: 'bg-[#00BCD41A] text-[#00BCD4]',
}

export const TEMPLATE_FILTER_OPTIONS = AUDIT_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.templateName,
}))

export const TEMPLATE_VERSIONS = [
    {
        id: 'TV-001',
        version: 'v2.1',
        templateId: 'TPL-2026-001',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        sections: 8,
        questions: 45,
        createdBy: 'R. Mehta',
        publishedDate: '08-07-2026',
        status: 'Published',
        isCurrent: true,
        changeSummary: 'Added vendor payment approval checks and updated reconciliation section.',
    },
    {
        id: 'TV-002',
        version: 'v2.0',
        templateId: 'TPL-2026-001',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        sections: 7,
        questions: 40,
        createdBy: 'R. Mehta',
        publishedDate: '15-05-2026',
        status: 'Superseded',
        isCurrent: false,
        changeSummary: 'Revised billing workflow and petty cash controls.',
    },
    {
        id: 'TV-003',
        version: 'v1.2',
        templateId: 'TPL-2026-001',
        templateName: 'Finance Process Compliance',
        department: 'Finance',
        sections: 6,
        questions: 34,
        createdBy: 'A. Khan',
        publishedDate: '20-02-2026',
        status: 'Archived',
        isCurrent: false,
        changeSummary: 'Initial finance compliance template release.',
    },
    {
        id: 'TV-004',
        version: 'v2.0',
        templateId: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        sections: 7,
        questions: 40,
        createdBy: 'V. Lakshmi',
        publishedDate: '01-07-2026',
        status: 'Published',
        isCurrent: true,
        changeSummary: 'Added safety and documentation sections for academic audits.',
    },
    {
        id: 'TV-005',
        version: 'v1.1',
        templateId: 'TPL-2026-004',
        templateName: 'Academic Quality Review',
        department: 'Academic',
        sections: 5,
        questions: 28,
        createdBy: 'V. Lakshmi',
        publishedDate: '10-03-2026',
        status: 'Superseded',
        isCurrent: false,
        changeSummary: 'Expanded classroom and laboratory checklist coverage.',
    },
    {
        id: 'TV-006',
        version: 'v1.2',
        templateId: 'TPL-2026-002',
        templateName: 'HR Onboarding & Attendance',
        department: 'HR',
        sections: 6,
        questions: 32,
        createdBy: 'A. Khan',
        publishedDate: '05-07-2026',
        status: 'Published',
        isCurrent: true,
        changeSummary: 'Updated leave policy adherence and onboarding documentation checks.',
    },
    {
        id: 'TV-007',
        version: 'v3.0',
        templateId: 'TPL-2026-003',
        templateName: 'Transport Safety Inspection',
        department: 'Transport',
        sections: 10,
        questions: 58,
        createdBy: 'S. Priya',
        publishedDate: '',
        status: 'Draft',
        isCurrent: false,
        changeSummary: 'Draft version with emergency preparedness and driver compliance updates.',
    },
    {
        id: 'TV-008',
        version: 'v2.1',
        templateId: 'TPL-2026-003',
        templateName: 'Transport Safety Inspection',
        department: 'Transport',
        sections: 9,
        questions: 52,
        createdBy: 'S. Priya',
        publishedDate: '18-04-2026',
        status: 'Published',
        isCurrent: true,
        changeSummary: 'Current published transport safety checklist.',
    },
]

export const formatPublishedDate = (date) => date || '—'

export const getVersionsForTemplate = (templateId, versions = TEMPLATE_VERSIONS) => (
    versions.filter((item) => item.templateId === templateId)
)

export const getCurrentVersion = (templateId, versions = TEMPLATE_VERSIONS) => (
    versions.find((item) => item.templateId === templateId && item.isCurrent)
)
