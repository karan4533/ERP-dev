import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import CommonHeader from '../Common/CommonHeader/CommonHeader'
import CommonSidebar from '../Common/CommonSidebar/CommonSidebar'
import CommonBreadcrumb from '../Common/CommonBreadcrumb/CommonBreadcrumb'
import ParentRoutes from '../Routes/ParentRoutes'
import ChildSelection from '../Pages/Parent/ChildSelection'
import { ActiveStudentProvider } from '../context/ActiveStudentContext'
import { ParentChildProvider, useParentChild } from '../context/ParentChildContext'
import { PARENT_DASHBOARD_ROUTE, PARENT_ROUTE_PREFIX, PARENT_SELECT_CHILD_ROUTE } from '../Pages/Parent/parentPortalConfig'

const ParentLayoutShell = () => {
    const { activeStudent, initialized } = useParentChild()

    const [sidebarHidden, setSidebarHidden] = useState(() => window.innerWidth < 1024)

    const toggleSidebar = () => setSidebarHidden((prev) => !prev)

    useEffect(() => {
        const handleResize = () => {
            setSidebarHidden(window.innerWidth < 1024)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    if (!initialized) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-[#f9f9f9] text-[#667085]'>
                Loading parent portal...
            </div>
        )
    }

    if (!activeStudent) {
        return <Navigate to={PARENT_SELECT_CHILD_ROUTE} replace />
    }

    return (
        <ActiveStudentProvider
            student={activeStudent}
            portalMode="parent"
            routePrefix={PARENT_ROUTE_PREFIX}
        >
            <div className='bg-white min-h-screen font-sans'>
                <CommonSidebar toggleSidebar={toggleSidebar} sidebarHidden={sidebarHidden} />
                <CommonHeader toggleSidebar={toggleSidebar} sidebarHidden={sidebarHidden} />

                {!sidebarHidden && (
                    <div
                        className='fixed inset-0 bg-black/50 z-10 transition-all ease-in-out duration-200 lg:hidden'
                        onClick={() => setSidebarHidden(true)}
                    />
                )}

                <main
                    className={`transition-all ease-in-out duration-200 bg-[#f9f9f9] min-h-screen pt-18 ml-0 ${sidebarHidden ? 'lg:ml-22.5' : 'lg:ml-70'}`}
                >
                    <div className='p-3 pt-7 font-inter'>
                        <CommonBreadcrumb />
                        <ParentRoutes />
                    </div>
                </main>
            </div>
        </ActiveStudentProvider>
    )
}

const ParentSelectChildGate = () => {
    const { mappedChildren, activeStudentId, initialized } = useParentChild()

    if (!initialized) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-[#f5f7ff] text-[#667085]'>
                Loading...
            </div>
        )
    }

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
