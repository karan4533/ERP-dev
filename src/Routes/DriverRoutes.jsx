import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'
import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import PagePlaceholder from '../Pages/Driver/Components/PagePlaceholder'
import Dashboard from '../Pages/Driver/Dashboard/Dashboard'
import VehicleDetails from '../Pages/Driver/VehicleManagement/VehicleDetails'
import VehicleDocuments from '../Pages/Driver/VehicleManagement/VehicleDocuments'
import VehicleHealthStatus from '../Pages/Driver/VehicleManagement/VehicleHealthStatus/VehicleHealthStatus'
import AddVehicleHealthStatus from '../Pages/Driver/VehicleManagement/VehicleHealthStatus/AddVehicleHealthStatus'
import EditVehicleHealthStatus from '../Pages/Driver/VehicleManagement/VehicleHealthStatus/EditVehicleHealthStatus'
import ViewVehicleHealthStatus from '../Pages/Driver/VehicleManagement/VehicleHealthStatus/ViewVehicleHealthStatus'
import MyDuty from '../Pages/Driver/MyDuty/MyDuty'
import RouteDetails from '../Pages/Driver/MyRoute/RouteDetails'
import RouteStops from '../Pages/Driver/MyRoute/RouteStops'
import StudentAttendance from '../Pages/Driver/StudentAttendance/StudentAttendance'
import AttendanceHistory from '../Pages/Driver/StudentAttendance/AttendanceHistory'
import FuelRequest from '../Pages/Driver/FuelRequest/FuelRequest'
import AddFuelRequest from '../Pages/Driver/FuelRequest/AddFuelRequest'
import EditFuelRequest from '../Pages/Driver/FuelRequest/EditFuelRequest'
import ViewFuelRequest from '../Pages/Driver/FuelRequest/ViewFuelRequest'
import MaintenanceRequest from '../Pages/Driver/MaintenanceRequest/MaintenanceRequest'
import AddMaintenanceRequest from '../Pages/Driver/MaintenanceRequest/AddMaintenanceRequest'
import EditMaintenanceRequest from '../Pages/Driver/MaintenanceRequest/EditMaintenanceRequest'
import ViewMaintenanceRequest from '../Pages/Driver/MaintenanceRequest/ViewMaintenanceRequest'
import LeaveRequest from '../Pages/Driver/LeaveRequest/LeaveRequest'
import AddLeaveRequest from '../Pages/Driver/LeaveRequest/AddLeaveRequest'
import EditLeaveRequest from '../Pages/Driver/LeaveRequest/EditLeaveRequest'
import ViewLeaveRequest from '../Pages/Driver/LeaveRequest/ViewLeaveRequest'
import UniversalReportsAnalyticsWorkspace from '../Common/ReportsAnalytics/UniversalReportsAnalyticsWorkspace'
import CommunicationPage from '../Common/Communication/CommunicationPage'
import AnnouncementListView from '../Common/Announcement/AnnouncementListView'
import ViewAnnouncementPage from '../Common/Announcement/ViewAnnouncementPage'
import AcademicCalendarPage from '../Common/AcademicCalendar/AcademicCalendarPage'
import EscalationListPage from '../Common/EscalationManagement/EscalationListPage'
import AddEscalationPage from '../Common/EscalationManagement/AddEscalationPage'
import ViewEscalationPage from '../Common/EscalationManagement/ViewEscalationPage'

