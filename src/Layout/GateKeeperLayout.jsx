import React, { useState, useEffect } from 'react'
import CommonHeader from '../Common/CommonHeader/CommonHeader'
import CommonSidebar from '../Common/CommonSidebar/CommonSidebar'
import CommonBreadcrumb from '../Common/CommonBreadcrumb/CommonBreadcrumb'
import GateKeeperRoutes from '../Routes/GateKeeperRoutes'

const GateKeeperLayout = () => {

    const [sidebarHidden, setSidebarHidden] = useState(() => {
        return window.innerWidth < 1024;
    });

    const toggleSidebar = () => {
        setSidebarHidden(prevState => !prevState);
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarHidden(true);
            } else {
                setSidebarHidden(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className='bg-white min-h-screen font-sans'>
            <CommonSidebar toggleSidebar={toggleSidebar} sidebarHidden={sidebarHidden} />

            <CommonHeader toggleSidebar={toggleSidebar} sidebarHidden={sidebarHidden} />

            {!sidebarHidden && (
                <div
                    className={`fixed inset-0 bg-black/50 z-10 transition-all ease-in-out duration-200 lg:hidden`}
                    onClick={() => setSidebarHidden(true)}
                />
            )}

            <main
                className={`transition-all ease-in-out duration-200 bg-[#f9f9f9] min-h-screen pt-18 ml-0 ${sidebarHidden ? "lg:ml-[90px]" : "lg:ml-[280px]"}`}
            >
                <div className="p-3 font-inter">
                    <CommonBreadcrumb />
                    <GateKeeperRoutes />
                </div>
            </main>
        </div>
    )
}

export default GateKeeperLayout
