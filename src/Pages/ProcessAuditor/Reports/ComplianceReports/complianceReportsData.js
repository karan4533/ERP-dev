import { getCampusLoadState, hydrateCampusKey, loadCampusJson } from '../../../../services/campusJsonStore'
import { normalizeDraftList } from '../../../../Common/auditDomain/executeAuditDraftStore'
import { buildComplianceReport } from '../../../../Common/auditDomain/complianceFromAudits'
import { getScoreResult } from '../../AuditManagement/ExecuteAudit/executeAuditData'
import { getObservations, hydrateFromApi as hydrateObservations } from '../../Observations/observationsData'
import { getAuditSchedules, hydrateFromApi as hydrateSchedules } from '../../AuditManagement/AuditSchedule/auditScheduleData'

const DRAFT_KEY = 'process-auditor-execute-audit-draft'
const SOURCE_KEYS = [DRAFT_KEY, 'process-auditor-observations', 'process-auditor-audit-schedule']

export const getComplianceColor = (value) => {
    if (value == null) return '#667085'
    if (value >= 90) return '#4CAF50'
    if (value >= 75) return '#FF9800'
    return '#FF0000'
}

/** Loads the source collections; resolves to an error message ('' when every source loaded). */
export const hydrateComplianceSources = async () => {
    await Promise.all([hydrateCampusKey(DRAFT_KEY), hydrateObservations(), hydrateSchedules()])
    const failed = SOURCE_KEYS.map(getCampusLoadState).find((state) => state.api && state.status === 'failed')
    return failed ? failed.error || 'Could not load audit records.' : ''
}

export const getComplianceSources = () => ({
    drafts: normalizeDraftList(loadCampusJson(DRAFT_KEY, [])),
    observations: getObservations(),
    schedules: getAuditSchedules().filter((item) => !item.parentScheduleId),
})

export const computeCompliance = (sources, filters) =>
    buildComplianceReport({ ...sources, filters, scoreResult: getScoreResult })

/** Dashboard shape `{ summary: { overall, departments }, departments }` from the computed report. */
export const getComplianceData = () => {
    const report = computeCompliance(getComplianceSources(), {})
    const scored = report.departments.filter((row) => row.compliance != null)
    return {
        summary: {
            overall: report.totals.overall ?? 0,
            departments: scored.slice(0, 4).map((row) => ({ label: row.department, value: row.compliance })),
        },
        departments: scored,
    }
}

export const hydrateFromApi = () => hydrateComplianceSources()
