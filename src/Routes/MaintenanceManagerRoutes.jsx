import React from 'react'
import AssignedAuditObservations from '../Common/auditDomain/AssignedAuditObservations'
import { staffCommonRoutes } from '../Common/staffCommonRoutes'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import Dashboard from '../Pages/MaintenanceManager/Dashboard/Dashboard'
import DutyAllotment from '../Pages/MaintenanceManager/DutyAllotment/DutyAllotment'
import Schedules from '../Pages/MaintenanceManager/Schedules/Schedules'
import Checklists from '../Pages/MaintenanceManager/Checklists/Checklists'
import MaterialsInventory from '../Pages/MaintenanceManager/Materials/MaterialsInventory'
import StoreRequests from '../Pages/MaintenanceManager/StoreRequests/StoreRequests'
import InventoryRequirement from '../Pages/MaintenanceManager/InventoryRequirement/InventoryRequirement'
import PurchaseWorkflow from '../Pages/MaintenanceManager/PurchaseWorkflow/PurchaseWorkflow'
import AnnouncementList from '../Pages/MaintenanceManager/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/MaintenanceManager/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/MaintenanceManager/Announcement/ViewAnnouncement'
import DepartmentTicketsPage from '../Common/Tickets/DepartmentTicketsPage'
import ViewSupportTicket from '../Pages/ITSupportManager/SupportTickets/ViewSupportTicket'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'

const MaintenanceManagerRoutes = () => (
    <ReactRoutes>
        <Route path="/maintenance-manager/dashboard" element={<Dashboard />} />
        {TaskManagementRoutes({ basePath: '/maintenance-manager' })}
        <Route
            path="/maintenance-manager/tickets"
            element={(
                <DepartmentTicketsPage
                    defaultDepartment="Facilities"
                    listBasePath="/maintenance-manager/tickets"
                    title="Facilities Tickets"
                />
            )}
        />
        <Route path="/maintenance-manager/tickets/view-ticket/:id" element={<ViewSupportTicket />} />
        <Route path="/maintenance-manager/duty-allotment" element={<DutyAllotment />} />
        <Route path="/maintenance-manager/schedules" element={<Schedules />} />
        <Route path="/maintenance-manager/checklists" element={<Checklists />} />
        <Route path="/maintenance-manager/materials" element={<MaterialsInventory />} />
        <Route path="/maintenance-manager/store-requests" element={<StoreRequests />} />
        <Route path="/maintenance-manager/inventory-requirement" element={<InventoryRequirement />} />
        <Route path="/maintenance-manager/purchase-workflow" element={<PurchaseWorkflow />} />
        <Route path="/maintenance-manager/broadcast" element={<AnnouncementList />} />
        <Route path="/maintenance-manager/broadcast/add-broadcast" element={<AddAnnouncement />} />
        <Route path="/maintenance-manager/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
        <Route path="/maintenance-manager" element={<Navigate to="/maintenance-manager/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/maintenance-manager/dashboard" replace />} />
        {staffCommonRoutes('/maintenance-manager', 'maintenanceManager', 'Maintenance Manager', { leaveKey: 'maintenancemanager' })}
        <Route path="/maintenance-manager/audit-observations" element={<AssignedAuditObservations />} />
    </ReactRoutes>
)

export default MaintenanceManagerRoutes
