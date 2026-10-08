import React, { useState, useRef, useEffect } from "react";
import { BellIcon } from "../../CommonIcons/CommonIcons"

const UserNotifications = () => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setOpen((prev) => !prev);

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
                className="p-2 bg-[#EBEBEB] border border-[#E4E7EC] rounded-xl hover:text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 cursor-pointer"
            >
                <span className="sr-only">View notifications</span>
                <BellIcon color="#667085" size={18} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-100 divide-y divide-gray-100 z-50">
                    <div className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">
                        Notifications
                    </div>
                    <div className="py-3 px-4 text-sm text-gray-600">
                        No new notifications!
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserNotifications;
