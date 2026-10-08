import { useState, useRef, useEffect } from "react";

export default function Dropdown({ buttonContent, children }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef();

    // close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>

            {/* Button */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md text-sm px-4 py-2.5 cursor-pointer"
            >
                {buttonContent}
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    {/* Mobile Overlay */}
                    <div
                        className="fixed inset-0 bg-black/30 z-40 sm:hidden"
                        onClick={() => setOpen(false)}
                    />

                    <div
                        className="absolute z-50 right-0 w-34 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
                        <div className="text-sm flex flex-col gap-1">
                            {children}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}