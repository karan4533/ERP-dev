import React from 'react'
import { Navigate, Route } from 'react-router-dom'
import CommunicationPage from './Communication/CommunicationPage'
import AcademicCalendarPage from './AcademicCalendar/AcademicCalendarPage'
import StaffNotificationsPage from './Notifications/StaffNotificationsPage'
import MyLeaveRequestsList from './LeaveRequest/MyLeaveRequestsList'
import AddLeaveRequestForm from './LeaveRequest/AddLeaveRequestForm'
import ViewMyLeaveRequestPage from './LeaveRequest/ViewMyLeaveRequestPage'

/**
 * Communication, Calendar, Notifications and own Leave Request routes for staff portals without role-specific copies.
 * Call as a function inside <Routes> (not as a component): {staffCommonRoutes('/hr', 'hr', 'HR', { notifications: false })}.
 * Every staff role already holds communication.*, calendar.read, notifications.read and leave.* on the backend.
 * `leaveKey` is the backend role code (see STAFF_LEAVE_PORTALS in LeaveRequest/leaveRequestConfigs.js).
 */
export const staffCommonRoutes = (
    base,
    roleKey,
    roleLabel,
    { communication = true, calendar = true, notifications = true, leaveKey = '' } = {},
) => [
    ...(communication
        ? [
            <Route key={`${base}-comm`} path={`${base}/communication`} element={<Navigate to={`${base}/communication/inbox`} replace />} />,
            <Route key={`${base}-inbox`} path={`${base}/communication/inbox`} element={<CommunicationPage roleKey={roleKey} />} />,
            <Route key={`${base}-thread`} path={`${base}/communication/inbox/:conversationId`} element={<CommunicationPage roleKey={roleKey} />} />,
        ]
        : []),
    ...(calendar
        ? [<Route key={`${base}-calendar`} path={`${base}/academic-calendar`} element={<AcademicCalendarPage roleKey={roleKey} />} />]
        : []),
    ...(notifications
        ? [<Route key={`${base}-notifications`} path={`${base}/notifications`} element={<StaffNotificationsPage title={`${roleLabel} Notifications`} />} />]
        : []),
    ...(leaveKey
        ? [
            <Route key={`${base}-leave-mine`} path={`${base}/leave-request/my-requests`} element={<MyLeaveRequestsList roleKey={leaveKey} />} />,
            <Route key={`${base}-leave-add`} path={`${base}/leave-request/my-requests/add`} element={<AddLeaveRequestForm roleKey={leaveKey} />} />,
            <Route key={`${base}-leave-view`} path={`${base}/leave-request/my-requests/view/:id`} element={<ViewMyLeaveRequestPage roleKey={leaveKey} />} />,
        ]
        : []),
]
