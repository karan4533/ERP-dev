import React from 'react'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import Dashboard from '../Pages/SuperAdmin/Dashboard/Dashboard'
import AnnouncementList from '../Pages/SuperAdmin/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/SuperAdmin/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/SuperAdmin/Announcement/ViewAnnouncement'
import ReceivedLeaveRequests from '../Pages/SuperAdmin/LeaveRequest/ReceivedLeaveRequests'
import ViewReceivedLeaveRequest from '../Pages/SuperAdmin/LeaveRequest/ViewReceivedLeaveRequest'
import CommunicationInbox from '../Pages/SuperAdmin/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/SuperAdmin/AcademicCalendar/AcademicCalendar'
import Notifications from '../Pages/SuperAdmin/Notifications/Notifications'
import EscalationList from '../Pages/SuperAdmin/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/SuperAdmin/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/SuperAdmin/EscalationManagement/ViewEscalation'
import StudentsAttendanceList from '../Pages/SuperAdmin/Attendance/Students/StudentsList'
import EmployeesAttendanceList from '../Pages/SuperAdmin/Attendance/Employees/EmployeesList'
import StudentsList from '../Pages/SuperAdmin/UserManagement/StudentDatabase/StudentsList'
import ViewStudent from '../Pages/SuperAdmin/UserManagement/StudentDatabase/ViewStudent'
import EmployeesList from '../Pages/SuperAdmin/UserManagement/EmployeeDatabase/EmployeesList'
import ViewEmployee from '../Pages/SuperAdmin/UserManagement/EmployeeDatabase/ViewEmployee'
import GatePassList from '../Pages/SuperAdmin/GatePass/GatePassList'
import ViewGatePass from '../Pages/SuperAdmin/GatePass/ViewGatePass'
import StarRatings from '../Pages/SuperAdmin/StarRatings/StarRatings'
import ActivityLogList from '../Pages/SuperAdmin/ActivityLogs/ActivityLogList'
import ViewActivityLog from '../Pages/SuperAdmin/ActivityLogs/ViewActivityLog'
import { DemoActivityPage, ReentryPage } from '../Common/demoDomain/DemoScreens'
import { CriticalInventoryPage } from '../Common/demoDomain/WorkflowScreens'
import TransportOverview from '../Pages/SuperAdmin/TransportOverview/TransportOverview'
import ApprovalsList from '../Pages/SuperAdmin/Approvals/ApprovalsList'
import ViewApproval from '../Pages/SuperAdmin/Approvals/ViewApproval'
import FinanceOverview from '../Pages/SuperAdmin/Finance/FinanceOverview'
import FinanceSectionList from '../Pages/SuperAdmin/Finance/FinanceSectionList'
import AuditReportsOverview from '../Pages/SuperAdmin/AuditReports/AuditReportsOverview'
import AuditReportsSectionList from '../Pages/SuperAdmin/AuditReports/AuditReportsSectionList'
import AdminUsersList from '../Pages/SuperAdmin/UserCreation/AdminUsersList'
import CreateAdminUser from '../Pages/SuperAdmin/UserCreation/CreateAdminUser'
import ViewAdminUser from '../Pages/SuperAdmin/UserCreation/ViewAdminUser'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'

const SuperAdminRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/super-admin/dashboard" element={<Dashboard />} />

            <Route path="/super-admin/attendance" element={<Navigate to="/super-admin/attendance/students/list" replace />} />
            <Route path="/super-admin/attendance/students/list" element={<StudentsAttendanceList />} />
            <Route path="/super-admin/attendance/employees" element={<EmployeesAttendanceList />} />

            <Route path="/super-admin/user-database" element={<Navigate to="/super-admin/user-database/students" replace />} />
            <Route path="/super-admin/user-database/students" element={<StudentsList />} />
            <Route path="/super-admin/user-database/students/view/:id" element={<ViewStudent />} />
            <Route path="/super-admin/user-database/employees" element={<EmployeesList />} />
            <Route path="/super-admin/user-database/employees/view/:id" element={<ViewEmployee />} />

            <Route path="/super-admin/user-creation" element={<AdminUsersList />} />
            <Route path="/super-admin/user-creation/add" element={<CreateAdminUser />} />
            <Route path="/super-admin/user-creation/view/:id" element={<ViewAdminUser />} />

            <Route path="/super-admin/gate-pass" element={<GatePassList />} />
            <Route path="/super-admin/gate-pass/view/:id" element={<ViewGatePass />} />

            <Route path="/super-admin/transport-overview" element={<TransportOverview />} />

            <Route path="/super-admin/star-ratings" element={<Navigate to="/super-admin/star-ratings/star-of-month" replace />} />
            <Route path="/super-admin/star-ratings/star-of-month" element={<StarRatings view="som" />} />
            <Route path="/super-admin/star-ratings/star-of-year" element={<StarRatings view="soy" />} />

            {TaskManagementRoutes({ basePath: '/super-admin' })}

            <Route path="/super-admin/leave-request/received" element={<ReceivedLeaveRequests />} />
            <Route path="/super-admin/leave-request/received/view/:id" element={<ViewReceivedLeaveRequest />} />

            <Route path="/super-admin/approvals" element={<ApprovalsList />} />
            <Route path="/super-admin/approvals/view/:id" element={<ViewApproval />} />

            <Route path="/super-admin/finance" element={<Navigate to="/super-admin/finance/overview" replace />} />
            <Route path="/super-admin/finance/overview" element={<FinanceOverview />} />
            <Route path="/super-admin/finance/fees" element={<FinanceSectionList sectionKey="fees" />} />
            <Route path="/super-admin/finance/collections" element={<FinanceSectionList sectionKey="collections" />} />
            <Route path="/super-admin/finance/wallets" element={<FinanceSectionList sectionKey="wallets" />} />
            <Route path="/super-admin/finance/transport" element={<FinanceSectionList sectionKey="transport" />} />
            <Route path="/super-admin/finance/accounting" element={<FinanceSectionList sectionKey="accounting" />} />
            <Route path="/super-admin/finance/reports" element={<FinanceSectionList sectionKey="reports" />} />

            <Route path="/super-admin/audit-reports" element={<Navigate to="/super-admin/audit-reports/overview" replace />} />
            <Route path="/super-admin/audit-reports/overview" element={<AuditReportsOverview />} />
            <Route path="/super-admin/audit-reports/compliance" element={<AuditReportsSectionList sectionKey="compliance" />} />
            <Route path="/super-admin/audit-reports/department-ranking" element={<AuditReportsSectionList sectionKey="department-ranking" />} />
            <Route path="/super-admin/audit-reports/pending-findings" element={<AuditReportsSectionList sectionKey="pending-findings" />} />
            <Route path="/super-admin/audit-reports/critical-findings" element={<AuditReportsSectionList sectionKey="critical-findings" />} />
            <Route path="/super-admin/audit-reports/risk-dashboard" element={<AuditReportsSectionList sectionKey="risk-dashboard" />} />

            <Route path="/super-admin/announcement" element={<AnnouncementList />} />
            <Route path="/super-admin/announcement/add" element={<AddAnnouncement />} />
            <Route path="/super-admin/announcement/view/:id" element={<ViewAnnouncement />} />

            <Route path="/super-admin/communication" element={<Navigate to="/super-admin/communication/inbox" replace />} />
            <Route path="/super-admin/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/super-admin/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/super-admin/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/super-admin/communication/inbox" />} />
            <Route path="/super-admin/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/super-admin/communication/inbox" />} />

            <Route path="/super-admin/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/super-admin/notifications" element={<Notifications />} />

            <Route path="/super-admin/escalation-management" element={<EscalationList />} />
            <Route path="/super-admin/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/super-admin/escalation-management/view/:id" element={<ViewEscalation />} />

            <Route path="/super-admin/activity-logs" element={<Navigate to="/super-admin/activity-logs/login-history" replace />} />
            <Route path="/super-admin/activity-logs/login-history" element={<ActivityLogList logType="login-history" />} />
            <Route path="/super-admin/activity-logs/data-changes" element={<ActivityLogList logType="data-changes" />} />
            <Route path="/super-admin/activity-logs/deleted-records" element={<ActivityLogList logType="deleted-records" />} />
            <Route path="/super-admin/activity-logs/approval-actions" element={<ActivityLogList logType="approval-actions" />} />
            <Route path="/super-admin/activity-logs/audit-logs" element={<ActivityLogList logType="audit-logs" />} />
            <Route path="/super-admin/activity-logs/failed-logins" element={<ActivityLogList logType="failed-logins" />} />
            <Route path="/super-admin/activity-logs/demo-activity" element={<DemoActivityPage />} />
            <Route path="/super-admin/reentry" element={<ReentryPage />} />
            <Route path="/super-admin/module-health" element={<CriticalInventoryPage />} />
            <Route path="/super-admin/activity-logs/view/:id" element={<ViewActivityLog />} />

            <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default SuperAdminRoutes
