import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/ITSupportManager/Dashboard/Dashboard'
import AssetManagement from '../Pages/ITSupportManager/AssetManagement/AssetManagement'
import AddAsset from '../Pages/ITSupportManager/AssetManagement/AddAsset'
import ViewAsset from '../Pages/ITSupportManager/AssetManagement/ViewAsset'
import SupportTicketsList from '../Pages/ITSupportManager/SupportTickets/SupportTicketsList'
import ViewSupportTicket from '../Pages/ITSupportManager/SupportTickets/ViewSupportTicket'
import RequestsApprovalsList from '../Pages/ITSupportManager/RequestsApprovals/RequestsApprovalsList'
import AddRequest from '../Pages/ITSupportManager/RequestsApprovals/AddRequest'
import ViewRequest from '../Pages/ITSupportManager/RequestsApprovals/ViewRequest'
import Reports from '../Pages/ITSupportManager/Reports/Reports'
import AnnouncementList from '../Pages/ITSupportManager/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/ITSupportManager/Announcement/ViewAnnouncement'
import AddAnnouncement from '../Pages/ITSupportManager/Announcement/AddAnnouncement'
import MaintenanceInventory from '../Pages/ITSupportManager/MaintenanceInventory/MaintenanceInventory'
import { AssetImportPage } from '../Common/demoDomain/DemoScreens'
import { ProcurementBoard } from '../Common/demoDomain/WorkflowScreens'

const ITSupportManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/it-support-manager/dashboard" element={<Dashboard />} />
            <Route path="/it-support-manager/maintenance-inventory" element={<MaintenanceInventory />} />
            <Route path="/it-support-manager/asset-management" element={<AssetManagement />} />
            <Route path="/it-support-manager/asset-management/add-asset" element={<AddAsset />} />
            <Route path="/it-support-manager/asset-management/view-asset/:id" element={<ViewAsset />} />
            <Route path="/it-support-manager/support-tickets" element={<SupportTicketsList />} />
            <Route path="/it-support-manager/support-tickets/view-ticket/:id" element={<ViewSupportTicket />} />
            <Route path="/it-support-manager/requests-approvals" element={<RequestsApprovalsList />} />
            <Route path="/it-support-manager/requests-approvals/add-request" element={<AddRequest />} />
            <Route path="/it-support-manager/requests-approvals/view-request/:id" element={<ViewRequest />} />
            <Route path="/it-support-manager/reports" element={<Reports />} />
            <Route path="/it-support-manager/broadcast" element={<AnnouncementList />} />
            <Route path="/it-support-manager/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="/it-support-manager/broadcast/add-broadcast" element={<AddAnnouncement />} />
            <Route path="/it-support-manager/data-import" element={<AssetImportPage />} />
            <Route path="/it-support-manager/purchase-workflow" element={<ProcurementBoard department="IT Support" requestedBy="IT Support Manager" />} />
            <Route path="*" element={<Navigate to="/it-support-manager/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default ITSupportManagerRoutes
