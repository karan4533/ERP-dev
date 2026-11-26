import { getObservations as getProcessObservations, saveObservations as saveProcessObservations, buildTimeline } from '../../Pages/ProcessAuditor/Observations/observationsData'
import { getObservations as getQualityObservations, saveObservations as saveQualityObservations } from '../../Pages/QualityAuditor/Observations/observationsData'

export const AUDIT_STREAMS = ['All', 'Process Audit', 'Quality Audit']

export const DEPARTMENT_OPTIONS = [
    'All',
    'Academic',
    'Administration',
    'Canteen',
    'Finance',
    'Housekeeping',
    'HR',
    'IT Support',
    'Stores & Procurement',
    'Transport',
    'Security',
]

/**
 * Resolves the primary department corresponding to an authenticated ERP role.
 */
export const getDepartmentForRole = (role) => {
    if (!role) return 'Academic'
    const r = String(role).toLowerCase().replace(/[-_\s]/g, '')
    if (r.includes('canteen')) return 'Canteen'
    if (r.includes('transport') || r.includes('driver')) return 'Transport'
    if (r.includes('itsupport') || r.includes('systemadmin')) return 'IT Support'
    if (r.includes('housekeeping')) return 'Housekeeping'
    if (r.includes('maintenance')) return 'Maintenance'
    if (r.includes('store') || r.includes('stationery')) return 'Stores & Procurement'
    if (r.includes('account') || r.includes('finance')) return 'Finance'
    if (r.includes('hr')) return 'HR'
    if (r.includes('gatekeeper') || r.includes('security')) return 'Security'
    if (r.includes('prm') || r.includes('frontoffice')) return 'Administration'
    if (r.includes('admin') || r.includes('superadmin')) return 'All'
    if (r.includes('director') || r.includes('principal') || r.includes('jointdirector')) return 'All'
    if (r.includes('auditor') || r.includes('audit')) return 'All'
    return 'Academic'
}

/**
 * Checks whether a role has executive or broad multi-department audit oversight.
 */
export const isExecutiveOrAuditorRole = (role) => {
    if (!role) return false
    const r = String(role).toLowerCase().replace(/[-_\s]/g, '')
    return [
        'superadmin',
        'admin',
        'director',
        'principal',
        'jointdirector',
        'jointdirectorassistant',
        'jointdirectoraudit',
        'processauditor',
        'qualityauditor',
    ].includes(r)
}

/**
 * Combines process and quality observations into a single normalized list.
 */
export const getAllAuditeeObservations = () => {
    const processList = (getProcessObservations() || []).map((item) => ({
        ...item,
        stream: 'Process Audit',
        sourceKey: 'process',
    }))

    const qualityList = (getQualityObservations() || []).map((item) => ({
        ...item,
        stream: 'Quality Audit',
        sourceKey: 'quality',
    }))

    // Deduplicate by observationId
    const seen = new Set()
    const combined = []
    for (const item of [...processList, ...qualityList]) {
        if (!seen.has(item.observationId)) {
            seen.add(item.observationId)
            combined.push(item)
        }
    }

    return combined
}

/**
 * Retrieves observations filtered for an auditee role and optional department/status/stream filters.
 */
export const getFilteredAuditeeObservations = ({
    role = null,
    department = 'All',
    status = 'All',
    stream = 'All',
    query = '',
} = {}) => {
    const userDept = getDepartmentForRole(role)
    const canSeeAll = isExecutiveOrAuditorRole(role)

    let list = getAllAuditeeObservations()

    // Department filter:
    // If not executive and department is 'All', default to user's assigned department
    const targetDept = department === 'All' && !canSeeAll ? userDept : department

    if (targetDept !== 'All') {
        const normTarget = targetDept.toLowerCase().replace(/[^a-z0-9]/g, '')
        list = list.filter((item) => {
            const itemDept = String(item.department || item.responsibleDepartment || '').toLowerCase().replace(/[^a-z0-9]/g, '')
            return itemDept.includes(normTarget) || normTarget.includes(itemDept)
        })
    }

    // Stream filter (Process vs Quality)
    if (stream && stream !== 'All') {
        list = list.filter((item) => item.stream === stream)
    }

    // Status filter
    if (status && status !== 'All') {
        list = list.filter((item) => item.status === status)
    }

    // Search query
    if (query && query.trim()) {
        const q = query.toLowerCase().trim()
        list = list.filter((item) =>
            [item.observationId, item.title, item.description, item.responsiblePerson, item.category, item.auditReference]
                .some((field) => String(field || '').toLowerCase().includes(q))
        )
    }

    return list
}

/**
 * Computes summary KPIs for received observations.
 */
