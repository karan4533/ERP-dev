export const REPORT_TYPES = [
    'Ticket Resolution Report',
    'Asset Utilization Report',
    'Damaged Assets Report',
    'Renewed Licenses Report',
]

export const priorityBadgeColor = {
    Low: 'bg-[#2196F333] text-[#2196F3]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    High: 'bg-[#FF572233] text-[#FF5722]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

export const ticketStatusBadgeColor = {
    Open: 'bg-[#FF980033] text-[#FF9800]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#2196F333] text-[#2196F3]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const usageStatusBadgeColor = {
    'In Use': 'bg-[#4CAF5033] text-[#4CAF50]',
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Idle: 'bg-[#FF980033] text-[#FF9800]',
    Damaged: 'bg-[#FF572233] text-[#FF5722]',
    'Under Repair': 'bg-[#2196F333] text-[#2196F3]',
    Retired: 'bg-[#9E9E9E33] text-[#616161]',
}

export const damageStatusBadgeColor = {
    Reported: 'bg-[#FF980033] text-[#FF9800]',
    Damaged: 'bg-[#FF572233] text-[#FF5722]',
    'Under Repair': 'bg-[#2196F333] text-[#2196F3]',
    Retired: 'bg-[#9E9E9E33] text-[#616161]',
}

const parseFlexibleDate = (value) => {
    if (!value) return null
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    const raw = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        const date = new Date(`${raw.slice(0, 10)}T00:00:00`)
        return Number.isNaN(date.getTime()) ? null : date
    }
    const match = raw.match(/^(\d{2})-(\d{2})-(\d{4})/)
    if (match) {
        const date = new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00`)
        return Number.isNaN(date.getTime()) ? null : date
    }
    const fallback = new Date(raw)
    return Number.isNaN(fallback.getTime()) ? null : fallback
}

const startOfDay = (value) => {
    const date = parseFlexibleDate(value)
    if (!date) return null
    date.setHours(0, 0, 0, 0)
    return date
}

const endOfDay = (value) => {
    const date = parseFlexibleDate(value)
    if (!date) return null
    date.setHours(23, 59, 59, 999)
    return date
}

export const inDateRange = (value, fromDate, toDate) => {
    const date = parseFlexibleDate(value)
    if (!date) return true
    const from = startOfDay(fromDate)
    const to = endOfDay(toDate)
    if (from && date < from) return false
    if (to && date > to) return false
    return true
}

const formatResolutionTime = (ticket) => {
    if (!['Resolved', 'Closed'].includes(ticket.status)) return '—'
    const start = parseFlexibleDate(ticket.createdAt || ticket.createdDate)
    const end = parseFlexibleDate(ticket.updatedDate || ticket.closedAt || ticket.createdAt)
    if (!start || !end) return '—'
    const ms = Math.max(0, end.getTime() - start.getTime())
    const hours = Math.floor(ms / 3_600_000)
    const days = Math.floor(hours / 24)
    const remH = hours % 24
    if (days > 0) return `${days}d ${remH}h`
    const mins = Math.floor((ms % 3_600_000) / 60_000)
    return `${hours}h ${mins}m`
}

const usageStatus = (asset) => {
    if (asset.category === 'Software' && ['Active', 'Assigned'].includes(asset.status)) return 'Active'
    if (asset.status === 'Available') return 'Idle'
    if (['Active', 'Assigned'].includes(asset.status)) return 'In Use'
    return asset.status || 'Idle'
}

export function buildTicketResolutionReport(tickets = [], fromDate, toDate) {
    return tickets
        .filter((ticket) => inDateRange(ticket.createdDate || ticket.createdAt, fromDate, toDate))
        .map((ticket) => ({
            ticketId: ticket.ticketId,
            issueType: ticket.issueType || '—',
            priority: ticket.priority || 'Medium',
            assignedTo: ticket.assignedTo || 'Unassigned',
            resolutionTime: formatResolutionTime(ticket),
            status: ticket.status || 'Open',
        }))
}

export function buildAssetUtilizationReport(assets = []) {
    return assets.map((asset) => ({
        assetId: asset.assetId,
        assetName: asset.assetName,
        assignedTo: asset.custodian || (asset.status === 'Available' ? 'Unassigned' : 'Shared'),
        usageStatus: usageStatus(asset),
        department: asset.department || '—',
    }))
}

export function buildDamagedAssetsReport(assets = [], tickets = []) {
    return assets
        .filter((asset) => ['Damaged', 'Under Repair', 'Retired'].includes(asset.status))
        .map((asset) => {
            const related = tickets.find((ticket) => ticket.assetId === asset.assetId)
            return {
                assetId: asset.assetId,
                assetName: asset.assetName,
                damageType: related?.subject || related?.issueType || asset.status,
                reportedDate: related?.createdDate || related?.updatedDate || asset.purchaseDate || '—',
                status: asset.status,
            }
        })
}

export function buildRenewedLicensesReport(assets = []) {
    return assets
        .filter((asset) => asset.category === 'Software')
        .map((asset) => ({
            licenseName: asset.assetName || asset.model || asset.assetId,
            vendor: asset.vendorName || asset.brand || '—',
            renewalDate: asset.warrantyStartDate || asset.purchaseDate || '—',
            expiryDate: asset.warrantyExpiry || asset.warrantyEndDate || '—',
            cost: asset.purchaseCost || '—',
        }))
}
