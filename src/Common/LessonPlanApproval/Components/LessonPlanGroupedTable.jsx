import React from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import EmptyState from './EmptyState'
import GroupStatusProgress from './GroupStatusProgress'

const LessonPlanGroupedTable = ({
    groups,
    emptyTitle = 'No results',
    emptyMessage = 'No lesson plan groups to display.',
    emptyIcon = 'inbox',
    showTeacherColumn = true,
    showLatestSubmitted = true,
    getGroupHref,
    actionLabel = 'View',
    statusMode = 'approval',
}) => {
    const colSpan =
        (showTeacherColumn ? 1 : 0) + (showLatestSubmitted ? 1 : 0) + 5

    if (!groups.length) {
        return (
            <EmptyState
                title={emptyTitle}
                message={emptyMessage}
                icon={emptyIcon}
            />
        )
    }

    return (
        <div className='relative overflow-x-auto'>
            <table className='w-full text-sm text-left'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>S.No</th>
                        {showTeacherColumn ? (
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teacher</th>
                        ) : null}
                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Lesson Plans</th>
                        {showLatestSubmitted ? (
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Latest Submitted</th>
                        ) : null}
                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status Summary</th>
                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map((group, index) => (
                        <tr key={group.key} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className='px-2 py-4 rounded-s-lg align-top'>{index + 1}</td>
                            {showTeacherColumn ? (
                                <td className='px-2 py-4 align-top'>
                                    <span className='block font-medium text-[#1E1E1E]'>{group.submitterName}</span>
                                    <span className='text-xs text-[#808080]'>{group.submitterRole}</span>
                                </td>
                            ) : null}
                            <td className='px-2 py-4 font-medium text-[#1E1E1E] align-top'>{group.subject}</td>
                            <td className='px-2 py-4 align-top'>
                                <span className='inline-flex min-w-8 justify-center rounded-full bg-[#515DEF]/10 px-2.5 py-1 text-sm font-semibold text-[#515DEF]'>
                                    {group.planCount}
                                </span>
                            </td>
                            {showLatestSubmitted ? (
                                <td className='px-2 py-4 whitespace-nowrap align-top text-[#1E1E1E]'>
                                    {group.latestSubmittedAt || '—'}
                                </td>
                            ) : null}
                            <td className='px-2 py-4 align-top'>
                                <GroupStatusProgress group={group} mode={statusMode} />
                            </td>
                            <td className='px-2 py-4 rounded-e-lg align-top'>
                                <NavLink
                                    to={getGroupHref(group)}
                                    className='inline-flex items-center gap-1 text-sm font-medium text-[#515DEF] hover:underline'
                                >
                                    {actionLabel}
                                    <ChevronRight size={16} />
                                </NavLink>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default LessonPlanGroupedTable
