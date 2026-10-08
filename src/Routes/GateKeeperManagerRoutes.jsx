import React from 'react'
import { Navigate, Route, Routes as ReactRoutes, useParams } from 'react-router-dom'
import Dashboard from '../Pages/GateKeeperManager/Dashboard/Dashboard'
import AssignDutyList from '../Pages/GateKeeperManager/AssignDuty/AssignDutyList'
import AssignDuty from '../Pages/GateKeeperManager/AssignDuty/AssignDuty'
import MyLeaveRequests from '../Pages/GateKeeperManager/LeaveRequest/MyLeaveRequests'
import AddLeaveRequest from '../Pages/GateKeeperManager/LeaveRequest/AddLeaveRequest'
import ViewMyLeaveRequest from '../Pages/GateKeeperManager/LeaveRequest/ViewMyLeaveRequest'
import ReceivedLeaveRequests from '../Pages/GateKeeperManager/LeaveRequest/ReceivedLeaveRequests'
import ViewReceivedLeaveRequest from '../Pages/GateKeeperManager/LeaveRequest/ViewReceivedLeaveRequest'
import IncidentsList from '../Pages/GateKeeperManager/IncidentManagement/IncidentsList'
import GatekeeperAnnouncementList from '../Pages/GateKeeperManager/GatekeeperAnnouncement/GatekeeperAnnouncementList'
import AddGatekeeperAnnouncement from '../Pages/GateKeeperManager/GatekeeperAnnouncement/AddGatekeeperAnnouncement'
import ViewGatekeeperAnnouncement from '../Pages/GateKeeperManager/GatekeeperAnnouncement/ViewGatekeeperAnnouncement'
import EscalationList from '../Pages/GateKeeperManager/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/GateKeeperManager/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/GateKeeperManager/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/GateKeeperManager/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/GateKeeperManager/AcademicCalendar/AcademicCalendar'
import MyAttendance from '../Pages/GateKeeperManager/Attendance/MyAttendance'
import GatekeepersAttendance from '../Pages/GateKeeperManager/Attendance/GatekeepersAttendance'
import Notifications from '../Pages/GateKeeperManager/Notifications/Notifications'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'

const LegacyLeaveApprovalViewRedirect = () => {
    const { id } = useParams()
    return <Navigate to={`/gatekeeper-manager/leave-request/received/view/${id}`} replace />
}

const GateKeeperManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/gatekeeper-manager/dashboard" element={<Dashboard />} />
            <Route path="/gatekeeper-manager/assign-duty-list" element={<AssignDutyList />} />
            <Route path="/gatekeeper-manager/assign-duty" element={<AssignDuty />} />
            <Route path="/gatekeeper-manager/leave-request" element={<Navigate to="/gatekeeper-manager/leave-request/my-requests" replace />} />
            <Route path="/gatekeeper-manager/leave-request/my-requests" element={<MyLeaveRequests />} />
            <Route path="/gatekeeper-manager/leave-request/my-requests/add" element={<AddLeaveRequest />} />
            <Route path="/gatekeeper-manager/leave-request/my-requests/view/:id" element={<ViewMyLeaveRequest />} />
            <Route path="/gatekeeper-manager/leave-request/received" element={<ReceivedLeaveRequests />} />
            <Route path="/gatekeeper-manager/leave-request/received/view/:id" element={<ViewReceivedLeaveRequest />} />
            <Route path="/gatekeeper-manager/leave-approval-list" element={<Navigate to="/gatekeeper-manager/leave-request/received" replace />} />
            <Route path="/gatekeeper-manager/leave-approval-list/view/:id" element={<LegacyLeaveApprovalViewRedirect />} />
            <Route path="/gatekeeper-manager/incidents-list" element={<IncidentsList />} />
            <Route path="/gatekeeper-manager/gatekeeper-broadcast-list" element={<GatekeeperAnnouncementList />} />
            <Route path="/gatekeeper-manager/add-gatekeeper-broadcast" element={<AddGatekeeperAnnouncement />} />
            <Route path="/gatekeeper-manager/gatekeeper-broadcast-list/view/:id" element={<ViewGatekeeperAnnouncement />} />
            <Route path="/gatekeeper-manager/attendance" element={<Navigate to="/gatekeeper-manager/attendance/my-attendance" replace />} />
            <Route path="/gatekeeper-manager/attendance/my-attendance" element={<MyAttendance />} />
            <Route path="/gatekeeper-manager/attendance/gatekeepers-attendance" element={<GatekeepersAttendance />} />
            <Route path="/gatekeeper-manager/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/gatekeeper-manager/notifications" element={<Notifications />} />
            {TaskManagementRoutes({ basePath: '/gatekeeper-manager' })}
            <Route path="/gatekeeper-manager/communication" element={<Navigate to="/gatekeeper-manager/communication/inbox" replace />} />
            <Route path="/gatekeeper-manager/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/gatekeeper-manager/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/gatekeeper-manager/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/gatekeeper-manager/communication/inbox" />} />
            <Route path="/gatekeeper-manager/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/gatekeeper-manager/communication/inbox" />} />
            <Route path="/gatekeeper-manager/escalation-management" element={<EscalationList />} />
            <Route path="/gatekeeper-manager/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/gatekeeper-manager/escalation-management/view/:id" element={<ViewEscalation />} />
            <Route path="*" element={<Navigate to="/gatekeeper-manager/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default GateKeeperManagerRoutes
