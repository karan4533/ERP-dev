const GOOD = ['active', 'completed', 'approved', 'cleared', 'closed', 'normal', 'accepted', 'demo_sent', 'resolved', 'minor_approved', 'po_approved']
const BAD = ['rejected', 'overdue', 'critical', 'declined', 'bounced', 'over_capacity', 'failed', 'low']
const MID = ['pending', 'in progress', 'under review', 'near_capacity', 'escalated', 'quotation_pending', 'department_review', 'po_required', 'po_raised', 'draft', 'queued']

export function statusClass(status) {
    const value = String(status || '').trim().toLowerCase().replace(/\s+/g, ' ')
    if (value.includes('above average')) return 'bg-[#4CAF5033] text-[#4CAF50]'
    if (value === 'average') return 'bg-[#FF980033] text-[#FF9800]'
    if (value.includes('below average')) return 'bg-[#FF572233] text-[#FF5722]'
    if (GOOD.some((item) => value === item || value.includes(item))) return 'bg-[#4CAF5033] text-[#4CAF50]'
    if (BAD.some((item) => value === item || value.includes(item))) return 'bg-[#FF000033] text-[#FF0000]'
    if (MID.some((item) => value === item || value.includes(item))) return 'bg-[#FF980033] text-[#FF9800]'
    return 'bg-[#2196F333] text-[#2196F3]'
}
