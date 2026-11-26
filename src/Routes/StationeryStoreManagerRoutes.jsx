import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'
import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import { EnterpriseOperationsRoutes } from './EnterpriseOperationsRoutes'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import StoresProcurementWorkspace from '../Common/StoresProcurement/StoresProcurementWorkspace'
import Dashboard from '../Pages/StationeryStoreManager/Dashboard/Dashboard'
import Inventory from '../Pages/StationeryStoreManager/Inventory/Inventory'
import AddInventory from '../Pages/StationeryStoreManager/Inventory/AddInventory'
import ViewInventoryItem from '../Pages/StationeryStoreManager/Inventory/ViewInventoryItem'
import IssueReturnsList from '../Pages/StationeryStoreManager/IssueReturns/IssueReturnsList'
import AddIssueReturn from '../Pages/StationeryStoreManager/IssueReturns/AddIssueReturn'
import ViewIssueReturn from '../Pages/StationeryStoreManager/IssueReturns/ViewIssueReturn'
import RequestsApprovalsList from '../Pages/StationeryStoreManager/RequestsApprovals/RequestsApprovalsList'
import AddRequest from '../Pages/StationeryStoreManager/RequestsApprovals/AddRequest'
import ViewRequest from '../Pages/StationeryStoreManager/RequestsApprovals/ViewRequest'
import Reports from '../Pages/StationeryStoreManager/Reports/Reports'
import AnnouncementList from '../Pages/StationeryStoreManager/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/StationeryStoreManager/Announcement/ViewAnnouncement'

const StationeryStoreManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/stationery-store-manager/dashboard" element={<Dashboard />} />
            
            {/* Enterprise Stores & Procurement Workspace */}
            <Route path="/stationery-store-manager/workspace" element={<StoresProcurementWorkspace roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/inventory" element={<StoresProcurementWorkspace defaultTab="inventory" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/inventory/add-item" element={<AddInventory />} />
            <Route path="/stationery-store-manager/inventory/view-item/:id" element={<ViewInventoryItem />} />
            <Route path="/stationery-store-manager/issue-returns" element={<StoresProcurementWorkspace defaultTab="requisitions" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/issue-returns/add" element={<AddIssueReturn />} />
            <Route path="/stationery-store-manager/issue-returns/view/:id" element={<ViewIssueReturn />} />
            <Route path="/stationery-store-manager/requests-approvals" element={<StoresProcurementWorkspace defaultTab="requisitions" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/requests-approvals/add-request" element={<AddRequest />} />
            <Route path="/stationery-store-manager/requests-approvals/view-request/:id" element={<ViewRequest />} />
            <Route path="/stationery-store-manager/stock-operations" element={<StoresProcurementWorkspace defaultTab="overview" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/reports" element={<StoresProcurementWorkspace defaultTab="reports" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/broadcast" element={<AnnouncementList />} />
            <Route path="/stationery-store-manager/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="/stationery-store-manager/requirements" element={<StoresProcurementWorkspace defaultTab="requirements" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/stock-issue" element={<StoresProcurementWorkspace defaultTab="requisitions" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/critical-alerts" element={<StoresProcurementWorkspace defaultTab="requirements" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/purchase-workflow" element={<StoresProcurementWorkspace defaultTab="purchase-orders" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/goods-received-pass-list" element={<StoresProcurementWorkspace defaultTab="goods-received-passes" roleOverride="stationery-store-manager" />} />
            <Route path="/stationery-store-manager/material-gate-pass-list" element={<StoresProcurementWorkspace defaultTab="material-gate-passes" roleOverride="stationery-store-manager" />} />

            {/* Universal Task Management */}
            {TaskManagementRoutes({ basePath: '/stationery-store-manager' })}

            {/* Enterprise Functional Operations (Stores, Gate Pass, File Room, Ticketing, Monitoring, Lost & Found) */}
            {EnterpriseOperationsRoutes({ basePath: '/stationery-store-manager', role: 'stationery-store-manager' })}

                        <Route path="/stationery-store-manager/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />
            <Route path="*" element={<Navigate to="/stationery-store-manager/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default StationeryStoreManagerRoutes
