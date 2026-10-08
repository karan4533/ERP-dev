import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTE_BASE_BY_ROLE } from './taskManagementConfig'

const inferRoleFromPath = (pathname) => {
    const entries = Object.entries(ROUTE_BASE_BY_ROLE).sort(
        (a, b) => b[1].length - a[1].length
    )
    for (const [roleKey, base] of entries) {
        if (pathname.startsWith(base)) return roleKey
    }
    return null
}

export const useTaskRole = () => {
    const { role } = useAuth()
    const { pathname } = useLocation()
    return role ?? inferRoleFromPath(pathname)
}
