/**
 * Compatibility shim — Super Admin Audit Reports build from live findings via liveAuditReports.js.
 */
import { AUDIT_REPORT_SECTIONS } from './liveAuditReports'

export {
    ROUTE_BASE,
    AUDIT_REPORT_SECTIONS,
    getComplianceColor,
    findingSeverityBadgeColor,
    findingStatusBadgeColor,
    complianceBadgeColor,
    buildLiveAuditReports,
    buildDepartmentRanking,
} from './liveAuditReports'

/** @deprecated Prefer buildLiveAuditReports(getFindings()) after hydrate. */
export const getComplianceScore = () => 0
export const getComplianceSummaryCards = () => []
export const getDepartmentRanking = () => []
export const getPendingFindings = () => []
export const getCriticalFindings = () => []
export const getActiveRisks = () => []
export const getOverviewSummary = () => []
export const getSectionMeta = (sectionKey) =>
    AUDIT_REPORT_SECTIONS.find((s) => s.key === sectionKey) ?? AUDIT_REPORT_SECTIONS[0]
export const getSectionSummary = () => []
export const getSectionTable = () => ({ title: '', columns: [], rows: [] })
export const getSectionTables = () => []
export const getOverviewPreviewTables = () => []
export const MONTHLY_COMPLIANCE_TREND = { labels: [], values: [] }
export const RISK_ANALYSIS_REPORT = []
export const severityBadgeColor = {}
export const riskStatusBadgeColor = {}
