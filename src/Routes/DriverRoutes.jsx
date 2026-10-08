import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import PagePlaceholder from '../Pages/Driver/Components/PagePlaceholder'
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

const DriverRoutes = () => {
    return (
        <ReactRoutes>
            <Route
                path='/driver/dashboard'
                element={(
                    <PagePlaceholder
                        title='Driver Dashboard'
                        subtitle='Daily duty overview, vehicle status, and route summary'
                    />
                )}
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
            <Route path='*' element={<Navigate to='/driver/dashboard' replace />} />
        </ReactRoutes>
    )
}

export default DriverRoutes
