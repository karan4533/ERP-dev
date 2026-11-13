import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/MaintenanceManager/Dashboard/Dashboard'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import Inventory from '../Pages/MaintenanceManager/Inventory/Inventory'
import AddInventory from '../Pages/MaintenanceManager/Inventory/AddInventory'
import ViewInventoryItem from '../Pages/MaintenanceManager/Inventory/ViewInventoryItem'
import RequestsApprovalsList from '../Pages/MaintenanceManager/RequestsApprovals/RequestsApprovalsList'
import AddRequest from '../Pages/MaintenanceManager/RequestsApprovals/AddRequest'
import ViewRequest from '../Pages/MaintenanceManager/RequestsApprovals/ViewRequest'
import Reports from '../Pages/MaintenanceManager/Reports/Reports'
import AnnouncementList from '../Pages/MaintenanceManager/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/MaintenanceManager/Announcement/ViewAnnouncement'
import AddAnnouncement from '../Pages/MaintenanceManager/Announcement/AddAnnouncement'
import CampusMaintenance from '../Pages/Operations/Maintenance/CampusMaintenance'
import { BuildingMaintenancePage, MaintenanceDutyPage, MovementTable, RequirementsPage, SimpleRegister } from '../Common/demoDomain/DemoScreens'
import EnterpriseRecognitionPage from '../Common/Recognition/EnterpriseRecognitionPage'
import { getMovements } from '../Common/demoDomain/inventory'
import { ProcurementBoard } from '../Common/demoDomain/WorkflowScreens'
import { EQUIPMENT_INSPECTION_SEED, MAINTENANCE_SCHEDULE_SEED } from '../Common/demoDomain/maintenance'
import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'
import { EnterpriseOperationsRoutes } from './EnterpriseOperationsRoutes'

const MaintenanceManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/maintenance-manager/dashboard" element={<Dashboard />} />
            {TaskManagementRoutes({ basePath: '/maintenance-manager' })}
            <Route path="/maintenance-manager/campus-maintenance" element={<CampusMaintenance />} />
            <Route path="/maintenance-manager/building-maintenance" element={<BuildingMaintenancePage />} />
            <Route path="/maintenance-manager/inventory" element={<Inventory />} />
            <Route path="/maintenance-manager/inventory/add-item" element={<AddInventory />} />
            <Route path="/maintenance-manager/inventory/view-item/:id" element={<ViewInventoryItem />} />
            <Route path="/maintenance-manager/requests-approvals" element={<RequestsApprovalsList />} />
            <Route path="/maintenance-manager/requests-approvals/add-request" element={<AddRequest />} />
            <Route path="/maintenance-manager/requests-approvals/view-request/:id" element={<ViewRequest />} />
            <Route path="/maintenance-manager/reports" element={<Reports />} />
            <Route path="/maintenance-manager/broadcast" element={<AnnouncementList />} />
            <Route path="/maintenance-manager/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="/maintenance-manager/broadcast/add-broadcast" element={<AddAnnouncement />} />
            <Route path="/maintenance-manager/duty-allotment" element={<MaintenanceDutyPage />} />
            <Route
                path="/maintenance-manager/schedules"
                element={
                    <SimpleRegister
                        title="Preventive Maintenance Schedules"
                        description="Daily, weekly, monthly and quarterly preventive maintenance schedules for campus electrical substations, generators, pumps, lifts and HVAC."
                        storageKey="schoolerp-maintenance-schedules-v1"
                        seed={MAINTENANCE_SCHEDULE_SEED}
                        idPrefix="MNT-SCH-"
                        columns={[
                            { key: 'name', label: 'Preventive Schedule' },
                            { key: 'category', label: 'Asset Category' },
                            { key: 'frequency', label: 'Frequency' },
                            { key: 'area', label: 'Work Area' },
                            { key: 'staff', label: 'Assigned Specialist' },
                            { key: 'status', label: 'Status' },
                        ]}
                        fields={[
                            { key: 'name', label: 'Schedule Name', required: true },
                            { key: 'category', label: 'Asset Category', type: 'select', options: ['DG GenSet & Power Backup', 'Plumbing & Water Supply', 'Renewable Energy', 'Lifts & Conveyance', 'Fire Safety & Life Support', 'Electrical HT', 'Water Storage & Potability', 'General Infrastructure'] },
                            { key: 'frequency', label: 'Frequency', type: 'select', options: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF-YEARLY', 'ANNUAL'] },
                            { key: 'area', label: 'Area / Block', required: true },
                            { key: 'staff', label: 'Assigned Specialist / Vendor', required: true },
                            { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused'] },
                        ]}
                    />
                }
            />
            <Route
                path="/maintenance-manager/equipment-inspections"
                element={
                    <SimpleRegister
                        title="Equipment & Safety Inspections"
                        description="Mandatory periodic physical and safety compliance audits for transformers, generators, booster pumps, passenger elevators and precision air conditioning."
                        storageKey="schoolerp-maintenance-inspections-v1"
                        seed={EQUIPMENT_INSPECTION_SEED}
                        idPrefix="INSP-2026-"
                        columns={[
                            { key: 'assetCode', label: 'Asset Code' },
                            { key: 'assetName', label: 'Asset / Machine Name' },
                            { key: 'category', label: 'Category' },
                            { key: 'location', label: 'Location' },
                            { key: 'inspectionDate', label: 'Inspection Date' },
                            { key: 'nextDueDate', label: 'Next Due' },
                            { key: 'inspector', label: 'Inspector' },
                            { key: 'condition', label: 'Condition' },
                            { key: 'safetyStatus', label: 'Safety Certification' },
                        ]}
                        fields={[
                            { key: 'assetCode', label: 'Asset Code', required: true },
                            { key: 'assetName', label: 'Asset / Machine Name', required: true },
                            { key: 'category', label: 'Category', type: 'select', options: ['Power Backup', 'HT Substation', 'Vertical Transportation', 'Fire Safety', 'Data Center HVAC', 'Water Treatment', 'General Utility'] },
                            { key: 'location', label: 'Location', required: true },
                            { key: 'inspectionDate', label: 'Inspection Date', type: 'date', required: true },
                            { key: 'nextDueDate', label: 'Next Due Date', type: 'date', required: true },
                            { key: 'inspector', label: 'Inspected By', required: true },
                            { key: 'findings', label: 'Detailed Technical Findings', type: 'textarea' },
                            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair - Service Needed', 'Critical - Action Required'] },
                            { key: 'safetyStatus', label: 'Safety Status', type: 'select', options: ['Certified Safe', 'Pending Review', 'Unsafe - Locked Out'] },
                            { key: 'remarks', label: 'Remarks / Next Steps', type: 'textarea' },
                        ]}
                    />
                }
            />
            <Route path="/maintenance-manager/star-of-the-month" element={<EnterpriseRecognitionPage view="som" defaultDomain="non_academic" />} />
            <Route path="/maintenance-manager/inventory-requirement" element={<RequirementsPage department="Maintenance" requestedBy="Maintenance Manager" lockDepartment />} />
            <Route path="/maintenance-manager/movements" element={<MovementTable rows={getMovements()} department="Maintenance" />} />
            <Route path="/maintenance-manager/purchase-workflow" element={<ProcurementBoard department="Maintenance" requestedBy="Maintenance Manager" />} />
            <Route path="/maintenance-manager/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />
            {EnterpriseOperationsRoutes({ basePath: '/maintenance-manager', role: 'maintenancemanager' })}
            <Route path="*" element={<Navigate to="/maintenance-manager/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default MaintenanceManagerRoutes

