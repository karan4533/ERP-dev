import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BellIcon } from "../../CommonIcons/CommonIcons"
import {
    canUseNotificationsApi,
    listNotificationsApi,
    markNotificationReadApi,
} from "../../../services/notificationsApi"

// Portals that have a full notifications page (see src/Routes). Others only get the dropdown.
const NOTIFICATION_PAGE_SEGMENTS = new Set([
    'admin', 'super-admin', 'principal', 'director', 'teacher', 'coordinator', 'hr', 'librarian',
    'front-office', 'gate-keeper', 'gatekeeper-manager', 'student', 'parent',
])

const notificationsPathFor = (pathname) => {
    const segment = String(pathname || '').split('/').filter(Boolean)[0]
    if (!segment || segment === 'dashboard') return '/admin/notifications'
    return NOTIFICATION_PAGE_SEGMENTS.has(segment) ? `/${segment}/notifications` : null
}

const POLL_MS = 30000
const DROPDOWN_LIMIT = 20

const UserNotifications = () => {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const dropdownRef = useRef(null);
    const allPath = notificationsPathFor(location.pathname);

    const unreadCount = items.filter((item) => !item.read).length

    const refresh = useCallback(async () => {
        if (!canUseNotificationsApi()) {
            setItems([])
            return
        }
        try {
            setItems(await listNotificationsApi())
        } catch {
            // keep the last list; the bell must never break the header
        }
    }, [])

    useEffect(() => {
        refresh()
        const timer = setInterval(() => {
            if (!document.hidden) refresh()
        }, POLL_MS)
        return () => clearInterval(timer)
    }, [refresh])

    const visibleItems = items.slice(0, DROPDOWN_LIMIT)

    const toggleDropdown = () => {
        setOpen((prev) => !prev)
        if (!open) refresh()
    };

    const markRead = async (item) => {
        if (item.read) return
        setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)))
        try {
            await markNotificationReadApi(item.id)
        } catch {
            refresh()
        }
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={toggleDropdown}
                className="relative p-2 bg-[#EBEBEB] border border-[#E4E7EC] rounded-xl hover:text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 cursor-pointer"
            >
                <span className="sr-only">View notifications</span>
                <BellIcon color="#667085" size={18} />
                {unreadCount > 0 && (
                    <span
                        data-testid="notification-badge"
                        className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF0000] text-white text-[10px] leading-4 text-center"
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 divide-y divide-gray-100 z-50 max-h-96 overflow-y-auto">
                    <div className="py-2 px-4 font-semibold text-gray-700 bg-gray-50 flex items-center justify-between gap-2">
                        <span>Notifications</span>
                        {allPath ? (
                            <Link
                                to={allPath}
                                onClick={() => setOpen(false)}
                                className="text-xs font-medium text-[#515DEF] hover:underline"
                            >
                                View all
                            </Link>
                        ) : null}
                    </div>
                    {items.length === 0 ? (
                        <div className="py-3 px-4 text-sm text-gray-600">
                            {canUseNotificationsApi()
                                ? 'No new notifications from the school inbox.'
                                : 'No new notifications!'}
                        </div>
                    ) : (
                        visibleItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => markRead(item)}
                                className={`w-full text-left py-3 px-4 text-sm cursor-pointer hover:bg-gray-50 ${item.read ? "text-gray-500" : "text-gray-900 bg-[#F4F5FF]"}`}
                            >
                                <span className="block font-medium">{item.title}</span>
                                {item.body ? <span className="block text-xs mt-0.5">{item.body}</span> : null}
                            </button>
                        ))
                    )}
                    {items.length > DROPDOWN_LIMIT && (
                        <div className="py-2 px-4 text-xs text-gray-500">
                            Showing the latest {DROPDOWN_LIMIT} of {items.length}.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserNotifications;
