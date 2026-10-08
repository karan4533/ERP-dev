import React, { useState, useEffect, useRef, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronDown } from "lucide-react"
import { PORTAL_LOGO, PORTAL_LOGO_ICON, PORTAL_LOGO_ALT } from "../../constants/portalLogo"
import { superAdminSidebarLinks, canteenManagerSidebarLinks, gateKeeperManagerSidebarLinks, gateKeeperSidebarLinks, directorSidebarLinks, principalSidebarLinks, librarianSidebarLinks, prmSidebarLinks, studentSidebarLinks, parentSidebarLinks, teacherSidebarLinks, coordinatorSidebarLinks, itSupportManagerSidebarLinks, stationeryStoreManagerSidebarLinks, housekeepingManagerSidebarLinks, transportManagerSidebarLinks, jointDirectorSidebarLinks, jointDirectorAssistantSidebarLinks, jointDirectorAuditSidebarLinks, processAuditorSidebarLinks, qualityAuditorSidebarLinks, hrSidebarLinks, accountHeadSidebarLinks, driverSidebarLinks } from './Components/sidebarLinks'
import { getFilteredAdminSidebarLinks } from '../../Pages/SuperAdmin/UserCreation/adminUsersData'
import {
    getFilteredCoordinatorSidebarLinks,
    getFilteredTeacherSidebarLinks,
} from '../RBAC/rolePermissionsData'

