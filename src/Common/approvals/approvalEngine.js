/**
 * Enterprise Multi-Tier Approval Engine
 * Standardizes workflow progression, tier checks, role validation, and immutable decision histories.
 */

import { ROLES } from '../../constants/roles.js'
import { appendApprovalDecision } from './approvalHistory.js'
import { recordAuditLog } from '../AuditAndNotifications/centralAuditEngine.js'

export const normalizeRoleKey = (role) => String(role || '').toLowerCase().replace(/[-_\s]/g, '')

export const WORKFLOW_TYPES = {
    EXTRA_CURRICULAR_ACTIVITY: 'EXTRA_CURRICULAR_ACTIVITY',
    EMPLOYEE_DAILY_ACTIVITY: 'EMPLOYEE_DAILY_ACTIVITY', // DSR
    LESSON_PLAN: 'LESSON_PLAN',
    MARK_ENTRY: 'MARK_ENTRY',
    TIMETABLE_CHANGE: 'TIMETABLE_CHANGE',
    MATERIAL_REQUISITION: 'MATERIAL_REQUISITION',
    PURCHASE_ORDER: 'PURCHASE_ORDER',
    STAFF_LEAVE: 'STAFF_LEAVE',
    STAFF_PERMISSION: 'STAFF_PERMISSION',
    TC_REQUEST: 'TC_REQUEST',
    AUDIT_RCA_ATR: 'AUDIT_RCA_ATR',
    CCTV_FOOTAGE: 'CCTV_FOOTAGE',
    CONFIDENTIAL_FILE: 'CONFIDENTIAL_FILE'
}

export const WORKFLOW_DEFINITIONS = {
    [WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY]: {
        name: 'Extracurricular & Event Activity Approval',
        initialStatus: 'Submitted',
        tiers: [
            {
                tierNumber: 1,
                name: 'Front Office / PRM Verification',
                requiredRole: [ROLES.PRM, ROLES.ADMIN, ROLES.SUPER_ADMIN],
                pendingStatus: 'Submitted',
                approvedStatus: 'PRM Verified',
                rejectedStatus: 'Rejected'
            },
            {
                tierNumber: 2,
                name: 'Principal Academic Endorsement',
                requiredRole: [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN],
                pendingStatus: 'PRM Verified',
                approvedStatus: 'Principal Approved',
                rejectedStatus: 'Rejected'
            },
            {
                tierNumber: 3,
                name: 'Director of Academics Final Sanction',
                requiredRole: [ROLES.DIRECTOR, ROLES.SUPER_ADMIN],
                pendingStatus: 'Principal Approved',
                approvedStatus: 'Approved',
                rejectedStatus: 'Rejected'
            }
        ]
    },

    [WORKFLOW_TYPES.EMPLOYEE_DAILY_ACTIVITY]: {
        name: 'Employee Daily Activity / DSR Review',
        initialStatus: 'Submitted',
        tiers: [
            {
                tierNumber: 1,
                name: 'Department Head / Manager Review & Sign-Off',
                requiredRole: [
                    ROLES.PRINCIPAL,
                    ROLES.COORDINATOR,
                    ROLES.DIRECTOR,
                    ROLES.HR,
                    ROLES.ACCOUNT_HEAD,
                    ROLES.TRANSPORT_MANAGER,
                    ROLES.STATIONERY_STORE_MANAGER,
                    ROLES.HOUSEKEEPING_MANAGER,
                    ROLES.IT_SUPPORT_MANAGER,
                    ROLES.GATEKEEPER_MANAGER,
                    ROLES.ADMIN,
                    ROLES.SUPER_ADMIN
                ],
                pendingStatus: 'Submitted',
                approvedStatus: 'Approved',
                rejectedStatus: 'Needs Revision'
            }
        ]
    },

    [WORKFLOW_TYPES.LESSON_PLAN]: {
        name: 'Lesson Plan Multi-Tier Approval',
        initialStatus: 'Pending',
        tiers: [
            {
                tierNumber: 1,
                name: 'Academic Coordinator Review',
                requiredRole: [ROLES.COORDINATOR, ROLES.SUPER_ADMIN],
                pendingStatus: 'Pending',
                approvedStatus: 'Coordinator Reviewed',
                rejectedStatus: 'Rejected'
            },
            {
                tierNumber: 2,
                name: 'Principal Sanction',
                requiredRole: [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN],
                pendingStatus: 'Coordinator Reviewed',
                approvedStatus: 'Principal Approved',
                rejectedStatus: 'Rejected'
            },
            {
                tierNumber: 3,
                name: 'Director of Academics Final Lock',
                requiredRole: [ROLES.DIRECTOR, ROLES.SUPER_ADMIN],
                pendingStatus: 'Principal Approved',
                approvedStatus: 'Approved',
                rejectedStatus: 'Rejected'
            }
        ]
    },

    [WORKFLOW_TYPES.MARK_ENTRY]: {
        name: 'Examination Marks Publishing Approval',
        initialStatus: 'Pending',
        tiers: [
            {
                tierNumber: 1,
                name: 'Coordinator Mark Moderation',
                requiredRole: [ROLES.COORDINATOR, ROLES.SUPER_ADMIN],
                pendingStatus: 'Pending',
                approvedStatus: 'Coordinator Reviewed',
                rejectedStatus: 'Rejected'
            },
            {
                tierNumber: 2,
                name: 'Principal Assessment Sanction',
                requiredRole: [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN],
                pendingStatus: 'Coordinator Reviewed',
                approvedStatus: 'Principal Approved',
                rejectedStatus: 'Rejected'
            },
            {
                tierNumber: 3,
                name: 'Director Marks Publishing',
                requiredRole: [ROLES.DIRECTOR, ROLES.SUPER_ADMIN],
                pendingStatus: 'Principal Approved',
                approvedStatus: 'Approved',
                rejectedStatus: 'Rejected'
            }
        ]
    },

    [WORKFLOW_TYPES.TIMETABLE_CHANGE]: {
        name: 'Timetable Adjustment Approval',
        initialStatus: 'Pending',
        tiers: [
            {
                tierNumber: 1,
                name: 'Principal Timetable Sanction',
                requiredRole: [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN],
                pendingStatus: 'Pending',
                approvedStatus: 'Approved',
                rejectedStatus: 'Rejected'
            }
        ]
    },

    [WORKFLOW_TYPES.AUDIT_RCA_ATR]: {
        name: 'Audit RCA & Action Taken Report Acceptance',
        initialStatus: 'Submitted for ATR Review',
        tiers: [
            {
                tierNumber: 1,
                name: 'Lead Auditor Evaluation',
                requiredRole: [ROLES.QUALITY_AUDITOR, ROLES.PROCESS_AUDITOR, ROLES.JOINT_DIRECTOR_AUDIT, ROLES.SUPER_ADMIN],
                pendingStatus: 'Submitted for ATR Review',
                approvedStatus: 'Accepted',
                rejectedStatus: 'Declined'
            }
        ]
    }
}

