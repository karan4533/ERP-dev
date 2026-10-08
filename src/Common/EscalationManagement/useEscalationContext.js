import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTE_BASE_BY_ROLE } from '../TaskManagement/taskManagementConfig'
import { getCurrentEscalationUser, resolveEscalationRoleKey } from './escalationUsersData'

const inferRoleFromPath = (pathname) => {
    const entries = Object.entries(ROUTE_BASE_BY_ROLE).sort(
        (a, b) => b[1].length - a[1].length,
    )
    for (const [roleKey, base] of entries) {
        if (pathname.startsWith(base)) return roleKey
    }
    return null
}

export const useEscalationContext = (roleKeyProp) => {
    const { role, email, name } = useAuth()
    const { pathname } = useLocation()
    const appRole = role ?? inferRoleFromPath(pathname)
    const escalationRoleKey = roleKeyProp || resolveEscalationRoleKey(appRole)
    const currentUser = getCurrentEscalationUser({ role: appRole, email, name })

    return {
        appRole,
        escalationRoleKey,
        currentUser,
    }
}
