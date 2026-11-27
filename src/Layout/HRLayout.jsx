import React, { useState, useEffect } from 'react'
import CommonHeader from '../Common/CommonHeader/CommonHeader'
import CommonSidebar from '../Common/CommonSidebar/CommonSidebar'
import HRRoutes from '../Routes/HRRoutes'
import { getHrHydrateError, hydrateHrStore } from '../Pages/HR/domain/hrStore'

const HRLayout = () => {
    const [sidebarHidden, setSidebarHidden] = useState(() => window.innerWidth < 1024)
    const [hrReady, setHrReady] = useState(false)
    const [hrError, setHrError] = useState(null)

    const toggleSidebar = () => {
        setSidebarHidden((prevState) => !prevState)
    }

    useEffect(() => {
        let live = true
        setHrReady(false)
        setHrError(null)
        hydrateHrStore()
            .then(() => {
                if (live) {
                    setHrReady(true)
                    setHrError(null)
                }
            })
            .catch((error) => {
                if (live) {
                    setHrReady(false)
                    setHrError(error?.message || getHrHydrateError() || 'HR API failed')
                }
            })
        return () => {
            live = false
        }
    }, [])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarHidden(true)
            } else {
                setSidebarHidden(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
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
                <div className="p-3 font-inter">
                    {hrError && (
                        <div className='mb-4 rounded-xl border border-[#FF5722] bg-[#FF57221A] p-4 text-sm text-[#B42318]'>
                            <p className='font-semibold'>HR API is the source of truth — load failed</p>
                            <p className='mt-1'>{hrError}</p>
                            <p className='mt-2 text-xs'>localStorage is not used for employees, leave, or payroll. Start the backend and refresh.</p>
                            <button
                                type='button'
                                className='mt-3 text-sm font-medium text-[#515DEF] underline cursor-pointer'
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {!hrError && !hrReady && <p className="p-4 text-sm text-[#667085]">Loading HR records from API…</p>}
                    {hrReady && !hrError ? <HRRoutes /> : null}
                </div>
            </main>
        </div>
    )
}

export default HRLayout
