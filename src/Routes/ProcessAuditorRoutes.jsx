import React from 'react'
import { staffCommonRoutes } from '../Common/staffCommonRoutes'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/ProcessAuditor/Dashboard/Dashboard'
import MyAudits from '../Pages/ProcessAuditor/AuditManagement/MyAudits/MyAudits'
import ViewMyAudit from '../Pages/ProcessAuditor/AuditManagement/MyAudits/ViewMyAudit'
import AuditSchedule from '../Pages/ProcessAuditor/AuditManagement/AuditSchedule/AuditSchedule'
import ExecuteAudit from '../Pages/ProcessAuditor/AuditManagement/ExecuteAudit/ExecuteAudit'
import AuditHistory from '../Pages/ProcessAuditor/AuditManagement/AuditHistory/AuditHistory'
import OpenObservations from '../Pages/ProcessAuditor/Observations/OpenObservations'
import ClosedObservations from '../Pages/ProcessAuditor/Observations/ClosedObservations'
import CreateObservation from '../Pages/ProcessAuditor/Observations/CreateObservation'
import ViewObservation from '../Pages/ProcessAuditor/Observations/ViewObservation'
import Escalations from '../Pages/ProcessAuditor/CorrectiveActions/Escalations/Escalations'
import CreateEscalation from '../Pages/ProcessAuditor/CorrectiveActions/Escalations/CreateEscalation'
import ViewEscalation from '../Pages/ProcessAuditor/CorrectiveActions/Escalations/ViewEscalation'
import RootCauseAnalysis from '../Pages/ProcessAuditor/CorrectiveActions/RootCauseAnalysis/RootCauseAnalysis'
import ViewRca from '../Pages/ProcessAuditor/CorrectiveActions/RootCauseAnalysis/ViewRca'
import ActionTakenReports from '../Pages/ProcessAuditor/CorrectiveActions/ActionTakenReports/ActionTakenReports'
import ViewAtr from '../Pages/ProcessAuditor/CorrectiveActions/ActionTakenReports/ViewAtr'
import AuditReports from '../Pages/ProcessAuditor/Reports/AuditReports/AuditReports'
import ViewAuditReport from '../Pages/ProcessAuditor/Reports/AuditReports/ViewAuditReport'
import ObservationReports from '../Pages/ProcessAuditor/Reports/ObservationReports/ObservationReports'
import ViewObservationReport from '../Pages/ProcessAuditor/Reports/ObservationReports/ViewObservationReport'
import ComplianceReports from '../Pages/ProcessAuditor/Reports/ComplianceReports/ComplianceReports'
import PendingActionsReport from '../Pages/ProcessAuditor/Reports/ActionsReports/PendingActionsReport'
import ClosedActionsReport from '../Pages/ProcessAuditor/Reports/ActionsReports/ClosedActionsReport'
import { AuditComponentsPage, SharedDeviationsPage } from '../Common/demoDomain/WorkflowScreens'
import CommunicationPage from '../Common/Communication/CommunicationPage'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'

const ProcessAuditorRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/process-auditor/dashboard" element={<Dashboard />} />
            {TaskManagementRoutes({ basePath: '/process-auditor' })}

            <Route path="/process-auditor/audit-management/my-audits" element={<MyAudits />} />
            <Route path="/process-auditor/audit-management/my-audits/view/:id" element={<ViewMyAudit />} />
            <Route path="/process-auditor/audit-management/audit-schedule" element={<AuditSchedule />} />
            <Route path="/process-auditor/audit-management/execute-audit" element={<ExecuteAudit />} />
            <Route path="/process-auditor/audit-management/audit-history" element={<AuditHistory />} />

            <Route path="/process-auditor/observations/open" element={<OpenObservations />} />
            <Route path="/process-auditor/observations/closed" element={<ClosedObservations />} />
            <Route path="/process-auditor/observations/create" element={<CreateObservation />} />
            <Route path="/process-auditor/observations/view/:id" element={<ViewObservation />} />

            <Route path="/process-auditor/corrective-actions/escalations" element={<Escalations />} />
            <Route path="/process-auditor/corrective-actions/escalations/create" element={<CreateEscalation />} />
            <Route path="/process-auditor/corrective-actions/escalations/view/:id" element={<ViewEscalation />} />
            <Route path="/process-auditor/corrective-actions/root-cause-analysis" element={<RootCauseAnalysis />} />
            <Route path="/process-auditor/corrective-actions/root-cause-analysis/view/:id" element={<ViewRca />} />
            <Route path="/process-auditor/corrective-actions/action-taken-reports" element={<ActionTakenReports />} />
            <Route path="/process-auditor/corrective-actions/action-taken-reports/view/:id" element={<ViewAtr />} />

            <Route path="/process-auditor/reports/audit-reports" element={<AuditReports />} />
            <Route path="/process-auditor/reports/audit-reports/view/:id" element={<ViewAuditReport />} />
            <Route path="/process-auditor/reports/observation-reports" element={<ObservationReports />} />
            <Route path="/process-auditor/reports/observation-reports/view/:id" element={<ViewObservationReport />} />
            <Route path="/process-auditor/reports/compliance-reports" element={<ComplianceReports />} />
            <Route path="/process-auditor/reports/pending-actions" element={<PendingActionsReport />} />
            <Route path="/process-auditor/reports/closed-actions" element={<ClosedActionsReport />} />
            <Route path="/process-auditor/reports" element={<Navigate to="/process-auditor/reports/audit-reports" replace />} />
            <Route path="/process-auditor/communication" element={<Navigate to="/process-auditor/communication/inbox" replace />} />
            <Route path="/process-auditor/communication/inbox" element={<CommunicationPage roleKey="processAuditor" />} />
            <Route path="/process-auditor/communication/inbox/:conversationId" element={<CommunicationPage roleKey="processAuditor" />} />
            <Route path="/process-auditor/components" element={<AuditComponentsPage />} />
            <Route path="/process-auditor/shared-deviations" element={<SharedDeviationsPage />} />

            <Route path="*" element={<Navigate to="/process-auditor/dashboard" replace />} />
            {staffCommonRoutes('/process-auditor', 'processAuditor', 'Process Auditor', { communication: false, leaveKey: 'processauditor' })}
        </ReactRoutes>
    )
}

export default ProcessAuditorRoutes
