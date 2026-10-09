import React, { useState, useEffect } from 'react'
import CommonHeader from '../Common/CommonHeader/CommonHeader'
import CommonSidebar from '../Common/CommonSidebar/CommonSidebar'
import AccountHeadRoutes from '../Routes/AccountHeadRoutes'
import { useFinance } from '../Pages/AccountHead/financeDomain/FinanceContext'

const AccountHeadLayout = () => {
    const [sidebarHidden, setSidebarHidden] = useState(() => window.innerWidth < 1024)
    const { financeStatus, financeError, reloadFinanceFromApi } = useFinance()

    const toggleSidebar = () => {
        setSidebarHidden((prevState) => !prevState)
    }

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
                    {financeStatus === 'loading' && (
                        <p className='p-4 text-sm text-[#667085]'>Loading finance snapshot from API…</p>
                    )}
                    {financeStatus === 'error' && (
                        <div className='mb-4 rounded-xl border border-[#FF5722] bg-[#FF57221A] p-4 text-sm text-[#B42318]'>
                            <p className='font-semibold'>Finance API is the source of truth — load failed</p>
                            <p className='mt-1'>{financeError}</p>
                            <p className='mt-2 text-xs'>Clearing site data does not wipe server collections. Start the backend and retry.</p>
                            <button
                                type='button'
                                className='mt-3 text-sm font-medium text-[#515DEF] underline cursor-pointer'
                                onClick={() => reloadFinanceFromApi().catch(() => {})}
                            >
                                Retry API load
                            </button>
                        </div>
                    )}
                    {financeStatus === 'ready' && <AccountHeadRoutes />}
                </div>
            </main>
        </div>
    )
}

export default AccountHeadLayout
