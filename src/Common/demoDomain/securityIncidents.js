import { ensureSeed, saveJson } from './storage'

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
    },
]

export const getIncidents = () => ensureSeed(INCIDENT_KEY, SEED)

export const getIncidentById = (id) => getIncidents().find((item) => item.id === id) ?? null

export const addIncident = (payload) => {
    const rows = getIncidents()
    const record = {
        id: payload.id?.trim() || `REP-${Date.now()}`,
        incidentType: payload.incidentType,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        description: payload.description,
        reportTo: payload.reportTo,
        reportedBy: 'CSO / Gate Keeper',
        priority: payload.priority || 'Medium',
        status: 'Open',
    }
    saveJson(INCIDENT_KEY, [record, ...rows.filter((item) => item.id !== record.id)])
    return record
}
