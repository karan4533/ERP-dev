import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

/**
 * One "Lesson Plan" area for Teacher and Coordinator: the submission list (all statuses, add new)
 * and the approved plans used for delivery (Mark as Done). Both keep their existing URLs.
 */
const LessonPlanTabs = () => {
    const { pathname } = useLocation()
    const prefix = pathname.startsWith('/coordinator') ? '/coordinator' : '/teacher'
    const tabs = [
        { to: `${prefix}/lesson-plan-approval`, label: 'My Submissions', hint: 'Add plans and track approval' },
        { to: `${prefix}/lesson-plan/my-lesson-plan`, label: 'Approved & Delivery', hint: 'Mark approved plans as done' },
    ]

    return (
        <nav aria-label='Lesson plan sections' className='flex gap-6 border-b border-[#F2F4F7] mb-6 overflow-x-auto'>
            {tabs.map((tab) => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    end
                    title={tab.hint}
                    className={({ isActive }) => `whitespace-nowrap pb-3 text-sm md:text-base font-medium ${
                        isActive ? 'text-[#515DEF] border-b-2 border-[#515DEF] font-semibold' : 'text-[#808080] hover:text-[#515DEF]'
                    }`}
                >
                    {tab.label}
                </NavLink>
            ))}
        </nav>
    )
}

export default LessonPlanTabs
