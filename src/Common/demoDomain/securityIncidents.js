/**
 * Gate incidents — shared by Gate Keeper + Gate Keeper Manager.
 * API: /api/v1/ops/gate-incidents
 */
import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../services/campusJsonStore'

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

const seedFor = () => (usesCampusApiForKey(INCIDENT_KEY) ? [] : SEED)

export const getIncidents = () => ensureCampusSeed(INCIDENT_KEY, seedFor())

export const getIncidentById = (id) => getIncidents().find((item) => item.id === id) ?? null

export function hydrateIncidentsFromApi() {
    if (!usesCampusApiForKey(INCIDENT_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(INCIDENT_KEY, [])
}

export const addIncident = async (payload) => {
    const rows = getIncidents()
    const record = {
        id: payload.id?.trim() || `REP-${Date.now()}`,
        incidentType: payload.incidentType,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        description: payload.description,
        reportTo: payload.reportTo,
        reportedBy: payload.reportedBy || 'CSO / Gate Keeper',
        priority: payload.priority || 'Medium',
        status: payload.status || 'Open',
    }
    const next = [record, ...rows.filter((item) => item.id !== record.id)]
    const result = await persistCampusJson(INCIDENT_KEY, next)
    if (result?.success === false) {
        return { success: false, message: result.message, record }
    }
    return { success: true, record }
}