const CommonSidebar = ({ sidebarHidden, toggleSidebar }) => {

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            toggleSidebar();
        }
    };

    const [openMenus, setOpenMenus] = useState({});
    const [manuallyOpened, setManuallyOpened] = useState(null);
    const flyoutRef = useRef(null);

    const location = useLocation();

    const sidebarLinks = useMemo(() => {
        if (location.pathname.startsWith('/super-admin')) return superAdminSidebarLinks
        if (location.pathname.startsWith('/parent')) return parentSidebarLinks
        if (location.pathname.startsWith('/student')) return studentSidebarLinks
        if (location.pathname.startsWith('/coordinator')) return getFilteredCoordinatorSidebarLinks(coordinatorSidebarLinks)
        if (location.pathname.startsWith('/teacher')) return getFilteredTeacherSidebarLinks(teacherSidebarLinks)
        if (location.pathname.startsWith('/librarian')) return librarianSidebarLinks
        if (location.pathname.startsWith('/canteen-manager')) return canteenManagerSidebarLinks
        if (location.pathname.startsWith('/it-support-manager')) return itSupportManagerSidebarLinks
        if (location.pathname.startsWith('/stationery-store-manager')) return stationeryStoreManagerSidebarLinks
        if (location.pathname.startsWith('/housekeeping-manager')) return housekeepingManagerSidebarLinks
        if (location.pathname.startsWith('/transport-manager')) return transportManagerSidebarLinks
        if (location.pathname.startsWith('/process-auditor')) return processAuditorSidebarLinks
        if (location.pathname.startsWith('/quality-auditor')) return qualityAuditorSidebarLinks
        if (location.pathname.startsWith('/hr')) return hrSidebarLinks
        if (location.pathname.startsWith('/account-head')) return accountHeadSidebarLinks
        if (location.pathname.startsWith('/driver')) return driverSidebarLinks
        if (location.pathname.startsWith('/joint-director-audit')) return jointDirectorAuditSidebarLinks
        if (location.pathname.startsWith('/joint-director-assistant')) return jointDirectorAssistantSidebarLinks
        if (location.pathname.startsWith('/joint-director')) return jointDirectorSidebarLinks
        if (location.pathname.startsWith('/gatekeeper-manager')) return gateKeeperManagerSidebarLinks
        if (location.pathname.startsWith('/gate-keeper')) return gateKeeperSidebarLinks
        if (location.pathname.startsWith('/director')) return directorSidebarLinks
        if (location.pathname.startsWith('/principal')) return principalSidebarLinks
        if (location.pathname.startsWith('/front-office')) return prmSidebarLinks
        return getFilteredAdminSidebarLinks()
    }, [location.pathname]);

    const toggleSubMenu = (id) => {
        setOpenMenus(prev => ({
            ...prev,
            [id]: !prev[id]
        }));

        // Track manual open only in collapsed mode
        if (sidebarHidden) {
            setManuallyOpened(prev => (prev === id ? null : id));
        }
    };

    useEffect(() => {
        const newOpenMenus = {};
        sidebarLinks.forEach((link) => {
            if (link.subLinks) {
                const isActive = link.subLinks.some(
                    (sub) =>
                        location.pathname === sub.to ||
                        location.pathname.startsWith(`${sub.to}/`)
                );
                if (isActive) {
                    newOpenMenus[link.id] = true;
                }
            }
        });
        setOpenMenus(newOpenMenus);
    }, [location.pathname, sidebarLinks]);

    useEffect(() => {
        if (!sidebarHidden) {
            setManuallyOpened(null);
        }
    }, [sidebarHidden]);

    // Close flyout when clicking outside (collapsed sidebar mode)
    useEffect(() => {
        if (!sidebarHidden) return;

        const handleClickOutside = (e) => {
            if (flyoutRef.current && !flyoutRef.current.contains(e.target)) {
                setOpenMenus({});
                setManuallyOpened(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarHidden]);

    return (
        <aside
            className={`bg-[#515DEF] flex flex-col h-full transition-all duration-300 fixed top-0 left-0 z-300 font-inter overflow-visible ${sidebarHidden
                ? "w-[280px] -translate-x-full lg:translate-x-0 lg:w-[90px] shadow-none"
                : "w-[280px] translate-x-0"
                }`}
        >

            {/* Toggle Button - outside scrollable area so it's not clipped */}
            <div className='hidden lg:flex justify-end relative z-50 px-2'>
                <button
                    onClick={toggleSidebar}
                    className={`text-[#0c269b] cursor-pointer flex items-center justify-center size-10 bg-[#e7eaf5] rounded-full p-1 border-2 border-white relative translate-x-1/2 transition-transform hover:scale-105 ${sidebarHidden ? "rotate-180" : ""}`}
                >
                    <ChevronLeft />
                </button>
            </div>

            {/* Scrollable Links Container */}
            <div className={`flex-1 px-2 pb-4 lg:pt-0 flex flex-col gap-y-3 ${sidebarHidden ? "overflow-visible" : "overflow-y-auto sidebar-scroll-hide"}`}>

                <div className="relative shrink-0 overflow-hidden border-b border-[#e4e7ec] h-32">
                    <img
                        src={PORTAL_LOGO}
                        alt={PORTAL_LOGO_ALT}
                        className={`absolute inset-0 h-full w-full p-4 object-cover object-left transition-all duration-300 ease-in-out ${
                            sidebarHidden
                                ? "opacity-0 scale-95 pointer-events-none"
                                : "opacity-100 scale-100"
                        }`}
                    />
                    <img
                        src={PORTAL_LOGO_ICON}
                        alt={PORTAL_LOGO_ALT}
                        className={`absolute inset-0 h-full w-full p-3 object-contain transition-all duration-300 ease-in-out ${
                            sidebarHidden
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-95 pointer-events-none"
                        }`}
                    />
                </div>

                <ul className="flex flex-col gap-y-2" ref={flyoutRef}>
                    {sidebarLinks.map((item) => {
                        const hasSubLinks = item.subLinks && item.subLinks.length > 0;
                        const isOpen = !!openMenus[item.id];
                        const isChildActive =
                            hasSubLinks &&
                            item.subLinks.some(
                                (sub) =>
                                    location.pathname === sub.to ||
                                    location.pathname.startsWith(`${sub.to}/`)
                            );

                        const commonClasses = (active) => `flex items-center gap-x-4 py-3.5 px-3 text-base font-medium rounded-md transition-all duration-300 group cursor-pointer ${active
                            ? "text-[#3a46d1] bg-white"
                            : "text-[#ffffffb3] hover:bg-white hover:text-[#3a46d1]"
                            } ${sidebarHidden ? "justify-center pl-3" : "justify-start pl-6"}`;

                        return (
                            <li key={item.id} className="relative group">
                                {hasSubLinks ? (
                                    <div
                                        onClick={(e) => toggleSubMenu(item.id, e)}
                                        className={commonClasses(isChildActive)}
                                    >
                                        <item.icon width={30} height={30} />
                                        {!sidebarHidden && (
                                            <>
                                                <span className="flex-1">{item.title}</span>
                                                <ChevronDown
                                                    className={`size-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                                />
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <NavLink
                                        to={item.to}
                                        onClick={handleLinkClick}
                                        className={({ isActive }) => commonClasses(isActive)}
                                    >
                                        <item.icon width={30} height={30} />
                                        {!sidebarHidden && (
                                            <span className="flex-1">{item.title}</span>
                                        )}
                                    </NavLink>
                                )}

                                {/* Hover tooltip when sidebar is collapsed */}
                                {sidebarHidden && manuallyOpened !== item.id && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 pl-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">

                                        {/* Arrow */}
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-[#515DEF]"></div>

                                        {/* Tooltip */}
                                        <span className="bg-[#515DEF] text-white text-sm font-medium px-4 py-2 rounded-md whitespace-nowrap shadow-lg">
                                            {item.title}
                                        </span>
                                    </div>
                                )}

                                {/* Expanded sidebar: inline dropdown */}
                                {hasSubLinks && isOpen && !sidebarHidden && (
                                    <ul className="mt-1 flex flex-col gap-y-1">
                                        {item.subLinks.map((sub, index) => (
                                            <li key={index}>
                                                <NavLink
                                                    to={sub.to}
                                                    onClick={handleLinkClick}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-x-4 py-3.5 px-2.5 pl-10 text-sm font-medium rounded-md transition-all duration-300 cursor-pointer ${isActive ? "bg-white text-[#3a46d1]" : "text-[#ffffffb3] hover:bg-[#3a46d1] hover:text-white"}`
                                                    }
                                                >
                                                    <sub.icon size={23} />
                                                    {sub.title}
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Collapsed sidebar: flyout popup to the right */}
                                {hasSubLinks && sidebarHidden && manuallyOpened === item.id && (
                                    <ul
                                        className="fixed left-[98px] w-56 bg-[#515DEF] rounded-lg shadow-xl py-2 px-2 flex flex-col gap-y-1 z-50 border border-[#6a74f2]"
                                    >
                                        <li className="px-3 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/10 mb-1">
                                            {item.title}
                                        </li>
                                        {item.subLinks.map((sub, index) => (
                                            <li key={index}>
                                                <NavLink
                                                    to={sub.to}
                                                    onClick={() => {
                                                        setOpenMenus({});
                                                        setManuallyOpened(null);
                                                    }}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-x-3 py-2.5 px-3 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer whitespace-nowrap ${isActive ? "bg-white text-[#3a46d1]" : "text-[#ffffffdd] hover:bg-white hover:text-[#3a46d1]"}`
                                                    }
                                                >
                                                    <sub.icon size={20} />
                                                    {sub.title}
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </aside>
    );
};

export default CommonSidebar