/**
 * Checks whether a given user role is authorized for the current workflow tier.
 */
export const canUserActOnTier = (workflowType, currentStatus, userRole) => {
    const def = WORKFLOW_DEFINITIONS[workflowType]
    if (!def) return false

    const normRole = normalizeRoleKey(userRole)
    if (normRole === normalizeRoleKey(ROLES.SUPER_ADMIN)) return true

    const activeTier = def.tiers.find((t) => t.pendingStatus === currentStatus)
    if (!activeTier) return false

    return activeTier.requiredRole.some((r) => normalizeRoleKey(r) === normRole)
}

/**
 * Returns current tier metadata for a workflow entity.
 */
export const getCurrentTierInfo = (workflowType, currentStatus) => {
    const def = WORKFLOW_DEFINITIONS[workflowType]
    if (!def) return null
    return def.tiers.find((t) => {
        if (t.pendingStatus === currentStatus) return true
        if (Array.isArray(t.pendingStatus) && t.pendingStatus.includes(currentStatus)) return true
        if (t.tierNumber === 1 && (currentStatus === 'Submitted' || currentStatus === 'Pending' || currentStatus === def.initialStatus)) {
            return true
        }
        return false
    }) || null
}

/**
 * Applies an approval or rejection decision to an entity, generating an immutable audit trail.
 */
export const applyWorkflowDecision = ({
    workflowType,
    entity,
    decision, // 'Approved' | 'Rejected' | 'Needs Revision' | 'Accepted' | 'Declined'
    actor,
    actorRole,
    remarks = '',
    evidence = null
}) => {
    const def = WORKFLOW_DEFINITIONS[workflowType]
    if (!def) throw new Error(`Unknown workflow type: ${workflowType}`)

    const activeTier = getCurrentTierInfo(workflowType, entity.approvalStatus || entity.status)
    if (!activeTier) {
        throw new Error(`No active approval tier found for status '${entity.status || entity.approvalStatus}' in ${def.name}`)
    }

    const isApproval = decision === 'Approved' || decision === 'Accepted'
    const newStatus = isApproval ? activeTier.approvedStatus : activeTier.rejectedStatus

    const decisionRecord = {
        id: `DEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tierNumber: activeTier.tierNumber,
        tierName: activeTier.name,
        status: isApproval ? 'Approved' : 'Rejected',
        decisionLabel: decision,
        actor: String(actor || 'Authorized Officer').trim(),
        actorRole: String(actorRole || '').trim(),
        remarks: String(remarks || (isApproval ? 'Approved with full clearance.' : 'Declined.')).trim(),
        evidence: evidence || null,
        decidedAt: new Date().toISOString()
    }

    const updatedHistory = appendApprovalDecision(entity.approvalHistory || [], decisionRecord)

    // Audit Log Record
    recordAuditLog({
        actorName: decisionRecord.actor,
        actorRole: decisionRecord.actorRole,
        module: def.name,
        action: `DECISION_${decision.toUpperCase().replace(/\s+/g, '_')}`,
        entityId: entity.id,
        previousState: entity.status || entity.approvalStatus,
        newState: newStatus,
        remarks: `[Tier ${activeTier.tierNumber}: ${activeTier.name}] ${decisionRecord.remarks}`
    })

    return {
        ...entity,
        status: newStatus,
        approvalStatus: newStatus,
        currentTier: isApproval && activeTier.approvedStatus !== 'Approved' ? activeTier.tierNumber + 1 : activeTier.tierNumber,
        approvalHistory: updatedHistory,
        lastUpdated: new Date().toISOString()
    }
}
