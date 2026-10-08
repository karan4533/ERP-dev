import React from 'react'
import { TextAlignJustify, Search } from 'lucide-react'
import UserDropdown from './Components/UserDropdown'
import UserNotifications from './Components/UserNotifications'
import { getPageTitle } from './Components/TitleMappings'
import { useLocation } from 'react-router-dom'

const CommonHeader = ({ toggleSidebar, sidebarHidden }) => {
    const location = useLocation()
    const pageTitle = getPageTitle(location.pathname)

    return (
        <header className="fixed top-0 w-full z-200 antialiased bg-white border-b border-[#e4e7ec] font-inter">
            <nav className="bg-white shadow-sm px-4 lg:px-6 py-4">
                <div className={`flex flex-wrap justify-between items-center gap-x-8 transition-all duration-300 ml-0 ${sidebarHidden ? "lg:ml-22.5" : "lg:ml-68"}`}>
                    <div className="flex justify-between items-center gap-x-3 lg:gap-x-16">
                        <button
                            onClick={toggleSidebar}
                            className="cursor-pointer lg:hidden"
                        >
                            <TextAlignJustify />
                        </button>
                        <h1 className='text-2xl font-bold hidden md:block'>{pageTitle}</h1>
                    </div>
                    <div className="flex items-center gap-x-3 lg:order-2">
                        <UserNotifications />
                        <UserDropdown />
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default CommonHeader