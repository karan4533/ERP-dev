import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/TransportManager/Dashboard/Dashboard'
import DriverManagement from '../Pages/TransportManager/DriverManagement/DriverManagement'
import ViewDriver from '../Pages/TransportManager/DriverManagement/ViewDriver'
import VehicleManagement from '../Pages/TransportManager/VehicleManagement/VehicleManagement'
import AddVehicle from '../Pages/TransportManager/VehicleManagement/AddVehicle'
import EditVehicle from '../Pages/TransportManager/VehicleManagement/EditVehicle'
import ViewVehicle from '../Pages/TransportManager/VehicleManagement/ViewVehicle'
import RouteManagement from '../Pages/TransportManager/RouteManagement/RouteManagement'
import AddRoute from '../Pages/TransportManager/RouteManagement/AddRoute'
import EditRoute from '../Pages/TransportManager/RouteManagement/EditRoute'
import ViewRoute from '../Pages/TransportManager/RouteManagement/ViewRoute'
import RouteData from '../Pages/TransportManager/RouteData/RouteData'
import TrackBus from '../Pages/TransportManager/RouteData/TrackBus'
import StudentTransport from '../Pages/TransportManager/StudentTransport/StudentTransport'
import AddStudentTransport from '../Pages/TransportManager/StudentTransport/AddStudentTransport'
import ViewStudentTransport from '../Pages/TransportManager/StudentTransport/ViewStudentTransport'
import AssignDuty from '../Pages/TransportManager/AssignDuty/AssignDuty'
import AddAssignDuty from '../Pages/TransportManager/AssignDuty/AddAssignDuty'
import ViewAssignDuty from '../Pages/TransportManager/AssignDuty/ViewAssignDuty'
import VehicleMaintenance from '../Pages/TransportManager/VehicleMaintenance/VehicleMaintenance'
import AddVehicleMaintenance from '../Pages/TransportManager/VehicleMaintenance/AddVehicleMaintenance'
import ViewVehicleMaintenance from '../Pages/TransportManager/VehicleMaintenance/ViewVehicleMaintenance'
import RequestApprovals from '../Pages/TransportManager/RequestApprovals/RequestApprovals'
import TransportExpenses from '../Pages/TransportManager/TransportExpenses/TransportExpenses'
import AddTransportExpense from '../Pages/TransportManager/TransportExpenses/AddTransportExpense'
import ViewTransportExpense from '../Pages/TransportManager/TransportExpenses/ViewTransportExpense'
import LeaveRequest from '../Pages/TransportManager/LeaveRequest/LeaveRequest'
import ViewLeaveRequest from '../Pages/TransportManager/LeaveRequest/ViewLeaveRequest'
import { BuildingMaintenancePage } from '../Common/demoDomain/DemoScreens'

const TransportManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/transport-manager/dashboard" element={<Dashboard />} />
            <Route path="/transport-manager/driver-management" element={<DriverManagement />} />
            <Route path="/transport-manager/driver-management/view/:id" element={<ViewDriver />} />
            <Route path="/transport-manager/vehicle-management" element={<VehicleManagement />} />
            <Route path="/transport-manager/vehicle-management/add-vehicle" element={<AddVehicle />} />
            <Route path="/transport-manager/vehicle-management/view/:id" element={<ViewVehicle />} />
            <Route path="/transport-manager/vehicle-management/edit/:id" element={<EditVehicle />} />
            <Route path="/transport-manager/route-management" element={<RouteManagement />} />
            <Route path="/transport-manager/route-management/add-route" element={<AddRoute />} />
            <Route path="/transport-manager/route-management/view/:id" element={<ViewRoute />} />
            <Route path="/transport-manager/route-management/edit/:id" element={<EditRoute />} />
            <Route path="/transport-manager/route-data" element={<RouteData />} />
            <Route path="/transport-manager/route-data/track/:id" element={<TrackBus />} />
            <Route path="/transport-manager/student-transport" element={<StudentTransport />} />
            <Route path="/transport-manager/student-transport/add" element={<AddStudentTransport />} />
            <Route path="/transport-manager/student-transport/view/:id" element={<ViewStudentTransport />} />
            <Route path="/transport-manager/assign-duty" element={<AssignDuty />} />
            <Route path="/transport-manager/assign-duty/add" element={<AddAssignDuty />} />
            <Route path="/transport-manager/assign-duty/view/:id" element={<ViewAssignDuty />} />
            <Route path="/transport-manager/vehicle-maintenance" element={<VehicleMaintenance />} />
            <Route path="/transport-manager/vehicle-maintenance/add" element={<AddVehicleMaintenance />} />
            <Route path="/transport-manager/vehicle-maintenance/view/:id" element={<ViewVehicleMaintenance />} />
            <Route path="/transport-manager/request-approvals" element={<RequestApprovals />} />
            <Route path="/transport-manager/transport-expenses" element={<TransportExpenses />} />
            <Route path="/transport-manager/transport-expenses/add/:type" element={<AddTransportExpense />} />
            <Route path="/transport-manager/transport-expenses/view/:type/:id" element={<ViewTransportExpense />} />
            <Route path="/transport-manager/leave-request" element={<LeaveRequest />} />
            <Route path="/transport-manager/leave-request/view/:id" element={<ViewLeaveRequest />} />
            <Route path="/transport-manager/building-maintenance" element={<BuildingMaintenancePage />} />
            <Route path="*" element={<Navigate to="/transport-manager/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default TransportManagerRoutes
