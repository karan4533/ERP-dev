import React from 'react'
import { approvalStatusColor, trackStatusColor } from '../lessonPlanApprovalData'

const doneBadgeClass = 'bg-[#4CAF5033] text-[#4CAF50]'

const StatusBadge = ({ status, type = 'approval' }) => {
    if (!status) return null

    const className =
        type === 'approval'
            ? approvalStatusColor[status]
            : type === 'track'
              ? trackStatusColor[status]
              : type === 'done'
                ? doneBadgeClass
                : 'bg-[#66708533] text-[#667085]'

    if (!className) return null

    return (
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${className}`}>
            {status}
        </span>
    )
}

export default StatusBadge
