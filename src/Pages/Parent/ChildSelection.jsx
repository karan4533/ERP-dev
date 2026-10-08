import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useParentChild } from '../../context/ParentChildContext'
import { formatGradeSection } from '../Student/studentPortalConfig'
import { PARENT_DASHBOARD_ROUTE } from './parentPortalConfig'
import { PORTAL_LOGO, PORTAL_LOGO_ALT } from '../../constants/portalLogo'

const ChildSelection = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const { parentAccount, mappedChildren, selectChild } = useParentChild()

    const handleSelect = (studentId) => {
        const ok = selectChild(studentId)
        if (ok) {
            navigate(PARENT_DASHBOARD_ROUTE)
        }
    }

    return (
        <div className='relative w-full min-h-screen bg-[#f5f7ff] overflow-hidden font-inter'>
            <div className='absolute -bottom-32 w-150 h-150 bg-[#B4C4FF] rounded-full blur-[120px] -left-28 opacity-70' />
            <div className='absolute -top-28 w-150 h-150 bg-[#B4C4FF] rounded-full blur-[120px] -right-28 opacity-70' />

            <div className='relative z-10 max-w-3xl mx-auto px-4 py-10 min-h-screen flex flex-col'>
                <div className='flex justify-between items-center mb-10'>
                    <img src={PORTAL_LOGO} alt={PORTAL_LOGO_ALT} className='h-14 w-auto object-contain' />
                    <button
                        type='button'
                        onClick={() => {
                            logout()
                            navigate('/select-profile')
                        }}
                        className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>

                <div className='flex-1 flex flex-col justify-center'>
                    <h1 className='text-3xl font-semibold text-[#0C1E5B]'>
                        Welcome, {parentAccount?.name ?? 'Parent'}
                    </h1>
                    <p className='text-base text-[#667085] mt-2 mb-8'>
                        Select a child to view their school information.
                    </p>

                    <h2 className='text-lg font-semibold text-[#1E1E1E] mb-4'>Select Child</h2>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        {mappedChildren.map((child) => (
                            <div
                                key={child.id}
                                className='bg-white rounded-2xl shadow-md border border-[#EEF0F6] p-5 flex flex-col gap-4'
                            >
                                <div className='flex items-start gap-4'>
                                    <div className='w-12 h-12 rounded-full bg-[#515DEF1A] flex items-center justify-center shrink-0'>
                                        <GraduationCap className='text-[#515DEF]' size={24} />
                                    </div>
                                    <div>
                                        <h3 className='text-lg font-semibold text-[#0C1E5B]'>{child.name}</h3>
                                        <p className='text-sm text-[#667085] mt-1'>{formatGradeSection(child)}</p>
                                        <p className='text-xs text-[#808080] mt-1'>Student ID: {child.id}</p>
                                    </div>
                                </div>
                                <button
                                    type='button'
                                    onClick={() => handleSelect(child.id)}
                                    className='w-full bg-[#515DEF] text-white text-sm py-2.5 rounded-md hover:opacity-90 transition-opacity cursor-pointer'
                                >
                                    View Dashboard
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChildSelection
