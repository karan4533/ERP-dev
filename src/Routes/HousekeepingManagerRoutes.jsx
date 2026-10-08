import React from 'react'
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
import { HousekeepingDutyPage, MovementTable, RequirementsPage, SimpleRegister } from '../Common/demoDomain/DemoScreens'
import { getMovements } from '../Common/demoDomain/inventory'
import { ProcurementBoard } from '../Common/demoDomain/WorkflowScreens'
import { LOST_SEED, RO_SEED, SCHEDULE_SEED, SOM_SEED } from '../Common/demoDomain/housekeeping'

const HousekeepingManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/housekeeping-manager/dashboard" element={<Dashboard />} />
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
            <Route path="/housekeeping-manager/schedules" element={<SimpleRegister title="Recurring schedules" description="Daily, weekly, and monthly schedules. Opening the app creates today's occurrence once." storageKey="schoolerp-housekeeping-schedules-v1" seed={SCHEDULE_SEED} idPrefix="SCH-2026-" columns={[{ key: 'name', label: 'Schedule' }, { key: 'frequency', label: 'Frequency' }, { key: 'area', label: 'Area' }, { key: 'staff', label: 'Staff' }, { key: 'status', label: 'Status' }]} fields={[{ key: 'name', label: 'Name', required: true }, { key: 'frequency', label: 'Frequency', type: 'select', options: ['DAILY', 'WEEKLY', 'MONTHLY'] }, { key: 'area', label: 'Area' }, { key: 'staff', label: 'Staff' }, { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused'] }]} />} />
            <Route path="/housekeeping-manager/star-of-the-month" element={<SimpleRegister title="Star of the Month" storageKey="schoolerp-housekeeping-som-v1" seed={SOM_SEED} idPrefix="SOM-HK-2026-" statusKey="" columns={[{ key: 'employee', label: 'Employee' }, { key: 'month', label: 'Month' }, { key: 'criteria', label: 'Criteria' }, { key: 'score', label: 'Score' }, { key: 'ratedBy', label: 'Rated By' }]} fields={[{ key: 'employee', label: 'Employee', required: true }, { key: 'month', label: 'Month', required: true }, { key: 'criteria', label: 'Criteria' }, { key: 'score', label: 'Score', type: 'number' }, { key: 'remarks', label: 'Remarks' }, { key: 'ratedBy', label: 'Rated By' }]} />} />
            <Route path="/housekeeping-manager/ro-testing" element={<SimpleRegister title="RO Testing" description="Generic register. No laboratory limits were supplied." storageKey="schoolerp-housekeeping-ro-testing-v1" seed={RO_SEED} idPrefix="RO-2026-" columns={[{ key: 'date', label: 'Date' }, { key: 'location', label: 'RO Unit' }, { key: 'test', label: 'Test' }, { key: 'result', label: 'Result' }, { key: 'status', label: 'Status' }]} fields={[{ key: 'date', label: 'Date', type: 'date', required: true }, { key: 'location', label: 'Location / RO Unit', required: true }, { key: 'test', label: 'Test' }, { key: 'result', label: 'Result' }, { key: 'status', label: 'Status', type: 'select', options: ['Recorded', 'Follow-up'] }, { key: 'remarks', label: 'Remarks' }, { key: 'recordedBy', label: 'Recorded By' }]} />} />
            <Route path="/housekeeping-manager/lost-found" element={<SimpleRegister title="Lost & Found" storageKey="schoolerp-housekeeping-lost-found-v1" seed={LOST_SEED} idPrefix="LF-2026-" columns={[{ key: 'date', label: 'Date' }, { key: 'item', label: 'Item' }, { key: 'foundLocation', label: 'Found Location' }, { key: 'claimStatus', label: 'Claim Status' }]} fields={[{ key: 'date', label: 'Date', type: 'date' }, { key: 'item', label: 'Item', required: true }, { key: 'foundLocation', label: 'Found Location' }, { key: 'reportedBy', label: 'Reported By' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'claimStatus', label: 'Claim Status', type: 'select', options: ['Unclaimed', 'Claimed'] }, { key: 'claimedBy', label: 'Claimed By' }, { key: 'claimedDate', label: 'Claimed Date', type: 'date' }, { key: 'remarks', label: 'Remarks' }]} />} />
            <Route path="/housekeeping-manager/inventory-requirement" element={<RequirementsPage department="Housekeeping" requestedBy="Housekeeping Manager" lockDepartment />} />
            <Route path="/housekeeping-manager/movements" element={<MovementTable rows={getMovements()} department="Housekeeping" />} />
            <Route path="/housekeeping-manager/purchase-workflow" element={<ProcurementBoard department="Housekeeping" requestedBy="Housekeeping Manager" />} />
            <Route path="*" element={<Navigate to="/housekeeping-manager/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default HousekeepingManagerRoutes
