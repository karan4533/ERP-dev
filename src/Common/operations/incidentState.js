const SLA_HOURS = {
    Critical: 1,
    High: 2,
    Medium: 8,
    Low: 24,
}

const STATUS_FLOW = ['Open', 'Acknowledged', 'Investigating', 'Resolved']

export const getIncidentSlaHours = (priority) => SLA_HOURS[priority] || SLA_HOURS.Medium

export const deriveIncidentSla = (incident, now = new Date()) => {
    if (['Resolved', 'Closed'].includes(incident.status)) return 'Resolved'
    if (!incident.dueAt) return 'Not set'
    const dueAt = new Date(incident.dueAt)
    if (Number.isNaN(dueAt.getTime())) return 'Not set'
    const remaining = dueAt.getTime() - now.getTime()
    if (remaining < 0) return 'Breached'
    if (remaining <= 60 * 60 * 1000) return 'At risk'
    return 'On track'
}

export const getNextIncidentStatus = (status) => {
    const index = STATUS_FLOW.indexOf(status)
    if (index < 0) return STATUS_FLOW[0]
    return STATUS_FLOW[Math.min(index + 1, STATUS_FLOW.length - 1)]
}

export const getIncidentDueAt = (createdAt, priority) => {
    const start = new Date(createdAt)
    if (Number.isNaN(start.getTime())) return ''
    return new Date(start.getTime() + getIncidentSlaHours(priority) * 60 * 60 * 1000).toISOString()
}
