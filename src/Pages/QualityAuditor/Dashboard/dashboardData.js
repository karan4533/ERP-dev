import { getMyAudits, hydrateFromApi as hydrateMyAudits } from '../AuditManagement/MyAudits/myAuditsData'
import { getAuditHistory, hydrateFromApi as hydrateAuditHistory } from '../AuditManagement/AuditHistory/auditHistoryData'
import { getObservations, getOpenObservations, hydrateFromApi as hydrateObservations } from '../Observations/observationsData'
import { getEscalations, hydrateFromApi as hydrateEscalations } from '../CorrectiveActions/Escalations/escalationsData'
import { getComplianceData, hydrateFromApi as hydrateCompliance } from '../Reports/ComplianceReports/complianceReportsData'
import { buildAuditorKpiCards, emptyKpiCards } from '../../../Common/auditDomain/auditorDashboardKpis'
import {
    buildAuditorDashboardPanels,
    emptyAuditorDashboardPanels,
} from '../../../Common/auditDomain/auditorDashboardPanels'

export const buildLiveKpiCards = () =>
    buildAuditorKpiCards({
        audits: getMyAudits(),
        observations: getObservations(),
        openObservations: getOpenObservations(),
        escalations: getEscalations(),
        compliance: getComplianceData(),
        history: getAuditHistory(),
    })

export const buildLiveDashboardPanels = () =>
    buildAuditorDashboardPanels({
        audits: getMyAudits(),
        observations: getObservations(),
        escalations: getEscalations(),
        compliance: getComplianceData(),
        history: getAuditHistory(),
    })

export const hydrateAuditorDashboardFromApi = async () => {
    await Promise.all([
        hydrateMyAudits([]),
        hydrateAuditHistory([]),
        hydrateObservations([]),
        hydrateEscalations([]),
        hydrateCompliance([]),
    ])
    return {
        kpiCards: buildLiveKpiCards(),
        panels: buildLiveDashboardPanels(),
    }
}

/** Live counts from campus-audit collections (zeros until hydrate). */
export const KPI_CARDS = emptyKpiCards()

const EMPTY_PANELS = emptyAuditorDashboardPanels()

/** Empty/zero placeholders until hydrateAuditorDashboardFromApi fills live values. */
export const MONTHLY_COMPLIANCE_TREND = EMPTY_PANELS.monthlyComplianceTrend
export const DEPARTMENT_COMPLIANCE = EMPTY_PANELS.departmentCompliance
export const OBSERVATION_STATUS = EMPTY_PANELS.observationStatus
export const AUDIT_COMPLETION = EMPTY_PANELS.auditCompletion
export const UPCOMING_AUDITS_CALENDAR = EMPTY_PANELS.upcomingAuditsCalendar
export const RECENT_ACTIVITY = EMPTY_PANELS.recentActivity

export const activityTypeBadgeColor = {
    'Audit Submitted': 'bg-[#515DEF33] text-[#515DEF]',
    'Observation Raised': 'bg-[#FF980033] text-[#FF9800]',
    'RCA Received': 'bg-[#2196F333] text-[#2196F3]',
    'ATR Approved': 'bg-[#4CAF5033] text-[#4CAF50]',
    'Escalation Closed': 'bg-[#9C27B033] text-[#9C27B0]',
}

export const CHART_COLORS = {
    primary: '#515DEF',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#FF5722',
    info: '#2196F3',
    purple: '#9C27B0',
    pie: ['#515DEF', '#FF9800', '#2196F3', '#9C27B0', '#4CAF50'],
}
