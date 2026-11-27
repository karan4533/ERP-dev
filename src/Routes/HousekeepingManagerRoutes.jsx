import React from 'react'
import AssignedAuditObservations from '../Common/auditDomain/AssignedAuditObservations'
import { staffCommonRoutes } from '../Common/staffCommonRoutes'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/HousekeepingManager/Dashboard/Dashboard'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import Inventory from '../Pages/HousekeepingManager/Inventory/Inventory'
import AddInventory from '../Pages/HousekeepingManager/Inventory/AddInventory'
import ViewInventoryItem from '../Pages/HousekeepingManager/Inventory/ViewInventoryItem'
import RequestsApprovalsList from '../Pages/HousekeepingManager/RequestsApprovals/RequestsApprovalsList'
import AddRequest from '../Pages/HousekeepingManager/RequestsApprovals/AddRequest'
import ViewRequest from '../Pages/HousekeepingManager/RequestsApprovals/ViewRequest'
import Reports from '../Pages/HousekeepingManager/Reports/Reports'
import AnnouncementList from '../Pages/HousekeepingManager/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/HousekeepingManager/Announcement/ViewAnnouncement'
import AddAnnouncement from '../Pages/HousekeepingManager/Announcement/AddAnnouncement'
import { HousekeepingDutyPage, MovementTable, SimpleRegister } from '../Common/demoDomain/DemoScreens'
import { getMovements } from '../Common/demoDomain/inventory'
import InventoryRequirement from '../Pages/HousekeepingManager/InventoryRequirement/InventoryRequirement'
import PurchaseWorkflow from '../Pages/HousekeepingManager/PurchaseWorkflow/PurchaseWorkflow'
import RequestProductFromStore from '../Common/Store/RequestProductFromStore'
import { RO_SEED, SCHEDULE_SEED, SOM_SEED } from '../Common/demoDomain/housekeeping'
import LostFoundRegister from '../Common/demoDomain/LostFoundRegister'
import DepartmentTicketsPage from '../Common/Tickets/DepartmentTicketsPage'
import ViewSupportTicket from '../Pages/ITSupportManager/SupportTickets/ViewSupportTicket'

const HousekeepingManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/housekeeping-manager/dashboard" element={<Dashboard />} />
            <Route
                path="/housekeeping-manager/tickets"
                element={(
                    <DepartmentTicketsPage
                        defaultDepartment="Housekeeping"
                        listBasePath="/housekeeping-manager/tickets"
                        title="Housekeeping Tickets"
                    />
                )}
            />
            <Route path="/housekeeping-manager/tickets/view-ticket/:id" element={<ViewSupportTicket />} />
            {TaskManagementRoutes({ basePath: '/housekeeping-manager' })}
            <Route path="/housekeeping-manager/inventory" element={<Inventory />} />
            <Route path="/housekeeping-manager/inventory/add-item" element={<AddInventory />} />
            <Route path="/housekeeping-manager/inventory/view-item/:id" element={<ViewInventoryItem />} />
            <Route path="/housekeeping-manager/requests-approvals" element={<RequestsApprovalsList />} />
            <Route path="/housekeeping-manager/requests-approvals/add-request" element={<AddRequest />} />
            <Route path="/housekeeping-manager/requests-approvals/view-request/:id" element={<ViewRequest />} />
            <Route path="/housekeeping-manager/reports" element={<Reports />} />
            <Route path="/housekeeping-manager/broadcast" element={<AnnouncementList />} />
            <Route path="/housekeeping-manager/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="/housekeeping-manager/broadcast/add-broadcast" element={<AddAnnouncement />} />
            <Route path="/housekeeping-manager/duty-allotment" element={<HousekeepingDutyPage />} />
            <Route path="/housekeeping-manager/schedules" element={<SimpleRegister title="Recurring schedules" description="Daily, weekly, monthly, and yearly cleaning schedules (PDF §4.7 / §8#2)." storageKey="schoolerp-housekeeping-schedules-v1" seed={SCHEDULE_SEED} idPrefix="SCH-2026-" columns={[{ key: 'name', label: 'Schedule' }, { key: 'frequency', label: 'Frequency' }, { key: 'area', label: 'Area' }, { key: 'staff', label: 'Staff' }, { key: 'status', label: 'Status' }]} fields={[{ key: 'name', label: 'Name', required: true }, { key: 'frequency', label: 'Frequency', type: 'select', options: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] }, { key: 'area', label: 'Area' }, { key: 'staff', label: 'Staff' }, { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused'] }]} />} />
            <Route path="/housekeeping-manager/checklists" element={<SimpleRegister title="Housekeeping Checklists" description="Cleaning checklist completion register. Head creates and verifies; staff complete (PDF §4.7). Separate from Maintenance checklists." storageKey="schoolerp-housekeeping-checklists-v1" seed={[{ id: 'HCL-2026-0001', title: 'Washroom morning checklist', frequency: 'DAILY', area: 'Block A Washrooms', staff: 'Lakshmi P.', dueDate: '2026-09-23', completedDate: '', checklistItems: 'Floors mopped\nSoap refilled\nBins emptied\nMirrors cleaned', pendingItems: 'Mirrors cleaned', verifiedBy: '', status: 'Pending', remarks: '' }]} idPrefix="HCL-2026-" columns={[{ key: 'title', label: 'Checklist' }, { key: 'frequency', label: 'Frequency' }, { key: 'area', label: 'Area' }, { key: 'staff', label: 'Staff' }, { key: 'dueDate', label: 'Due' }, { key: 'status', label: 'Status' }]} fields={[{ key: 'title', label: 'Title', required: true }, { key: 'frequency', label: 'Frequency', type: 'select', options: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] }, { key: 'area', label: 'Area', required: true }, { key: 'staff', label: 'Responsible Staff', required: true }, { key: 'dueDate', label: 'Due Date', type: 'date' }, { key: 'completedDate', label: 'Completed Date', type: 'date' }, { key: 'checklistItems', label: 'Checklist items (one per line)', type: 'textarea', required: true }, { key: 'pendingItems', label: 'Pending / missed items', type: 'textarea' }, { key: 'verifiedBy', label: 'Verified By' }, { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Completed', 'Verified'] }, { key: 'remarks', label: 'Remarks', type: 'textarea' }]} />} />
            <Route path="/housekeeping-manager/star-of-the-month" element={<SimpleRegister title="Star of the Month" storageKey="schoolerp-housekeeping-som-v1" seed={SOM_SEED} idPrefix="SOM-HK-2026-" statusKey="" columns={[{ key: 'employee', label: 'Employee' }, { key: 'month', label: 'Month' }, { key: 'criteria', label: 'Criteria' }, { key: 'score', label: 'Score' }, { key: 'ratedBy', label: 'Rated By' }]} fields={[{ key: 'employee', label: 'Employee', required: true }, { key: 'month', label: 'Month', required: true }, { key: 'criteria', label: 'Criteria' }, { key: 'score', label: 'Score', type: 'number' }, { key: 'remarks', label: 'Remarks' }, { key: 'ratedBy', label: 'Rated By' }]} />} />
            <Route path="/housekeeping-manager/ro-testing" element={<SimpleRegister title="RO Testing" description="Generic register. No laboratory limits were supplied." storageKey="schoolerp-housekeeping-ro-testing-v1" seed={RO_SEED} idPrefix="RO-2026-" columns={[{ key: 'date', label: 'Date' }, { key: 'location', label: 'RO Unit' }, { key: 'test', label: 'Test' }, { key: 'result', label: 'Result' }, { key: 'status', label: 'Status' }]} fields={[{ key: 'date', label: 'Date', type: 'date', required: true }, { key: 'location', label: 'Location / RO Unit', required: true }, { key: 'test', label: 'Test' }, { key: 'result', label: 'Result' }, { key: 'status', label: 'Status', type: 'select', options: ['Recorded', 'Follow-up'] }, { key: 'remarks', label: 'Remarks' }, { key: 'recordedBy', label: 'Recorded By' }]} />} />
            <Route path="/housekeeping-manager/lost-found" element={<LostFoundRegister />} />
            <Route path="/housekeeping-manager/inventory-requirement" element={<InventoryRequirement />} />
            <Route path="/housekeeping-manager/movements" element={<MovementTable rows={getMovements()} department="Housekeeping" />} />
            <Route path="/housekeeping-manager/purchase-workflow" element={<PurchaseWorkflow />} />
            <Route
                path="/housekeeping-manager/store-product-request"
                element={(
                    <RequestProductFromStore
                        department="Housekeeping"
                        requestedBy="Housekeeping Manager"
                        title="Request Product from Store"
                    />
                )}
            />
            <Route path="*" element={<Navigate to="/housekeeping-manager/dashboard" replace />} />
            {staffCommonRoutes('/housekeeping-manager', 'housekeepingManager', 'Housekeeping Manager', { leaveKey: 'housekeepingmanager' })}
            <Route path="/housekeeping-manager/audit-observations" element={<AssignedAuditObservations />} />
        </ReactRoutes>
    )
}

export default HousekeepingManagerRoutes
