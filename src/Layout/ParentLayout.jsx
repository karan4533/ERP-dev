import { Navigate, useLocation } from 'react-router-dom'
import ParentRoutes from '../Routes/ParentRoutes'
import { ActiveStudentProvider } from '../context/ActiveStudentContext'
import { ParentChildProvider, useParentChild } from '../context/ParentChildContext'
import ChildSelection from '../Pages/Parent/ChildSelection'
import {
    PARENT_DASHBOARD_ROUTE,
    PARENT_ROUTE_PREFIX,
    PARENT_SELECT_CHILD_ROUTE,
} from '../Pages/Parent/parentPortalConfig'
import AppShell from './AppShell'

const LoadingPortal = ({ children }) => (
    <div className='flex min-h-screen items-center justify-center bg-[var(--erp-canvas)] px-6 text-sm text-[var(--erp-slate)]' role='status'>
        {children}
    </div>
)

const ParentLayoutShell = () => {
    const { activeStudent, initialized } = useParentChild()

    if (!initialized) return <LoadingPortal>Loading guardian workspace…</LoadingPortal>
    if (!activeStudent) return <Navigate to={PARENT_SELECT_CHILD_ROUTE} replace />

    return (
        <ActiveStudentProvider
            student={activeStudent}
            portalMode='parent'
            routePrefix={PARENT_ROUTE_PREFIX}
        >
            <AppShell roleKey='parent'>
                <ParentRoutes />
            </AppShell>
        </ActiveStudentProvider>
    )
}

const ParentSelectChildGate = () => {
    const { mappedChildren, activeStudentId, initialized } = useParentChild()

    if (!initialized) return <LoadingPortal>Loading guardian access…</LoadingPortal>

    if (mappedChildren.length === 1 && activeStudentId) {
        return <Navigate to={PARENT_DASHBOARD_ROUTE} replace />
    }

    return <ChildSelection />
}

const ParentLayout = () => {
    const location = useLocation()
    const isSelectChild = location.pathname === PARENT_SELECT_CHILD_ROUTE

    return (
        <ParentChildProvider>
            {isSelectChild ? <ParentSelectChildGate /> : <ParentLayoutShell />}
        </ParentChildProvider>
    )
}

export default ParentLayout