const DriverRoutes = () => {
    return (
        <ReactRoutes>
            <Route
                path='/driver/dashboard'
                element={<Dashboard />}
            />
            <Route
                path='/driver/vehicle-management'
                element={<Navigate to='/driver/vehicle-management/vehicle-details' replace />}
            />
            <Route
                path='/driver/vehicle-management/vehicle-details'
                element={<VehicleDetails />}
            />
            <Route
                path='/driver/vehicle-management/vehicle-documents'
                element={<VehicleDocuments />}
            />
            <Route
                path='/driver/vehicle-management/vehicle-health-status'
                element={<VehicleHealthStatus />}
            />
            <Route
                path='/driver/vehicle-management/vehicle-health-status/add'
                element={<AddVehicleHealthStatus />}
            />
            <Route
                path='/driver/vehicle-management/vehicle-health-status/edit/:id'
                element={<EditVehicleHealthStatus />}
            />
            <Route
                path='/driver/vehicle-management/vehicle-health-status/view/:id'
                element={<ViewVehicleHealthStatus />}
            />
            <Route path='/driver/my-duty' element={<MyDuty />} />
            <Route path='/driver/my-route/route-details' element={<RouteDetails />} />
            <Route path='/driver/my-route/route-stops' element={<RouteStops />} />
            <Route path='/driver/attendance-management/student-attendance' element={<StudentAttendance />} />
            <Route path='/driver/attendance-management/attendance-history' element={<AttendanceHistory />} />
            <Route
                path='/driver/student-attendance'
                element={<Navigate to='/driver/attendance-management/student-attendance' replace />}
            />
            <Route
                path='/driver/student-transport'
                element={<Navigate to='/driver/attendance-management/student-attendance' replace />}
            />
            <Route
                path='/driver/my-route/student-transport'
                element={<Navigate to='/driver/attendance-management/student-attendance' replace />}
            />
            <Route path='/driver/fuel-request' element={<FuelRequest />} />
            <Route path='/driver/fuel-request/add' element={<AddFuelRequest />} />
            <Route path='/driver/fuel-request/edit/:id' element={<EditFuelRequest />} />
            <Route path='/driver/fuel-request/view/:id' element={<ViewFuelRequest />} />
            <Route path='/driver/maintenance-request' element={<MaintenanceRequest />} />
            <Route path='/driver/maintenance-request/add' element={<AddMaintenanceRequest />} />
            <Route path='/driver/maintenance-request/edit/:id' element={<EditMaintenanceRequest />} />
            <Route path='/driver/maintenance-request/view/:id' element={<ViewMaintenanceRequest />} />
            <Route path='/driver/leave-request' element={<LeaveRequest />} />
            <Route path='/driver/leave-request/add' element={<AddLeaveRequest />} />
            <Route path='/driver/leave-request/edit/:id' element={<EditLeaveRequest />} />
            <Route path='/driver/leave-request/view/:id' element={<ViewLeaveRequest />} />
            <Route path="/driver/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />

            {/* Driver Reports & Analytics */}
            <Route path='/driver/reports-analytics' element={<UniversalReportsAnalyticsWorkspace roleOverride="driver" />} />
            <Route path='/driver/reports' element={<UniversalReportsAnalyticsWorkspace roleOverride="driver" />} />

            {/* Driver Communication */}
            <Route path='/driver/communication' element={<Navigate to='/driver/communication/inbox' replace />} />
            <Route path='/driver/communication/inbox' element={<CommunicationPage roleKey="driver" />} />
            <Route path='/driver/communication/inbox/:conversationId' element={<CommunicationPage roleKey="driver" />} />

            {/* Driver Announcements */}
            <Route path='/driver/announcement' element={<AnnouncementListView roleKey="driver" />} />
            <Route path='/driver/announcement/view/:id' element={<ViewAnnouncementPage roleKey="driver" />} />

            {/* Driver Academic Calendar */}
            <Route path='/driver/academic-calendar' element={<AcademicCalendarPage roleKey="driver" />} />
            <Route path='/driver/calendar' element={<AcademicCalendarPage roleKey="driver" />} />

            {/* Driver Escalations / Report Issues */}
            <Route path='/driver/escalation-management' element={<EscalationListPage roleKey="driver" />} />
            <Route path='/driver/escalation-management/add-escalation' element={<AddEscalationPage roleKey="driver" />} />
            <Route path='/driver/escalation-management/view/:id' element={<ViewEscalationPage roleKey="driver" />} />

            <Route path='*' element={<Navigate to='/driver/dashboard' replace />} />
        </ReactRoutes>
    )
}

export default DriverRoutes
