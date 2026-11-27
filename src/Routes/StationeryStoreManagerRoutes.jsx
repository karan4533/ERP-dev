import React from 'react'
import AssignedAuditObservations from '../Common/auditDomain/AssignedAuditObservations'
import AddGoodsReceivedPass from '../Pages/FrontOffice/GoodsReceivedPass/AddGoodsReceivedPass'
import EditGoodsReceivedPass from '../Pages/FrontOffice/GoodsReceivedPass/EditGoodsReceivedPass'
import { staffCommonRoutes } from '../Common/staffCommonRoutes'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
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
import Requirements from '../Pages/StationeryStoreManager/Requirements/Requirements'
import StockIssue from '../Pages/StationeryStoreManager/StockIssue/StockIssue'
import CriticalAlerts from '../Pages/StationeryStoreManager/CriticalAlerts/CriticalAlerts'
import PurchaseWorkflow from '../Pages/StationeryStoreManager/PurchaseWorkflow/PurchaseWorkflow'
import GoodsReceivedPassList from '../Pages/FrontOffice/GoodsReceivedPass/GoodsReceivedPassList'
import ViewGoodsReceivedPass from '../Pages/FrontOffice/GoodsReceivedPass/ViewGoodsReceivedPass'
import TcNocList from '../Pages/TransportManager/TcNoc/TcNocList'
import ViewTcNoc from '../Pages/TransportManager/TcNoc/ViewTcNoc'
import MaterialGatePassList from '../Pages/FrontOffice/MaterialGatePass/MaterialGatePassList'
import AddMaterialGatePass from '../Pages/FrontOffice/MaterialGatePass/AddMaterialGatePass'
import EditMaterialGatePass from '../Pages/FrontOffice/MaterialGatePass/EditMaterialGatePass'
import ViewMaterialGatePass from '../Pages/FrontOffice/MaterialGatePass/ViewMaterialGatePass'
import DepartmentTicketsPage from '../Common/Tickets/DepartmentTicketsPage'
import ViewSupportTicket from '../Pages/ITSupportManager/SupportTickets/ViewSupportTicket'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'

const StationeryStoreManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/stationery-store-manager/dashboard" element={<Dashboard />} />
            {TaskManagementRoutes({ basePath: '/stationery-store-manager' })}
            <Route
                path="/stationery-store-manager/tickets"
                element={(
                    <DepartmentTicketsPage
                        defaultDepartment="Stationery Store"
                        listBasePath="/stationery-store-manager/tickets"
                        title="Stationery Tickets"
                    />
                )}
            />
            <Route path="/stationery-store-manager/tickets/view-ticket/:id" element={<ViewSupportTicket />} />
            <Route path="/stationery-store-manager/inventory" element={<Inventory />} />
            <Route path="/stationery-store-manager/inventory/add-item" element={<AddInventory />} />
            <Route path="/stationery-store-manager/inventory/view-item/:id" element={<ViewInventoryItem />} />
            <Route path="/stationery-store-manager/issue-returns" element={<IssueReturnsList />} />
            <Route path="/stationery-store-manager/issue-returns/add" element={<AddIssueReturn />} />
            <Route path="/stationery-store-manager/issue-returns/view/:id" element={<ViewIssueReturn />} />
            <Route path="/stationery-store-manager/material-gate-pass" element={<MaterialGatePassList />} />
            <Route path="/stationery-store-manager/material-gate-pass/add" element={<AddMaterialGatePass />} />
            <Route path="/stationery-store-manager/material-gate-pass/view/:id" element={<ViewMaterialGatePass />} />
            <Route path="/stationery-store-manager/material-gate-pass/edit/:id" element={<EditMaterialGatePass />} />
            <Route path="/stationery-store-manager/requests-approvals" element={<RequestsApprovalsList />} />
            <Route path="/stationery-store-manager/requests-approvals/add-request" element={<AddRequest />} />
            <Route path="/stationery-store-manager/requests-approvals/view-request/:id" element={<ViewRequest />} />
            <Route path="/stationery-store-manager/reports" element={<Reports />} />
            <Route path="/stationery-store-manager/broadcast" element={<AnnouncementList />} />
            <Route path="/stationery-store-manager/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="/stationery-store-manager/requirements" element={<Requirements />} />
            <Route path="/stationery-store-manager/stock-issue" element={<StockIssue />} />
            <Route path="/stationery-store-manager/critical-alerts" element={<CriticalAlerts />} />
            <Route path="/stationery-store-manager/purchase-workflow" element={<PurchaseWorkflow />} />
            <Route path="/stationery-store-manager/goods-received-pass" element={<GoodsReceivedPassList />} />
            <Route path="/stationery-store-manager/goods-received-pass/view/:id" element={<ViewGoodsReceivedPass />} />
            <Route path="/stationery-store-manager/goods-received-pass/add" element={<AddGoodsReceivedPass />} />
            <Route path="/stationery-store-manager/goods-received-pass/edit/:id" element={<EditGoodsReceivedPass />} />
            <Route path="/stationery-store-manager/tc-noc" element={<TcNocList />} />
            <Route path="/stationery-store-manager/tc-noc/view/:id" element={<ViewTcNoc />} />
            <Route path="*" element={<Navigate to="/stationery-store-manager/dashboard" replace />} />
            {staffCommonRoutes('/stationery-store-manager', 'stationeryStoreManager', 'Store', { leaveKey: 'stationerystoremanager' })}
            <Route path="/stationery-store-manager/audit-observations" element={<AssignedAuditObservations />} />
        </ReactRoutes>
    )
}

export default StationeryStoreManagerRoutes
