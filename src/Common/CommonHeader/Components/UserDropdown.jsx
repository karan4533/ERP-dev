import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RaiseItTicketModal from '../../RaiseItTicket/RaiseItTicketModal'
import { FAKE_CREDENTIALS, ROLES, useAuth } from '../../../context/AuthContext'
import { useOptionalParentChild } from '../../../context/ParentChildContext'
import { getParentByEmail } from '../../../Pages/Parent/parentData'
import SwitchChild from '../../../Pages/Parent/Components/SwitchChild'

const UserDropdown = () => {
    const navigate = useNavigate()
    const { role, logout } = useAuth()
    const parentChild = useOptionalParentChild()
    const displayEmail = role ? FAKE_CREDENTIALS[role]?.email : ''
    const parentAccount = role === ROLES.PARENT ? getParentByEmail(displayEmail) : null
    const displayName = parentAccount?.name ?? 'Neil Sims'

    const [open, setOpen] = useState(false)
    const [ticketOpen, setTicketOpen] = useState(false)
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
        <div className='flex items-center gap-x-3'>
            {role === ROLES.PARENT && parentChild?.activeStudent && <SwitchChild />}

            <div className='relative' ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    className='flex items-center gap-x-1 text-sm cursor-pointer'
                >
                    <img
                        className='w-8 h-8 rounded-full'
                        src='https://flowbite.com/docs/images/people/profile-picture-5.jpg'
                        alt='User'
                    />
                    <ChevronDown className='text-[#667085]' />
                </button>

                {open && (
                    <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 divide-y divide-gray-100 z-50'>
                        <div className='py-3 px-4'>
                            <span className='block text-sm font-semibold text-gray-900'>
                                {displayName}
                            </span>
                            <span className='block text-sm text-gray-500 truncate'>
                                {displayEmail}
                            </span>
                        </div>
                        <ul className='py-1 text-gray-700'>
                            <li>
                                <button
                                    className='flex w-full items-center gap-2 text-left py-2 px-4 text-sm hover:bg-gray-100 cursor-pointer'
                                    onClick={() => {
                                        setTicketOpen(true)
                                        setOpen(false)
                                    }}
                                >
                                    <Ticket size={14} />
                                    Raise IT Ticket
                                </button>
                            </li>
                            <li>
                                <button
                                    className='block w-full text-left py-2 px-4 text-sm hover:bg-gray-100 cursor-pointer'
                                    onClick={() => {
                                        logout()
                                        navigate('/select-profile')
                                        setOpen(false)
                                    }}
                                >
                                    Sign out
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
            <RaiseItTicketModal open={ticketOpen} onClose={() => setTicketOpen(false)} />
        </div>
    )
}

export default UserDropdown
