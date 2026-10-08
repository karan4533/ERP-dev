import { AUDIT_TEMPLATES } from '../AuditTemplates/auditTemplatesData'

export const PUBLISH_STATUS_OPTIONS = ['Draft', 'Published', 'Archived']

export const publishStatusBadgeColor = {
    Draft: 'bg-[#FF98001A] text-[#FF9800]',
    Published: 'bg-[#4CAF501A] text-[#4CAF50]',
    Archived: 'bg-[#6670851A] text-[#667085]',
}

export const PUBLISH_TEMPLATES = AUDIT_TEMPLATES.map((template) => ({
    id: template.id,
    templateName: template.templateName,
    department: template.department,
    currentVersion: template.version,
    previousVersion: template.status === 'Draft' ? null : getPreviousVersion(template.version),
    status: template.status,
    lastPublished: template.status === 'Published' ? template.updatedOn : template.status === 'Archived' ? '20-06-2026' : '—',
}))

function getPreviousVersion(version) {
    const match = version.match(/v(\d+)\.(\d+)/)
    if (!match) return null
    const minor = Number(match[2])
    if (minor > 0) return `v${match[1]}.${minor - 1}`
    return null
}

export const formatToday = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}-${month}-${year}`
}

export const bumpVersion = (version) => {
    const match = version.match(/v(\d+)\.(\d+)/)
    if (!match) return 'v1.0'
    return `v${match[1]}.${Number(match[2]) + 1}`
}
