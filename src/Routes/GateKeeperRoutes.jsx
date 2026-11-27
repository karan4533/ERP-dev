import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/Gatekeeper/Dashboard/Dashboard'
import HosteGatePass from '../Pages/Gatekeeper/HosteGatePass/HosteGatePass'
import MyDuty from '../Pages/Gatekeeper/MyDuty/MyDuty'
import Incidents from '../Pages/Gatekeeper/Incidents/Incidents'
import AddIncidents from '../Pages/Gatekeeper/Incidents/AddIncidents'
import ViewIncident from '../Pages/Gatekeeper/Incidents/ViewIncident'
import GatePassList from '../Pages/Gatekeeper/GatePass/GatePassList'
import AddGatePass from '../Pages/Gatekeeper/GatePass/AddGatePass'
import AnnouncementList from '../Pages/Gatekeeper/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/Gatekeeper/Announcement/ViewAnnouncement'
import EscalationList from '../Pages/Gatekeeper/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/Gatekeeper/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/Gatekeeper/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/Gatekeeper/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/Gatekeeper/AcademicCalendar/AcademicCalendar'
import Notifications from '../Pages/Gatekeeper/Notifications/Notifications'
import MyAttendance from '../Pages/Gatekeeper/Attendance/MyAttendance'
import MyLeaveRequests from '../Pages/Gatekeeper/LeaveRequest/MyLeaveRequests'
import AddLeaveRequest from '../Pages/Gatekeeper/LeaveRequest/AddLeaveRequest'
import ViewMyLeaveRequest from '../Pages/Gatekeeper/LeaveRequest/ViewMyLeaveRequest'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import { SimpleRegister } from '../Common/demoDomain/DemoScreens'
import { HANDOVER_SEED, REGISTER_SEED, VENDOR_SEED, VISITOR_SEED } from '../Common/demoDomain/securitySeeds'

const GateKeeperRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/gate-keeper/dashboard" element={<Dashboard />} />
            <Route path="/gate-keeper/hostel-gate-pass" element={<HosteGatePass />} />
            <Route path="/gate-keeper/my-duty" element={<MyDuty />} />
            <Route path="/gate-keeper/incidents" element={<Incidents />} />
            <Route path="/gate-keeper/add-incident" element={<AddIncidents />} />
            <Route path="/gate-keeper/incidents/:id" element={<ViewIncident />} />
            <Route path="/gate-keeper/visitors" element={<SimpleRegister title="Visitors" description="Visitor records stay separate from student, hostel, and material gate passes." storageKey="schoolerp-security-visitors-v1" seed={VISITOR_SEED} idPrefix="VIS-2026-" columns={[{ key: 'visitorName', label: 'Visitor' }, { key: 'purpose', label: 'Purpose' }, { key: 'host', label: 'Host' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }]} fields={[{ key: 'visitorName', label: 'Visitor Name', required: true }, { key: 'purpose', label: 'Purpose' }, { key: 'host', label: 'Host' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'inTime', label: 'In Time', type: 'time' }, { key: 'outTime', label: 'Out Time', type: 'time' }, { key: 'status', label: 'Status', type: 'select', options: ['Inside', 'Exited'] }]} />} />
            <Route path="/gate-keeper/registers" element={<SimpleRegister title="Inward / Outward Register" storageKey="schoolerp-security-registers-v1" seed={REGISTER_SEED} idPrefix="SEC-2026-" columns={[{ key: 'type', label: 'Type' }, { key: 'date', label: 'Date' }, { key: 'party', label: 'Person / Organisation' }, { key: 'item', label: 'Item' }, { key: 'handledBy', label: 'Handled By' }]} fields={[{ key: 'type', label: 'Type', type: 'select', options: ['INWARD', 'OUTWARD'], required: true }, { key: 'date', label: 'Date', type: 'date' }, { key: 'time', label: 'Time', type: 'time' }, { key: 'party', label: 'Person / Organisation', required: true }, { key: 'purpose', label: 'Purpose' }, { key: 'item', label: 'Item / Document' }, { key: 'quantity', label: 'Quantity', type: 'number' }, { key: 'reference', label: 'Reference' }, { key: 'handledBy', label: 'Handled By' }, { key: 'remarks', label: 'Remarks', type: 'textarea' }]} statusKey="type" />} />
            <Route path="/gate-keeper/handover" element={<SimpleRegister title="Handover / Takeover" storageKey="schoolerp-security-handover-v1" seed={HANDOVER_SEED} idPrefix="HO-2026-" columns={[{ key: 'shift', label: 'Shift' }, { key: 'outgoingStaff', label: 'Outgoing' }, { key: 'incomingStaff', label: 'Incoming' }, { key: 'dateTime', label: 'Date/Time' }, { key: 'status', label: 'Status' }]} fields={[{ key: 'shift', label: 'Shift', required: true }, { key: 'outgoingStaff', label: 'Outgoing Staff', required: true }, { key: 'incomingStaff', label: 'Incoming Staff', required: true }, { key: 'dateTime', label: 'Date/Time' }, { key: 'pendingIncidents', label: 'Pending Incidents' }, { key: 'keysAssets', label: 'Keys/Assets' }, { key: 'notes', label: 'Important Notes', type: 'textarea' }, { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed'] }]} />} />
            <Route path="/gate-keeper/vendors" element={<SimpleRegister title="Vendor registry" storageKey="schoolerp-security-vendors-v1" seed={VENDOR_SEED} idPrefix="VND-2026-" columns={[{ key: 'vendorName', label: 'Vendor' }, { key: 'company', label: 'Company' }, { key: 'contact', label: 'Contact' }, { key: 'purpose', label: 'Purpose' }, { key: 'status', label: 'Status' }]} fields={[{ key: 'vendorName', label: 'Vendor Name', required: true }, { key: 'company', label: 'Company' }, { key: 'contact', label: 'Contact' }, { key: 'purpose', label: 'Purpose / Service' }, { key: 'imageName', label: 'Image file name' }, { key: 'documentName', label: 'Document file name' }, { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }]} />} />
            <Route path="/gate-keeper/gate-pass-list" element={<GatePassList />} />
            <Route path="/gate-keeper/add-gate-pass" element={<AddGatePass />} />
            <Route path="/gate-keeper/broadcast-list" element={<AnnouncementList />} />
            <Route path="/gate-keeper/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="/gate-keeper/attendance" element={<Navigate to="/gate-keeper/attendance/my-attendance" replace />} />
            <Route path="/gate-keeper/attendance/my-attendance" element={<MyAttendance />} />
            <Route path="/gate-keeper/leave-request" element={<Navigate to="/gate-keeper/leave-request/my-requests" replace />} />
            <Route path="/gate-keeper/leave-request/my-requests" element={<MyLeaveRequests />} />
            <Route path="/gate-keeper/leave-request/my-requests/add" element={<AddLeaveRequest />} />
            <Route path="/gate-keeper/leave-request/my-requests/view/:id" element={<ViewMyLeaveRequest />} />
            <Route path="/gate-keeper/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/gate-keeper/notifications" element={<Notifications />} />
            {TaskManagementRoutes({ basePath: '/gate-keeper' })}
            <Route path="/gate-keeper/communication" element={<Navigate to="/gate-keeper/communication/inbox" replace />} />
            <Route path="/gate-keeper/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/gate-keeper/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/gate-keeper/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/gate-keeper/communication/inbox" />} />
            <Route path="/gate-keeper/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/gate-keeper/communication/inbox" />} />
            <Route path="/gate-keeper/escalation-management" element={<EscalationList />} />
            <Route path="/gate-keeper/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/gate-keeper/escalation-management/view/:id" element={<ViewEscalation />} />
            <Route path="*" element={<Navigate to="/gate-keeper/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default GateKeeperRoutes
