import React from 'react'
import { approvalStatusBarColor, markAsDoneBarColor } from '../lessonPlanApprovalData'

const LegendItem = ({ color, label, count }) => {
    if (!count) return null
    return (
        <span className='inline-flex items-center gap-1.5 text-xs text-[#667085]'>
            <span className='size-2 rounded-full shrink-0' style={{ backgroundColor: color }} />
            <span>{label}</span>
            <span className='font-semibold text-[#1E1E1E]'>{count}</span>
        </span>
    )
}

const GroupStatusProgress = ({ group, mode = 'approval' }) => {
    if (mode === 'mark-as-done') {
        const { doneCount, pendingCount, total } = group.markAsDoneSummary
        if (!total) return <span className='text-xs text-[#667085]'>—</span>

        const segments = [
            { key: 'Done', count: doneCount, color: markAsDoneBarColor.Done },
            { key: 'Pending', count: pendingCount, color: markAsDoneBarColor.Pending },
        ].filter((item) => item.count > 0)

        return (
            <div className='space-y-2 min-w-[140px]'>
                <div className='flex h-2 w-full overflow-hidden rounded-full bg-[#EDEEF5]'>
                    {segments.map((segment) => (
                        <div
                            key={segment.key}
                            style={{
                                width: `${(segment.count / total) * 100}%`,
                                backgroundColor: segment.color,
                            }}
                            title={`${segment.key}: ${segment.count}`}
                        />
                    ))}
                </div>
                <div className='flex flex-wrap gap-x-3 gap-y-1'>
                    <LegendItem color={markAsDoneBarColor.Done} label='Done' count={doneCount} />
                    <LegendItem color={markAsDoneBarColor.Pending} label='Pending' count={pendingCount} />
                </div>
            </div>
        )
    }

    const { counts } = group.approvalSummary
    const total = counts.Pending + counts.Approved + counts.Rejected
    if (!total) return <span className='text-xs text-[#667085]'>—</span>

    const segments = [
        { key: 'Pending', count: counts.Pending, color: approvalStatusBarColor.Pending },
        { key: 'Approved', count: counts.Approved, color: approvalStatusBarColor.Approved },
        { key: 'Rejected', count: counts.Rejected, color: approvalStatusBarColor.Rejected },
    ].filter((item) => item.count > 0)

    return (
        <div className='space-y-2 min-w-[140px]'>
            <div className='flex h-2 w-full overflow-hidden rounded-full bg-[#EDEEF5]'>
                {segments.map((segment) => (
                    <div
                        key={segment.key}
                        style={{
                            width: `${(segment.count / total) * 100}%`,
                            backgroundColor: segment.color,
                        }}
                        title={`${segment.key}: ${segment.count}`}
                    />
                ))}
            </div>
            <div className='flex flex-wrap gap-x-3 gap-y-1'>
                <LegendItem color={approvalStatusBarColor.Pending} label='Pending' count={counts.Pending} />
                <LegendItem color={approvalStatusBarColor.Approved} label='Approved' count={counts.Approved} />
                <LegendItem color={approvalStatusBarColor.Rejected} label='Rejected' count={counts.Rejected} />
            </div>
        </div>
    )
}

export default GroupStatusProgress
