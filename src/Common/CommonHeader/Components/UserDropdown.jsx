import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
    ChevronDown,
    ChevronRight,
    Ticket,
    User,
    Settings,
    HelpCircle,
    LogOut,
    Shield,
    Building2,
    CheckCircle2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FAKE_CREDENTIALS, ROLES, useAuth } from '../../../context/AuthContext'
import { useOptionalParentChild } from '../../../context/ParentChildContext'
import { getParentByEmail } from '../../../Pages/Parent/parentData'
import SwitchChild from '../../../Pages/Parent/Components/SwitchChild'
import { getProfileLabel } from '../../../Pages/Authentication/profileOptions'
import { ENTERPRISE_EMPLOYEES } from '../../AttendanceAndLeave/attendanceLeaveData'

const UserDropdown = () => {
    const navigate = useNavigate()
    const { role, logout, name: authName } = useAuth()
    const parentChild = useOptionalParentChild()
    const displayEmail = role ? FAKE_CREDENTIALS[role]?.email : ''
    const parentAccount = role === ROLES.PARENT ? getParentByEmail(displayEmail) : null
    const roleLabel = getProfileLabel(role)
    const displayName = authName || (parentAccount?.name ?? roleLabel ?? 'User')

    const employee = useMemo(() => {
        const normalized = (displayEmail || '').toLowerCase().trim()
        return (
            ENTERPRISE_EMPLOYEES.find((e) => e.email?.toLowerCase() === normalized) ||
            ENTERPRISE_EMPLOYEES.find((e) => e.roleKey === role) ||
            null
        )
    }, [displayEmail, role])

    const employeeId = employee?.id || (role === ROLES.STUDENT ? 'STU-2026-104' : role === ROLES.PARENT ? 'PAR-2026-088' : 'EMP-2026-042')
    const departmentName = employee?.department || (role === ROLES.STUDENT ? 'Grade 10 - Section A' : role === ROLES.PARENT ? 'Parent Community' : 'Administration')

    const [open, setOpen] = useState(false)
    const dropdownRef = useRef(null)

    const toggleDropdown = () => setOpen((prev) => !prev)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className='flex items-center gap-x-2 sm:gap-x-3'>
            {role === ROLES.PARENT && parentChild?.activeStudent && <SwitchChild />}

            <div className='relative' ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    aria-label='User profile menu'
                    aria-expanded={open}
                    className='flex items-center gap-x-2 rounded-full border border-slate-200 bg-white p-1 pr-2.5 text-sm hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs'
                >
                    <img
                        className='size-7 rounded-full object-cover ring-1 ring-blue-500/30'
                        src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
                        alt={displayName}
                    />
                    <span className='hidden sm:inline-block max-w-[120px] truncate text-xs font-semibold text-slate-800'>
                        {displayName}
                    </span>
                    <ChevronDown size={14} className='text-slate-400' />
                </button>

                {open && (
                    <div className='absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl divide-y divide-slate-100 z-50 text-xs font-medium'>
                        {/* Header & Essential Profile Summary */}
                        <div className='p-3 bg-gradient-to-b from-slate-50/90 to-white rounded-xl border border-slate-100/80 mb-1 space-y-2.5'>
                            <div className='flex items-start gap-3'>
                                <div className='relative shrink-0 mt-0.5'>
                                    <img
                                        className='size-10 rounded-full object-cover ring-2 ring-blue-500/20'
                                        src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
                                        alt={displayName}
                                    />
                                    <span className='absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white' />
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <div className='flex items-center justify-between gap-1'>
                                        <p className='truncate text-sm font-bold text-slate-900'>
                                            {displayName}
                                        </p>
                                        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60'>
                                            <span className='size-1.5 rounded-full bg-emerald-500' />
                                            Active
                                        </span>
                                    </div>
                                    <p className='truncate text-slate-500 text-[11px] mt-0.5'>
                                        {displayEmail}
                                    </p>
                                </div>
                            </div>

                            {/* Essential Identity Details Strip */}
                            <div className='pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] bg-slate-50/60 p-2 rounded-lg'>
                                <div>
                                    <span className='block text-[10px] font-medium text-slate-400 uppercase tracking-wider'>ID Number</span>
                                    <span className='font-mono font-bold text-slate-800'>{employeeId}</span>
                                </div>
                                <div>
                                    <span className='block text-[10px] font-medium text-slate-400 uppercase tracking-wider'>Department / Role</span>
                                    <span className='font-semibold text-slate-800 truncate block' title={departmentName}>
                                        {departmentName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Profile & Settings Navigation Links */}
                        <div className='py-1 space-y-0.5'>
                            <button
                                className='flex w-full items-center justify-between rounded-xl px-3 py-2 text-slate-700 hover:bg-blue-50/60 hover:text-blue-700 transition-colors cursor-pointer group'
                                onClick={() => {
                                    navigate('/my-profile')
                                    setOpen(false)
                                }}
                            >
                                <div className='flex items-center gap-2.5'>
                                    <div className='p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors'>
                                        <User size={15} />
                                    </div>
                                    <div className='text-left'>
                                        <p className='font-semibold text-slate-800 group-hover:text-blue-700'>My Profile</p>
                                        <p className='text-[10px] text-slate-400'>Personal info, vault & employment history</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className='text-slate-300 group-hover:text-blue-600 transition-colors' />
                            </button>

                            <button
                                className='flex w-full items-center justify-between rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer group'
                                onClick={() => {
                                    navigate('/settings')
                                    setOpen(false)
                                }}
                            >
                                <div className='flex items-center gap-2.5'>
                                    <div className='p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors'>
                                        <Settings size={15} />
                                    </div>
                                    <div className='text-left'>
                                        <p className='font-semibold text-slate-800'>Settings & Preferences</p>
                                        <p className='text-[10px] text-slate-400'>Workspace, alerts & security parameters</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className='text-slate-300 group-hover:text-slate-600 transition-colors' />
                            </button>
                        </div>

                        {/* Sign Out */}
                        <div className='pt-1'>
                            <button
                                className='flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer'
                                onClick={() => {
                                    logout()
                                    navigate('/signin')
                                    setOpen(false)
                                }}
                            >
                                <div className='p-1.5 rounded-lg bg-red-50 text-red-600'>
                                    <LogOut size={15} />
                                </div>
                                <span className='font-semibold'>Sign out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserDropdown
