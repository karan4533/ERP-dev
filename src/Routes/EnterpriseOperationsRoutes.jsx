import React from 'react'
import { Navigate, Route } from 'react-router-dom'
import StoresProcurementWorkspace from '../Common/StoresProcurement/StoresProcurementWorkspace'
import GatePassSecurityWorkspace from '../Common/GatePassSecurity/GatePassSecurityWorkspace'
import VisitorsWorkspace from '../Common/Visitors/VisitorsWorkspace'
import FileRoomWorkspace from '../Common/FileRoom/FileRoomWorkspace'
import DepartmentTicketingWorkspace from '../Common/DepartmentTicketing/DepartmentTicketingWorkspace'
import DepartmentActivityMonitoringWorkspace from '../Common/EmployeeActivityMonitoring/DepartmentActivityMonitoringWorkspace'
import EnterpriseTaskWorkspace from '../Common/TaskManagement/EnterpriseTaskWorkspace'
import LostAndFoundWorkspace from '../Common/LostAndFound/LostAndFoundWorkspace'
import AuditeeObservationsWorkspace from '../Common/AuditObservations/AuditeeObservationsWorkspace'
import EscalationListPage from '../Common/EscalationManagement/EscalationListPage'
import AddEscalationPage from '../Common/EscalationManagement/AddEscalationPage'
import ViewEscalationPage from '../Common/EscalationManagement/ViewEscalationPage'
import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'
import StaffRelievingWorkspace from '../Common/Relieving/StaffRelievingWorkspace'
import UniversalReportsAnalyticsWorkspace from '../Common/ReportsAnalytics/UniversalReportsAnalyticsWorkspace'
import HostelManagementWorkspace from '../Common/Hostel/HostelManagementWorkspace'
import CommunicationPage from '../Common/Communication/CommunicationPage'
import AnnouncementListView from '../Common/Announcement/AnnouncementListView'
import ViewAnnouncementPage from '../Common/Announcement/ViewAnnouncementPage'
import AddAnnouncementForm from '../Common/Announcement/AddAnnouncementForm'
import AcademicCalendarPage from '../Common/AcademicCalendar/AcademicCalendarPage'

export const EnterpriseOperationsRoutes = ({ basePath, role = null }) => (
    <>
        {/* Universal Communication */}
        <Route path={`${basePath}/communication`} element={<Navigate to={`${basePath}/communication/inbox`} replace />} />
        <Route path={`${basePath}/communication/inbox`} element={<CommunicationPage roleKey={role} />} />
        <Route path={`${basePath}/communication/inbox/:conversationId`} element={<CommunicationPage roleKey={role} />} />

        {/* Universal Announcements */}
        <Route path={`${basePath}/announcement`} element={<AnnouncementListView roleKey={role} />} />
        <Route path={`${basePath}/announcement/view/:id`} element={<ViewAnnouncementPage roleKey={role} />} />
        <Route path={`${basePath}/announcement/add`} element={<AddAnnouncementForm roleKey={role} />} />

        {/* Universal Academic Calendar */}
        <Route path={`${basePath}/academic-calendar`} element={<AcademicCalendarPage roleKey={role} />} />
        <Route path={`${basePath}/calendar`} element={<AcademicCalendarPage roleKey={role} />} />

        {/* 1. Stores & Procurement */}
        <Route path={`${basePath}/stores-procurement`} element={<StoresProcurementWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/stores-procurement/:tab`} element={<StoresProcurementWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/stores`} element={<StoresProcurementWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/inventory`} element={<StoresProcurementWorkspace defaultTab='inventory' roleOverride={role} />} />
        <Route path={`${basePath}/purchase-orders`} element={<StoresProcurementWorkspace defaultTab='purchase-orders' roleOverride={role} />} />
        <Route path={`${basePath}/goods-receipt`} element={<StoresProcurementWorkspace defaultTab='goods-received-passes' roleOverride={role} />} />
        <Route path={`${basePath}/goods-received`} element={<StoresProcurementWorkspace defaultTab='goods-received-passes' roleOverride={role} />} />
        <Route path={`${basePath}/goods-received-pass-list`} element={<StoresProcurementWorkspace defaultTab='goods-received-passes' roleOverride={role} />} />
        <Route path={`${basePath}/material-gate-pass`} element={<StoresProcurementWorkspace defaultTab='material-gate-passes' roleOverride={role} />} />
        <Route path={`${basePath}/material-gate-pass-list`} element={<StoresProcurementWorkspace defaultTab='material-gate-passes' roleOverride={role} />} />

        {/* 2. Gate Pass & Security */}
        <Route path={`${basePath}/gate-pass`} element={<GatePassSecurityWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/gate-pass/:tab`} element={<GatePassSecurityWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/security-gate`} element={<GatePassSecurityWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/visitors`} element={<VisitorsWorkspace roleOverride={role} />} />

        {/* 3. Physical File Room */}
        <Route path={`${basePath}/file-room`} element={<FileRoomWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/file-room/:tab`} element={<FileRoomWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/physical-files`} element={<FileRoomWorkspace roleOverride={role} />} />

        {/* 4. Department-Wise Ticketing */}
        <Route path={`${basePath}/department-ticketing`} element={<DepartmentTicketingWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/department-ticketing/:tab`} element={<DepartmentTicketingWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/helpdesk`} element={<DepartmentTicketingWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/ticketing`} element={<DepartmentTicketingWorkspace roleOverride={role} />} />

        {/* 5. Hierarchical Activity Monitoring */}
        <Route path={`${basePath}/activity-monitoring`} element={<DepartmentActivityMonitoringWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/activity-monitoring/:tab`} element={<DepartmentActivityMonitoringWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/employee-monitoring`} element={<DepartmentActivityMonitoringWorkspace roleOverride={role} />} />

        {/* 6. Universal Two-Way Tasks */}
        <Route path={`${basePath}/enterprise-tasks`} element={<EnterpriseTaskWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/tasks`} element={<EnterpriseTaskWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/task-management`} element={<EnterpriseTaskWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/task-management/workspace`} element={<EnterpriseTaskWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/task-management/my-tasks`} element={<EnterpriseTaskWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/task-management/assign-tasks`} element={<EnterpriseTaskWorkspace roleOverride={role} />} />

        {/* 7. Lost & Found Management */}
        <Route path={`${basePath}/lost-and-found`} element={<LostAndFoundWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/lost-and-found/:tab`} element={<LostAndFoundWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/lost-found`} element={<LostAndFoundWorkspace roleOverride={role} />} />

        {/* 8. Audit Observations (Bidirectional: Received & Responded for all Auditee Roles) */}
        <Route path={`${basePath}/audit-observations`} element={<AuditeeObservationsWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/audit-observations/:id`} element={<AuditeeObservationsWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/audit-compliance`} element={<AuditeeObservationsWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/received-observations`} element={<AuditeeObservationsWorkspace roleOverride={role} />} />

        {/* 9. Universal Escalations (Sent & Received) */}
        <Route path={`${basePath}/escalation-management`} element={<EscalationListPage roleKey={role} />} />
        <Route path={`${basePath}/escalation-management/add-escalation`} element={<AddEscalationPage roleKey={role} />} />
        <Route path={`${basePath}/escalation-management/view/:id`} element={<ViewEscalationPage roleKey={role} />} />
        <Route path={`${basePath}/escalations`} element={<EscalationListPage roleKey={role} />} />

        {/* 10. Universal Leave & Attendance (My Leaves & Received Leaves) */}
        <Route path={`${basePath}/leave-request`} element={<AttendanceAndLeaveWorkspace defaultTab='my-leave' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/my-leaves`} element={<AttendanceAndLeaveWorkspace defaultTab='my-leave' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/my-requests`} element={<AttendanceAndLeaveWorkspace defaultTab='my-leave' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/my-requests/add`} element={<AttendanceAndLeaveWorkspace defaultTab='my-leave' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/my-requests/view`} element={<AttendanceAndLeaveWorkspace defaultTab='my-leave' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/my-requests/view/:id`} element={<AttendanceAndLeaveWorkspace defaultTab='my-leave' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/received-leaves`} element={<AttendanceAndLeaveWorkspace defaultTab='leave-management' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/received`} element={<AttendanceAndLeaveWorkspace defaultTab='leave-management' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/received/view`} element={<AttendanceAndLeaveWorkspace defaultTab='leave-management' roleOverride={role} />} />
        <Route path={`${basePath}/leave-request/received/view/:id`} element={<AttendanceAndLeaveWorkspace defaultTab='leave-management' roleOverride={role} />} />
        <Route path={`${basePath}/request-leave`} element={<AttendanceAndLeaveWorkspace defaultTab='my-leave' roleOverride={role} />} />
        <Route path={`${basePath}/apply-leave`} element={<AttendanceAndLeaveWorkspace defaultTab='my-leave' roleOverride={role} />} />
        <Route path={`${basePath}/my-attendance`} element={<AttendanceAndLeaveWorkspace defaultTab='my-attendance' roleOverride={role} />} />
        <Route path={`${basePath}/staff-attendance`} element={<AttendanceAndLeaveWorkspace defaultTab='attendance' roleOverride={role} />} />

        {/* 11. Staff Relieving & HR NOC Clearance */}
        <Route path={`${basePath}/relieving-request`} element={<StaffRelievingWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/relieving`} element={<StaffRelievingWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/hr-noc`} element={<StaffRelievingWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/staff-relieving`} element={<StaffRelievingWorkspace roleOverride={role} />} />

        {/* 12. Universal Role-Based Reports & Analytics */}
        <Route path={`${basePath}/reports-analytics`} element={<UniversalReportsAnalyticsWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/reports`} element={<UniversalReportsAnalyticsWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/analytics`} element={<UniversalReportsAnalyticsWorkspace roleOverride={role} />} />

        {/* 13. Institutional Hostel Accommodation & Bed Management */}
        <Route path={`${basePath}/hostel`} element={<HostelManagementWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/hostel-management`} element={<HostelManagementWorkspace roleOverride={role} />} />
        <Route path={`${basePath}/hostel-management/:tab`} element={<HostelManagementWorkspace roleOverride={role} />} />
    </>
)

export default EnterpriseOperationsRoutes

