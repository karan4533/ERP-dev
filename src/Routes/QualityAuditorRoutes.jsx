import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/QualityAuditor/Dashboard/Dashboard'
import MyAudits from '../Pages/QualityAuditor/AuditManagement/MyAudits/MyAudits'
import ViewMyAudit from '../Pages/QualityAuditor/AuditManagement/MyAudits/ViewMyAudit'
import AuditSchedule from '../Pages/QualityAuditor/AuditManagement/AuditSchedule/AuditSchedule'
import ExecuteAudit from '../Pages/QualityAuditor/AuditManagement/ExecuteAudit/ExecuteAudit'
import AuditHistory from '../Pages/QualityAuditor/AuditManagement/AuditHistory/AuditHistory'
import OpenObservations from '../Pages/QualityAuditor/Observations/OpenObservations'
import ClosedObservations from '../Pages/QualityAuditor/Observations/ClosedObservations'
import CreateObservation from '../Pages/QualityAuditor/Observations/CreateObservation'
import ViewObservation from '../Pages/QualityAuditor/Observations/ViewObservation'
import Escalations from '../Pages/QualityAuditor/CorrectiveActions/Escalations/Escalations'
import CreateEscalation from '../Pages/QualityAuditor/CorrectiveActions/Escalations/CreateEscalation'
import ViewEscalation from '../Pages/QualityAuditor/CorrectiveActions/Escalations/ViewEscalation'
import RootCauseAnalysis from '../Pages/QualityAuditor/CorrectiveActions/RootCauseAnalysis/RootCauseAnalysis'
import ViewRca from '../Pages/QualityAuditor/CorrectiveActions/RootCauseAnalysis/ViewRca'
import ActionTakenReports from '../Pages/QualityAuditor/CorrectiveActions/ActionTakenReports/ActionTakenReports'
import ViewAtr from '../Pages/QualityAuditor/CorrectiveActions/ActionTakenReports/ViewAtr'
import AuditReports from '../Pages/QualityAuditor/Reports/AuditReports/AuditReports'
import ViewAuditReport from '../Pages/QualityAuditor/Reports/AuditReports/ViewAuditReport'
import ObservationReports from '../Pages/QualityAuditor/Reports/ObservationReports/ObservationReports'
import ViewObservationReport from '../Pages/QualityAuditor/Reports/ObservationReports/ViewObservationReport'
import ComplianceReports from '../Pages/QualityAuditor/Reports/ComplianceReports/ComplianceReports'
import PendingActionsReport from '../Pages/QualityAuditor/Reports/ActionsReports/PendingActionsReport'
import ClosedActionsReport from '../Pages/QualityAuditor/Reports/ActionsReports/ClosedActionsReport'
import { AuditComponentsPage, SharedDeviationsPage } from '../Common/demoDomain/WorkflowScreens'

const Placeholder = ({ title }) => (
    <div className='bg-white rounded-2xl shadow-md p-8 text-center'>
        <h2 className='text-xl font-semibold text-black'>{title}</h2>
        <p className='text-sm text-[#667085] mt-2'>This page will be implemented next.</p>
    </div>
)

const QualityAuditorRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/quality-auditor/dashboard" element={<Dashboard />} />

            <Route path="/quality-auditor/audit-management/my-audits" element={<MyAudits />} />
            <Route path="/quality-auditor/audit-management/my-audits/view/:id" element={<ViewMyAudit />} />
            <Route path="/quality-auditor/audit-management/audit-schedule" element={<AuditSchedule />} />
            <Route path="/quality-auditor/audit-management/execute-audit" element={<ExecuteAudit />} />
            <Route path="/quality-auditor/audit-management/audit-history" element={<AuditHistory />} />

            <Route path="/quality-auditor/observations/open" element={<OpenObservations />} />
            <Route path="/quality-auditor/observations/closed" element={<ClosedObservations />} />
            <Route path="/quality-auditor/observations/create" element={<CreateObservation />} />
            <Route path="/quality-auditor/observations/view/:id" element={<ViewObservation />} />

            <Route path="/quality-auditor/corrective-actions/escalations" element={<Escalations />} />
            <Route path="/quality-auditor/corrective-actions/escalations/create" element={<CreateEscalation />} />
            <Route path="/quality-auditor/corrective-actions/escalations/view/:id" element={<ViewEscalation />} />
            <Route path="/quality-auditor/corrective-actions/root-cause-analysis" element={<RootCauseAnalysis />} />
            <Route path="/quality-auditor/corrective-actions/root-cause-analysis/view/:id" element={<ViewRca />} />
            <Route path="/quality-auditor/corrective-actions/action-taken-reports" element={<ActionTakenReports />} />
            <Route path="/quality-auditor/corrective-actions/action-taken-reports/view/:id" element={<ViewAtr />} />

            <Route path="/quality-auditor/reports/audit-reports" element={<AuditReports />} />
            <Route path="/quality-auditor/reports/audit-reports/view/:id" element={<ViewAuditReport />} />
            <Route path="/quality-auditor/reports/observation-reports" element={<ObservationReports />} />
            <Route path="/quality-auditor/reports/observation-reports/view/:id" element={<ViewObservationReport />} />
            <Route path="/quality-auditor/reports/compliance-reports" element={<ComplianceReports />} />
            <Route path="/quality-auditor/reports/pending-actions" element={<PendingActionsReport />} />
            <Route path="/quality-auditor/reports/closed-actions" element={<ClosedActionsReport />} />
            <Route path="/quality-auditor/reports" element={<Navigate to="/quality-auditor/reports/audit-reports" replace />} />
            <Route path="/quality-auditor/communication" element={<Placeholder title="Communication" />} />
            <Route path="/quality-auditor/components" element={<AuditComponentsPage />} />
            <Route path="/quality-auditor/shared-deviations" element={<SharedDeviationsPage />} />

            <Route path="*" element={<Navigate to="/quality-auditor/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default QualityAuditorRoutes
