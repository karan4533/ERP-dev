import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/JointDirectorAudit/Dashboard/Dashboard'
import AuditPlanningList from '../Pages/JointDirectorAudit/AuditPlanning/AuditPlanningList'
import AddAuditPlan from '../Pages/JointDirectorAudit/AuditPlanning/AddAuditPlan'
import ViewAuditPlan from '../Pages/JointDirectorAudit/AuditPlanning/ViewAuditPlan'
import EditAuditPlan from '../Pages/JointDirectorAudit/AuditPlanning/EditAuditPlan'
import AuditMonitoringList from '../Pages/JointDirectorAudit/AuditMonitoring/AuditMonitoringList'
import ViewAuditMonitoring from '../Pages/JointDirectorAudit/AuditMonitoring/ViewAuditMonitoring'
import FindingsComplianceList from '../Pages/JointDirectorAudit/FindingsCompliance/FindingsComplianceList'
import ViewFinding from '../Pages/JointDirectorAudit/FindingsCompliance/ViewFinding'
import ReportsAnalytics from '../Pages/JointDirectorAudit/ReportsAnalytics/ReportsAnalytics'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import ViewEmployeeProfile from '../Pages/JointDirectorAudit/EmployeeManagement/ViewEmployeeProfile'
import RequestApprovals from '../Pages/JointDirectorAudit/RequestApprovals/RequestApprovals'
import ViewRequestApproval from '../Pages/JointDirectorAudit/RequestApprovals/ViewRequestApproval'
import Escalations from '../Pages/JointDirectorAudit/Escalations/Escalations'
import ViewEscalation from '../Pages/JointDirectorAudit/Escalations/ViewEscalation'
import MeetingsCalendar from '../Pages/JointDirectorAudit/MeetingsCalendar/MeetingsCalendar'
import AnnouncementList from '../Pages/JointDirectorAudit/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/JointDirectorAudit/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/JointDirectorAudit/Announcement/ViewAnnouncement'
import AssignAudits from '../Pages/JointDirectorAudit/AuditAssignment/AssignAudits'
import AssignmentHistory from '../Pages/JointDirectorAudit/AuditAssignment/AssignmentHistory'
import WorkloadOverview from '../Pages/JointDirectorAudit/AuditAssignment/WorkloadOverview'
import ReassignAudit from '../Pages/JointDirectorAudit/AuditAssignment/ReassignAudit'
import AuditConfigurationPage from '../Pages/JointDirectorAudit/AuditConfiguration/AuditConfigurationPage'
import AuditTemplatesList from '../Pages/JointDirectorAudit/AuditConfiguration/AuditTemplates/AuditTemplatesList'
import ChecklistSectionsList from '../Pages/JointDirectorAudit/AuditConfiguration/ChecklistSections/ChecklistSectionsList'
import QuestionBankList from '../Pages/JointDirectorAudit/AuditConfiguration/QuestionBank/QuestionBankList'
import ResponseTypesList from '../Pages/JointDirectorAudit/AuditConfiguration/ResponseTypes/ResponseTypesList'
import ScoringRulesList from '../Pages/JointDirectorAudit/AuditConfiguration/ScoringRules/ScoringRulesList'
import WorkflowRulesList from '../Pages/JointDirectorAudit/AuditConfiguration/WorkflowRules/WorkflowRulesList'
import VisibilityRulesList from '../Pages/JointDirectorAudit/AuditConfiguration/VisibilityRules/VisibilityRulesList'
import TemplateVersioningList from '../Pages/JointDirectorAudit/AuditConfiguration/TemplateVersioning/TemplateVersioningList'
import PublishTemplatesList from '../Pages/JointDirectorAudit/AuditConfiguration/PublishTemplates/PublishTemplatesList'
import { DEFAULT_AUDIT_CONFIG_PAGE } from '../Pages/JointDirectorAudit/AuditConfiguration/auditConfigurationData'

const JointDirectorAuditRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/joint-director-audit/dashboard" element={<Dashboard />} />
            <Route path="/joint-director-audit/audit-configuration/audit-templates" element={<AuditTemplatesList />} />
            <Route path="/joint-director-audit/audit-configuration/checklist-sections" element={<ChecklistSectionsList />} />
            <Route path="/joint-director-audit/audit-configuration/question-bank" element={<QuestionBankList />} />
            <Route path="/joint-director-audit/audit-configuration/response-types" element={<ResponseTypesList />} />
            <Route path="/joint-director-audit/audit-configuration/scoring-rules" element={<ScoringRulesList />} />
            <Route path="/joint-director-audit/audit-configuration/workflow-rules" element={<WorkflowRulesList />} />
            <Route path="/joint-director-audit/audit-configuration/visibility-rules" element={<VisibilityRulesList />} />
            <Route path="/joint-director-audit/audit-configuration/template-versioning" element={<TemplateVersioningList />} />
            <Route path="/joint-director-audit/audit-configuration/publish-templates" element={<PublishTemplatesList />} />
            <Route path="/joint-director-audit/audit-configuration/:pageKey" element={<AuditConfigurationPage />} />
            <Route path="/joint-director-audit/audit-configuration" element={<Navigate to={`/joint-director-audit/audit-configuration/${DEFAULT_AUDIT_CONFIG_PAGE}`} replace />} />
            <Route path="/joint-director-audit/audit-assignment/assign-audits" element={<AssignAudits />} />
            <Route path="/joint-director-audit/audit-assignment/assignment-history" element={<AssignmentHistory />} />
            <Route path="/joint-director-audit/audit-assignment/workload-overview" element={<WorkloadOverview />} />
            <Route path="/joint-director-audit/audit-assignment/reassign-audit" element={<ReassignAudit />} />
            <Route path="/joint-director-audit/audit-assignment" element={<Navigate to="/joint-director-audit/audit-assignment/assign-audits" replace />} />
            <Route path="/joint-director-audit/audit-planning" element={<AuditPlanningList />} />
            <Route path="/joint-director-audit/audit-planning/add-audit-plan" element={<AddAuditPlan />} />
            <Route path="/joint-director-audit/audit-planning/view/:id" element={<ViewAuditPlan />} />
            <Route path="/joint-director-audit/audit-planning/edit/:id" element={<EditAuditPlan />} />
            <Route path="/joint-director-audit/audit-monitoring" element={<AuditMonitoringList />} />
            <Route path="/joint-director-audit/audit-monitoring/view/:id" element={<ViewAuditMonitoring />} />
            <Route path="/joint-director-audit/findings-compliance" element={<FindingsComplianceList />} />
            <Route path="/joint-director-audit/findings-compliance/view/:id" element={<ViewFinding />} />
            <Route path="/joint-director-audit/reports-analytics" element={<ReportsAnalytics />} />
            {TaskManagementRoutes({ basePath: '/joint-director-audit' })}
            <Route path="/joint-director-audit/employee-management/:roleKey" element={<ViewEmployeeProfile />} />
            <Route path="/joint-director-audit/employee-management" element={<Navigate to="/joint-director-audit/employee-management/hr-manager" replace />} />
            <Route path="/joint-director-audit/request-approvals" element={<RequestApprovals />} />
            <Route path="/joint-director-audit/request-approvals/view-request" element={<ViewRequestApproval />} />
            <Route path="/joint-director-audit/escalations" element={<Escalations />} />
            <Route path="/joint-director-audit/escalations/view-escalation/:id" element={<ViewEscalation />} />
            <Route path="/joint-director-audit/meetings-calendar" element={<MeetingsCalendar />} />
            <Route path="/joint-director-audit/broadcast" element={<AnnouncementList />} />
            <Route path="/joint-director-audit/broadcast/add-broadcast" element={<AddAnnouncement />} />
            <Route path="/joint-director-audit/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="*" element={<Navigate to="/joint-director-audit/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default JointDirectorAuditRoutes
