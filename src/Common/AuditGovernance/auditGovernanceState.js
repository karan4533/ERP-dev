const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== ''

export const hasAuditEvidence = (evidence = {}) => (
    ['photo', 'file', 'video', 'url'].some((field) => hasValue(evidence[field]))
)

export const isAuditResponseAnswered = (response) => hasValue(response)

export const isAuditResponseNonCompliant = (response) => {
    if (response === 'No' || response === 'Error') return true
    const rating = Number(response)
    return Number.isInteger(rating) && rating >= 1 && rating <= 2
}

const gap = (code, message, context = {}) => ({ code, message, ...context })

export const getAuditSubmissionGaps = ({ header = {}, sections = [], responses = {}, observations = [] } = {}) => {
    const gaps = []

    if (!header.templateName?.trim()) {
        gaps.push(gap('template-name', 'The audit template name is missing.'))
    }
    if (!String(header.templateVersion ?? '').trim()) {
        gaps.push(gap('template-version', 'The audit template version is missing.'))
    }

    sections.forEach((section) => {
        section.parameters?.forEach((parameter) => {
            const responseRecord = responses[parameter.id] ?? {}
            const response = responseRecord.response
            const context = {
                sectionId: section.id,
                sectionTitle: section.title,
                parameterId: parameter.id,
                parameterLabel: parameter.label,
            }

            if (!isAuditResponseAnswered(response)) {
                gaps.push(gap('unanswered', `Answer “${parameter.label}”.`, context))
                return
            }
            if (!isAuditResponseNonCompliant(response)) return

            const observation = observations.find((item) => item.parameterId === parameter.id)
            if (!responseRecord.comments?.trim()) {
                gaps.push(gap('finding-comment', `Add a finding comment for “${parameter.label}”.`, context))
            }
            if (!hasAuditEvidence(responseRecord.evidence)) {
                gaps.push(gap('finding-evidence', `Attach evidence for “${parameter.label}”.`, context))
            }
            if (!observation?.title?.trim()) {
                gaps.push(gap('finding-title', `Add a finding title for “${parameter.label}”.`, context))
            }
            if (!observation?.description?.trim()) {
                gaps.push(gap('finding-description', `Describe the finding for “${parameter.label}”.`, context))
            }
            if (!observation?.assignTo) {
                gaps.push(gap('finding-owner', `Assign an owner for “${parameter.label}”.`, context))
            }
            if (!observation?.dueDate) {
                gaps.push(gap('finding-due-date', `Set a due date for “${parameter.label}”.`, context))
            }
            if (!observation?.submitted) {
                gaps.push(gap('finding-not-submitted', `Submit the finding for “${parameter.label}”.`, context))
            }
        })
    })

    return gaps
}

export const summarizeAuditSubmissionGaps = (gaps = []) => ({
    total: gaps.length,
    unanswered: gaps.filter((item) => item.code === 'unanswered').length,
    evidence: gaps.filter((item) => item.code === 'finding-evidence' || item.code === 'finding-comment').length,
    findings: gaps.filter((item) => item.code.startsWith('finding-') && !['finding-evidence', 'finding-comment'].includes(item.code)).length,
    configuration: gaps.filter((item) => item.code.startsWith('template-')).length,
})

export const getAuditSubmissionReadiness = (audit) => (
    getAuditSubmissionGaps(audit).length ? 'Blocked' : 'Ready'
)

const AUDIT_TRANSITIONS = {
    auditor: {
        Pending: ['In Progress'],
        'In Progress': ['Submitted'],
    },
    reviewer: {
        Submitted: ['Verified'],
        Verified: ['Closed'],
    },
}

export const canAuditActorTransition = ({ from, to, actor } = {}) => (
    AUDIT_TRANSITIONS[String(actor ?? '').toLowerCase()]?.[from]?.includes(to) ?? false
)

const normalizeSearchValue = (value) => String(value ?? '').trim().toLowerCase()

export const filterGovernanceFindings = (findings = [], filters = {}) => {
    const query = normalizeSearchValue(filters.query)
    const exactFilters = ['department', 'severity', 'rcaStatus', 'capaStatus', 'verificationStatus', 'closureStatus']

    return findings.filter((finding) => {
        if (query) {
            const searchable = [finding.id, finding.auditId, finding.title, finding.department, finding.owner, finding.responsiblePerson]
                .map(normalizeSearchValue)
                .join(' ')
            if (!searchable.includes(query)) return false
        }

        return exactFilters.every((key) => !filters[key] || finding[key] === filters[key])
    })
}

export const getFindingLifecycle = (finding = {}) => [
    { stage: 'Finding', status: finding.findingStatus ?? 'Recorded' },
    { stage: 'RCA', status: finding.rcaStatus ?? 'Not recorded' },
    { stage: 'CAPA', status: finding.capaStatus ?? 'Not recorded' },
    { stage: 'Verification', status: finding.verificationStatus ?? 'Not recorded' },
    { stage: 'Closure', status: finding.closureStatus ?? 'Open' },
]

const parseAuditDate = (value) => {
    if (!value) return null
    const source = String(value)
    const isoMatch = source.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) return new Date(`${source}T00:00:00`)
    const displayMatch = source.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (!displayMatch) return null
    return new Date(`${displayMatch[3]}-${displayMatch[2]}-${displayMatch[1]}T00:00:00`)
}

export const getExecutiveFindingSummary = (findings = [], referenceDate = new Date()) => {
    const closed = findings.filter((finding) => finding.closureStatus === 'Closed').length
    const today = new Date(referenceDate)
    today.setHours(0, 0, 0, 0)

    return {
        total: findings.length,
        criticalOpen: findings.filter((finding) => finding.severity === 'Critical' && finding.closureStatus !== 'Closed').length,
        overdue: findings.filter((finding) => {
            const dueDate = parseAuditDate(finding.dueDate)
            return finding.closureStatus !== 'Closed' && dueDate && dueDate < today
        }).length,
        rcaPending: findings.filter((finding) => ['Pending', 'Not started', 'Not recorded'].includes(finding.rcaStatus)).length,
        verificationPending: findings.filter((finding) => finding.closureStatus !== 'Closed' && finding.verificationStatus !== 'Verified').length,
        closed,
        closureRate: findings.length ? Math.round((closed / findings.length) * 100) : 0,
    }
}
