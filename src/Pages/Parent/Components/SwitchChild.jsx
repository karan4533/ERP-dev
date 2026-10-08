import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, UsersRound } from 'lucide-react'
import { useParentChild } from '../../../context/ParentChildContext'
import { formatGradeSection } from '../../Student/studentPortalConfig'
import { PARENT_SELECT_CHILD_ROUTE } from '../parentPortalConfig'

const SwitchChild = () => {
    const navigate = useNavigate()
    const { mappedChildren, activeStudent, activeStudentId, selectChild, hasMultipleChildren } = useParentChild()
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!activeStudent) return null

    const handleSelect = (studentId) => {
        selectChild(studentId)
        setOpen(false)
    }

    return (
        <div className='relative' ref={dropdownRef}>
            <button
                type='button'
                onClick={() => setOpen((prev) => !prev)}
                className='flex items-center gap-2 px-3 py-2 rounded-lg border border-[#EEF0F6] bg-[#FAFBFD] hover:border-[#515DEF33] transition-colors cursor-pointer max-w-[240px]'
            >
                <div className='w-8 h-8 rounded-full bg-[#515DEF1A] flex items-center justify-center shrink-0'>
                    <UsersRound size={16} className='text-[#515DEF]' />
                </div>
                <div className='text-left min-w-0 hidden sm:block'>
                    <p className='text-xs text-[#808080] leading-none'>Current Child</p>
                    <p className='text-sm font-semibold text-[#0C1E5B] truncate'>{activeStudent.name}</p>
                </div>
                <ChevronDown size={16} className='text-[#667085] shrink-0' />
            </button>

            {open && (
                <div className='absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#EEF0F6] z-50 overflow-hidden'>
                    <div className='px-4 py-3 border-b border-[#EEF0F6] bg-[#FAFBFD]'>
                        <p className='text-sm font-semibold text-[#0C1E5B]'>Switch Child</p>
                        <p className='text-xs text-[#667085] mt-0.5'>{formatGradeSection(activeStudent)}</p>
                    </div>
                    <ul className='py-2 max-h-64 overflow-y-auto'>
                        {mappedChildren.map((child) => {
                            const isActive = child.id === activeStudentId
                            return (
                                <li key={child.id}>
                                    <button
                                        type='button'
                                        onClick={() => handleSelect(child.id)}
                                        className={`w-full text-left px-4 py-3 hover:bg-[#515DEF0D] transition-colors cursor-pointer flex items-start gap-3 ${isActive ? 'bg-[#515DEF0D]' : ''}`}
                                    >
                                        <span className='mt-0.5 shrink-0'>
                                            {isActive ? (
                                                <Check size={16} className='text-[#515DEF]' />
                                            ) : (
                                                <span className='inline-block w-4' />
                                            )}
                                        </span>
                                        <span>
                                            <span className='block text-sm font-medium text-[#1E1E1E]'>{child.name}</span>
                                            <span className='block text-xs text-[#667085] mt-0.5'>{formatGradeSection(child)}</span>
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                    {hasMultipleChildren && (
                        <div className='px-4 py-3 border-t border-[#EEF0F6]'>
                            <button
                                type='button'
                                onClick={() => {
                                    setOpen(false)
                                    navigate(PARENT_SELECT_CHILD_ROUTE)
                                }}
                                className='text-sm text-[#515DEF] hover:underline cursor-pointer'
                            >
                                View all children
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SwitchChild
