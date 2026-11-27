import React, { useEffect, useState } from 'react'
import CommonHeader from '../Common/CommonHeader/CommonHeader'
import CommonSidebar from '../Common/CommonSidebar/CommonSidebar'
import CommonBreadcrumb from '../Common/CommonBreadcrumb/CommonBreadcrumb'
import StudentRoutes from '../Routes/StudentRoutes'
import { ActiveStudentProvider } from '../context/ActiveStudentContext'
import { ROLES, useAuth } from '../context/AuthContext'
import { DEFAULT_STUDENT_PROFILE } from '../Pages/Student/studentPortalConfig'
import { isApiAuthEnabled } from '../services/apiClient'
import { getMyStudentApi, mapMyStudentProfile } from '../services/studentsApi'

const StudentLayout = () => {
    const { role } = useAuth()
    const apiStudent = isApiAuthEnabled() && role === ROLES.STUDENT

    const [sidebarHidden, setSidebarHidden] = useState(() => window.innerWidth < 1024)
    const [profile, setProfile] = useState(apiStudent ? null : DEFAULT_STUDENT_PROFILE)
    const [initialized, setInitialized] = useState(!apiStudent)
    const [loadError, setLoadError] = useState(null)

    const toggleSidebar = () => setSidebarHidden((prev) => !prev)

    useEffect(() => {
        const handleResize = () => {
            setSidebarHidden(window.innerWidth < 1024)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        let cancelled = false

        if (!apiStudent) {
            setProfile(DEFAULT_STUDENT_PROFILE)
            setLoadError(null)
            setInitialized(true)
            return undefined
        }

        setInitialized(false)
        setLoadError(null)
        getMyStudentApi()
            .then((row) => {
                if (cancelled) return
                const mapped = mapMyStudentProfile(row)
                setProfile(mapped || DEFAULT_STUDENT_PROFILE)
                setInitialized(true)
            })
            .catch((error) => {
                if (cancelled) return
                console.error(error)
                setProfile(DEFAULT_STUDENT_PROFILE)
                setLoadError(error?.message || 'Could not load student profile from API.')
                setInitialized(true)
            })

        return () => {
            cancelled = true
        }
    }, [apiStudent])

    if (!initialized || !profile) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-[#f9f9f9] text-[#667085]'>
                Loading student portal...
            </div>
        )
    }

    return (
        <ActiveStudentProvider student={profile} portalMode="student" routePrefix="/student">
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
                    className={`transition-all ease-in-out duration-200 bg-[#f9f9f9] min-h-screen pt-18 ml-0 ${sidebarHidden ? 'lg:ml-[90px]' : 'lg:ml-[280px]'}`}
                >
                    <div className='p-3 font-inter'>
                        {loadError && (
                            <div className='mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800'>
                                {loadError} Showing offline demo profile.
                            </div>
                        )}
                        <CommonBreadcrumb />
                        <StudentRoutes />
                    </div>
                </main>
            </div>
        </ActiveStudentProvider>
    )
}

export default StudentLayout