export const getAuditeeObservationKpis = (role, department = 'All') => {
    const list = getFilteredAuditeeObservations({ role, department })

    const total = list.length
    const critical = list.filter((i) => i.priority === 'Critical' || i.severity === 'Critical').length
    const open = list.filter((i) => ['Open', 'Assigned'].includes(i.status)).length
    const inReview = list.filter((i) => i.status === 'In Review').length
    const resolved = list.filter((i) => ['Resolved', 'Closed'].includes(i.status)).length
    const rcaPending = list.filter((i) => !i.rcaSubmitted && i.status !== 'Closed').length
    const atrPending = list.filter((i) => !i.atrSubmitted && i.status !== 'Closed').length

    return {
        total,
        critical,
        open,
        inReview,
        resolved,
        rcaPending,
        atrPending,
    }
}

/**
 * Submits Root Cause Analysis (RCA) from the auditee department.
 */
export const submitAuditeeRca = (observationId, rcaData = {}, actorName = 'Department Head') => {
    const processList = getProcessObservations()
    const pIndex = processList.findIndex((item) => item.observationId === observationId)

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-')
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const rcaPayload = {
        rcaSubmitted: true,
        rcaSubmittedDate: dateStr,
        rcaSubmittedTime: timeStr,
        rcaSubmittedBy: actorName,
        rcaRootCause: rcaData.rootCause || '',
        rcaContributingFactors: rcaData.contributingFactors || '',
        rcaPreventiveAction: rcaData.preventiveAction || '',
        status: 'In Review',
    }

    if (pIndex !== -1) {
        processList[pIndex] = {
            ...processList[pIndex],
            ...rcaPayload,
            timeline: buildTimeline('In Review', processList[pIndex].createdDate, processList[pIndex].createdTime),
        }
        saveProcessObservations(processList)
        return processList[pIndex]
    }

    const qualityList = getQualityObservations()
    const qIndex = qualityList.findIndex((item) => item.observationId === observationId)
    if (qIndex !== -1) {
        qualityList[qIndex] = {
            ...qualityList[qIndex],
            ...rcaPayload,
            timeline: buildTimeline('In Review', qualityList[qIndex].createdDate, qualityList[qIndex].createdTime),
        }
        saveQualityObservations(qualityList)
        return qualityList[qIndex]
    }

    return null
}

/**
 * Submits Action Taken Report (ATR) / Corrective Action from the auditee department.
 */
export const submitAuditeeAtr = (observationId, atrData = {}, actorName = 'Department Head') => {
    const processList = getProcessObservations()
    const pIndex = processList.findIndex((item) => item.observationId === observationId)

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-')
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const atrPayload = {
        atrSubmitted: true,
        atrSubmittedDate: dateStr,
        atrSubmittedTime: timeStr,
        atrSubmittedBy: actorName,
        atrActionTaken: atrData.actionTaken || '',
        atrEvidence: atrData.evidence || '',
        atrTargetDate: atrData.targetDate || '',
        status: 'Resolved',
    }

    if (pIndex !== -1) {
        processList[pIndex] = {
            ...processList[pIndex],
            ...atrPayload,
            timeline: buildTimeline('Resolved', processList[pIndex].createdDate, processList[pIndex].createdTime),
        }
        saveProcessObservations(processList)
        return processList[pIndex]
    }

    const qualityList = getQualityObservations()
    const qIndex = qualityList.findIndex((item) => item.observationId === observationId)
    if (qIndex !== -1) {
        qualityList[qIndex] = {
            ...qualityList[qIndex],
            ...atrPayload,
            timeline: buildTimeline('Resolved', qualityList[qIndex].createdDate, qualityList[qIndex].createdTime),
        }
        saveQualityObservations(qualityList)
        return qualityList[qIndex]
    }

    return null
}

/**
 * Receives and verifies physical quantities raised from Audit.
 */
export const receiveAuditQuantities = (observationId, { quantityReceived, receivingNotes = '', verifiedBy = 'Auditee Department' } = {}) => {
    const processList = getProcessObservations()
    const pIndex = processList.findIndex((item) => item.observationId === observationId)

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-')
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const receivePayload = {
        quantityReceived: Number(quantityReceived) || 0,
        receivingStatus: 'Received',
        receivingDate: dateStr,
        receivingTime: timeStr,
        receivedBy: verifiedBy,
        receivingNotes,
    }

    if (pIndex !== -1) {
        processList[pIndex] = {
            ...processList[pIndex],
            ...receivePayload,
        }
        saveProcessObservations(processList)
        return processList[pIndex]
    }

    const qualityList = getQualityObservations()
    const qIndex = qualityList.findIndex((item) => item.observationId === observationId)
    if (qIndex !== -1) {
        qualityList[qIndex] = {
            ...qualityList[qIndex],
            ...receivePayload,
        }
        saveQualityObservations(qualityList)
        return qualityList[qIndex]
    }

    return null
}

