import { ensureSeed, saveJson } from './storage'
import { getIncidentDueAt, getIncidentSlaHours } from '../operations/incidentState'

export const INCIDENT_KEY = 'schoolerp-security-incidents-v1'

const SEED = [
    {
        id: 'REP001',
        incidentType: 'Unauthorized Entry Attempt',
        date: '05-08-2025',
        time: '10:20',
        location: 'Main Gate',
        description: 'Visitor attempted entry without approval.',
        reportTo: 'Suresh Kumar',
        reportedBy: 'CSO / Gate Keeper',
        priority: 'High',
        status: 'Open',
        assignedTo: 'Suresh Kumar',
    },
]

const incidentTimestamp = (incident) => {
    if (incident.createdAt) return incident.createdAt
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(incident.date || '')
        ? incident.date
        : (incident.date || '').replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$3-$2-$1')
    const parsed = new Date(`${isoDate}T${incident.time || '00:00'}:00`)
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

const normalizeIncident = (incident) => {
    const createdAt = incidentTimestamp(incident)
    const priority = incident.priority || 'Medium'
    return {
        ...incident,
        priority,
        status: incident.status || 'Open',
        assignedTo: incident.assignedTo || incident.reportTo || 'Gate Keeper Manager',
        slaHours: incident.slaHours || getIncidentSlaHours(priority),
        createdAt,
        dueAt: incident.dueAt || getIncidentDueAt(createdAt, priority),
        history: Array.isArray(incident.history) && incident.history.length
            ? incident.history
            : [{ at: createdAt, actor: incident.reportedBy || 'CSO / Gate Keeper', status: incident.status || 'Open', note: 'Incident reported' }],
    }
}

export const getIncidents = () => ensureSeed(INCIDENT_KEY, SEED).map(normalizeIncident)

export const getIncidentById = (id) => getIncidents().find((item) => item.id === id) ?? null

export const addIncident = (payload) => {
    const rows = getIncidents()
    const createdAt = incidentTimestamp(payload)
    const baseRecord = {
        id: payload.id?.trim() || `REP-${Date.now()}`,
        incidentType: payload.incidentType,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        description: payload.description,
        reportTo: payload.reportTo,
        reportedBy: payload.reportedBy || 'CSO / Gate Keeper',
        priority: payload.priority || 'Medium',
        status: 'Open',
        assignedTo: payload.assignedTo || payload.reportTo || 'Gate Keeper Manager',
        createdAt,
    }
    const record = normalizeIncident(baseRecord)
    saveJson(INCIDENT_KEY, [record, ...rows.filter((item) => item.id !== record.id)])
    return record
}

export const updateIncident = (id, patch, actor = 'Gate Keeper Manager', note = 'Incident updated') => {
    const rows = getIncidents()
    let updated = null
    const next = rows.map((incident) => {
        if (incident.id !== id) return incident
        updated = normalizeIncident({
            ...incident,
            ...patch,
            history: [
                ...incident.history,
                {
                    at: new Date().toISOString(),
                    actor,
                    status: patch.status || incident.status,
                    note,
                },
            ],
        })
        return updated
    })
    if (updated) saveJson(INCIDENT_KEY, next)
    return updated
}
