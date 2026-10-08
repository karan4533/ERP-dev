export const hrBadge = (status) => {
    const key = String(status || '').toLowerCase()
    if (['active', 'approved', 'completed', 'paid', 'accepted', 'verified', 'eligible', 'present', 'finalized', 'applied'].includes(key)) {
        return 'bg-[#4CAF5033] text-[#4CAF50]'
    }
    if (['pending', 'submitted', 'hr_review', 'finance_review', 'jd_review', 'director_review', 'md_review', 'in progress', 'in_progress', 'probation', 'on leave', 'on hold', 'recommended', 'scheduled', 'draft', 'initiated', 'pending clearance'].includes(key)) {
        return 'bg-[#FF980033] text-[#FF9800]'
    }
    if (['rejected', 'inactive', 'absent', 'expired', 'cancelled', 'blocked', 'failed', 'no show'].includes(key)) {
        return 'bg-[#FF000033] text-[#FF0000]'
    }
    if (['high priority'].includes(key)) return 'bg-[#FDECEC] text-[#B42318]'
    if (['attention'].includes(key)) return 'bg-[#FFFAEB] text-[#B54708]'
    if (['stable', 'normal'].includes(key)) return 'bg-[#ECFDF3] text-[#027A48]'
    if (['open', 'issued', 'selected', 'next round', 'demo_sent'].includes(key)) {
        return 'bg-[#2196F333] text-[#2196F3]'
    }
    return 'bg-[#515DEF33] text-[#515DEF]'
}

export const LOCKED_STATUSES = ['APPROVED', 'FINALIZED', 'ISSUED', 'ACCEPTED', 'APPLIED', 'PAID', 'CLOSED']

export const isLockedStatus = (status) => LOCKED_STATUSES.includes(String(status || '').toUpperCase())

export const EMPLOYEE_CATEGORIES = [
    'Academics', 'Admin', 'Driver', 'Conductor', 'Security', 'Housekeeping', 'Hostel', 'ECA',
    'Part Time Academics', 'Part Time Admin', 'Relieved', 'Other',
]

export const DEPARTMENTS = ['Academic', 'Administration', 'Finance', 'HR', 'IT Support', 'Transport', 'Housekeeping', 'Security', 'Hostel']

export const EMPLOYEE_STATUSES = ['Active', 'On Leave', 'Probation', 'Inactive', 'Relieved', 'Terminated']
