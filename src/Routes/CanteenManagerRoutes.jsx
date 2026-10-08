import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/CanteenManager/Dashboard/Dashboard'
import MenuManagement from '../Pages/CanteenManager/MenuManagement/MenuManagement'
import ViewMenuItem from '../Pages/CanteenManager/MenuManagement/ViewMenuItem'
import AddMenuItem from '../Pages/CanteenManager/MenuManagement/AddMenuItem'
import Inventory from '../Pages/CanteenManager/Inventory/Inventory'
import Orders from '../Pages/CanteenManager/Orders/Orders'
import ViewOrder from '../Pages/CanteenManager/Orders/ViewOrder'
import AddOrder from '../Pages/CanteenManager/Orders/AddOrder'
import RequestsApprovalsList from '../Pages/CanteenManager/RequestsApprovals/RequestsApprovalsList'
import AddRequest from '../Pages/CanteenManager/RequestsApprovals/AddRequest'
import ViewRequest from '../Pages/CanteenManager/RequestsApprovals/ViewRequest'
import Reports from '../Pages/CanteenManager/Reports/Reports'
import AnnouncementList from '../Pages/CanteenManager/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/CanteenManager/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/CanteenManager/Announcement/ViewAnnouncement'

const CanteenManagerRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/canteen-manager/dashboard" element={<Dashboard />} />
            <Route path="/canteen-manager/menu-management" element={<MenuManagement />} />
            <Route path="/canteen-manager/menu-management/add-menu-item" element={<AddMenuItem />} />
            <Route path="/canteen-manager/menu-management/view-menu/:id" element={<ViewMenuItem />} />
            <Route path="/canteen-manager/inventory" element={<Inventory />} />
            <Route path="/canteen-manager/orders" element={<Orders />} />
            <Route path="/canteen-manager/orders/add-order" element={<AddOrder />} />
            <Route path="/canteen-manager/orders/view-order/:id" element={<ViewOrder />} />
            <Route path="/canteen-manager/requests-approvals" element={<RequestsApprovalsList />} />
            <Route path="/canteen-manager/requests-approvals/add-request" element={<AddRequest />} />
            <Route path="/canteen-manager/requests-approvals/view-request/:id" element={<ViewRequest />} />
            <Route path="/canteen-manager/reports" element={<Reports />} />
            <Route path="/canteen-manager/broadcast" element={<AnnouncementList />} />
            <Route path="/canteen-manager/broadcast/add-broadcast" element={<AddAnnouncement />} />
            <Route path="/canteen-manager/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="*" element={<Navigate to="/canteen-manager/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default CanteenManagerRoutes
