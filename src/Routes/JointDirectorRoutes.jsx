import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/JointDirector/Dashboard/Dashboard'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import ViewEmployeeProfile from '../Pages/JointDirector/EmployeeManagement/ViewEmployeeProfile'
import DriversList from '../Pages/JointDirector/EmployeeManagement/DriversList'
import ViewDriver from '../Pages/JointDirector/EmployeeManagement/ViewDriver'
import RequestApprovals from '../Pages/JointDirector/RequestApprovals/RequestApprovals'
import ViewRequestApproval from '../Pages/JointDirector/RequestApprovals/ViewRequestApproval'
import Escalations from '../Pages/JointDirector/Escalations/Escalations'
import ViewEscalation from '../Pages/JointDirector/Escalations/ViewEscalation'
import MeetingsCalendar from '../Pages/JointDirector/MeetingsCalendar/MeetingsCalendar'
import AssetsInventoryOverview from '../Pages/JointDirector/AssetsInventory/AssetsInventoryOverview'
import ViewAssetInventoryItem from '../Pages/JointDirector/AssetsInventory/ViewAssetInventoryItem'
import AnnouncementList from '../Pages/JointDirector/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/JointDirector/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/JointDirector/Announcement/ViewAnnouncement'

const JointDirectorRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/joint-director/dashboard" element={<Dashboard />} />
            {TaskManagementRoutes({ basePath: '/joint-director' })}
            <Route path="/joint-director/employee-management/drivers" element={<DriversList />} />
            <Route path="/joint-director/employee-management/drivers/view/:id" element={<ViewDriver />} />
            <Route path="/joint-director/employee-management/:roleKey" element={<ViewEmployeeProfile />} />
            <Route path="/joint-director/employee-management" element={<Navigate to="/joint-director/employee-management/jd-assistant" replace />} />
            <Route path="/joint-director/request-approvals" element={<RequestApprovals />} />
            <Route path="/joint-director/request-approvals/view-request" element={<ViewRequestApproval />} />
            <Route path="/joint-director/escalations" element={<Escalations />} />
            <Route path="/joint-director/escalations/view-escalation/:id" element={<ViewEscalation />} />
            <Route path="/joint-director/meetings-calendar" element={<MeetingsCalendar />} />
            <Route path="/joint-director/assets-inventory" element={<AssetsInventoryOverview />} />
            <Route path="/joint-director/assets-inventory/view/:id" element={<ViewAssetInventoryItem />} />
            <Route path="/joint-director/broadcast" element={<AnnouncementList />} />
            <Route path="/joint-director/broadcast/add-broadcast" element={<AddAnnouncement />} />
            <Route path="/joint-director/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            <Route path="*" element={<Navigate to="/joint-director/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default JointDirectorRoutes
