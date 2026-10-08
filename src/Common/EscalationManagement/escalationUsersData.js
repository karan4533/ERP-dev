import { ROLES } from '../../constants/roles'
import {
    buildUserDisplayName,
    getActiveCreatedUserSession,
    getCreatedUsersByRole,
} from '../RBAC/createdUsersData'
import {
    getActiveAdminSession,
    getAllAdminUsers,
} from '../../Pages/SuperAdmin/UserCreation/adminUsersData'
import { getRoleConfig } from './escalationRoleConfig'

export const ESCALATION_ROLE_TO_APP_ROLE = {
    gateKeeper: ROLES.GATEKEEPER,
    gateKeeperManager: ROLES.GATEKEEPER_MANAGER,
    prm: ROLES.PRM,
    student: ROLES.STUDENT,
    teacher: ROLES.TEACHER,
    coordinator: ROLES.COORDINATOR,
    librarian: ROLES.LIBRARIAN,
    principal: ROLES.PRINCIPAL,
    director: ROLES.DIRECTOR,
    admin: ROLES.ADMIN,
    superAdmin: ROLES.SUPER_ADMIN,
}

export const APP_ROLE_TO_ESCALATION_ROLE = Object.fromEntries(
    Object.entries(ESCALATION_ROLE_TO_APP_ROLE).map(([escalationRole, appRole]) => [appRole, escalationRole]),
)

const mapCreatedUserToRecipient = (user) => ({
    id: user.id,
    name: buildUserDisplayName(user),
    email: user.email,
    subtitle: user.email,
    source: 'created-user',
})

const mapAdminUserToRecipient = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    subtitle: user.email,
    source: 'admin-user',
})

export const getEscalationRecipients = (targetEscalationRoleKey) => {
    const appRole = ESCALATION_ROLE_TO_APP_ROLE[targetEscalationRoleKey]
    if (!appRole) return []

    const recipients = []
    const seen = new Set()

    const addRecipient = (recipient) => {
        const dedupeKey = String(recipient.email || recipient.id).toLowerCase()
        if (seen.has(dedupeKey)) return
        seen.add(dedupeKey)
        recipients.push(recipient)
    }

    getCreatedUsersByRole(appRole)
        .filter((user) => user.status === 'Active')
        .forEach((user) => addRecipient(mapCreatedUserToRecipient(user)))

    if (targetEscalationRoleKey === 'admin' || targetEscalationRoleKey === 'superAdmin') {
        getAllAdminUsers()
            .filter((user) => user.status === 'Active')
            .forEach((user) => addRecipient(mapAdminUserToRecipient(user)))
    }

    return recipients.sort((a, b) => a.name.localeCompare(b.name))
}

export const getEscalationRecipientSelectOptions = (targetEscalationRoleKey) =>
    getEscalationRecipients(targetEscalationRoleKey).map((recipient) => ({
        value: recipient.id,
        label: recipient.name,
        subLabel: recipient.subtitle,
        recipient,
    }))

export const getEscalationRecipientById = (targetEscalationRoleKey, recipientId) =>
    getEscalationRecipients(targetEscalationRoleKey).find((item) => item.id === recipientId) ?? null

export const resolveEscalationRoleKey = (appRole) => APP_ROLE_TO_ESCALATION_ROLE[appRole] ?? null

export const getCurrentEscalationUser = ({ role: appRole, email, name }) => {
    if (!appRole) return null

    const escalationRoleKey = resolveEscalationRoleKey(appRole)
    if (!escalationRoleKey) return null

    const createdSession = getActiveCreatedUserSession()
    if (createdSession?.id && createdSession.role === appRole) {
        return {
            id: createdSession.id,
            name: createdSession.name || name || createdSession.email,
            email: createdSession.email || email,
            roleKey: escalationRoleKey,
        }
    }

    const adminSession = getActiveAdminSession()
    if (adminSession?.id && (appRole === ROLES.ADMIN || appRole === ROLES.SUPER_ADMIN)) {
        return {
            id: adminSession.id,
            name: adminSession.name || name || adminSession.email,
            email: adminSession.email || email,
            roleKey: escalationRoleKey,
        }
    }

    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (normalizedEmail) {
        const createdMatch = getCreatedUsersByRole(appRole).find(
            (user) => user.email?.toLowerCase() === normalizedEmail,
        )
        if (createdMatch) {
            return {
                id: createdMatch.id,
                name: buildUserDisplayName(createdMatch),
                email: createdMatch.email,
                roleKey: escalationRoleKey,
            }
        }

        const adminMatch = getAllAdminUsers().find(
            (user) => user.email?.toLowerCase() === normalizedEmail,
        )
        if (adminMatch && (appRole === ROLES.ADMIN || appRole === ROLES.SUPER_ADMIN)) {
            return {
                id: adminMatch.id,
                name: adminMatch.name,
                email: adminMatch.email,
                roleKey: escalationRoleKey,
            }
        }
    }

    if (!normalizedEmail) return null

    return {
        id: normalizedEmail,
        name: name || getRoleConfig(escalationRoleKey)?.roleLabel || appRole,
        email: normalizedEmail,
        roleKey: escalationRoleKey,
    }
}

export const formatEscalatedToDisplay = (escalation) => {
    if (escalation?.escalatedToUserName) {
        return `${escalation.escalatedTo} · ${escalation.escalatedToUserName}`
    }
    return escalation?.escalatedTo || '—'
}

export const matchesEscalationUser = (recordUserId, recordUserEmail, currentUser) => {
    if (!currentUser) return false
    if (recordUserId && currentUser.id && recordUserId === currentUser.id) return true
    const recordEmail = String(recordUserEmail || '').trim().toLowerCase()
    const currentEmail = String(currentUser.email || '').trim().toLowerCase()
    return Boolean(recordEmail && currentEmail && recordEmail === currentEmail)
}
