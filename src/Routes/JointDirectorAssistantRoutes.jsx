import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'
import { EnterpriseOperationsRoutes } from './EnterpriseOperationsRoutes'
import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/JointDirectorAssistant/Dashboard/Dashboard'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import ViewEmployeeProfile from '../Pages/JointDirectorAssistant/EmployeeManagement/ViewEmployeeProfile'
import DriversList from '../Pages/JointDirectorAssistant/EmployeeManagement/DriversList'
import ViewDriver from '../Pages/JointDirectorAssistant/EmployeeManagement/ViewDriver'
import RequestApprovals from '../Pages/JointDirectorAssistant/RequestApprovals/RequestApprovals'
import ViewRequestApproval from '../Pages/JointDirectorAssistant/RequestApprovals/ViewRequestApproval'
import Escalations from '../Pages/JointDirectorAssistant/Escalations/Escalations'
import ViewEscalation from '../Pages/JointDirectorAssistant/Escalations/ViewEscalation'
import MeetingsCalendar from '../Pages/JointDirectorAssistant/MeetingsCalendar/MeetingsCalendar'
import AssetsInventoryOverview from '../Pages/JointDirectorAssistant/AssetsInventory/AssetsInventoryOverview'
import ViewAssetInventoryItem from '../Pages/JointDirectorAssistant/AssetsInventory/ViewAssetInventoryItem'
import AnnouncementList from '../Pages/JointDirectorAssistant/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/JointDirectorAssistant/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/JointDirectorAssistant/Announcement/ViewAnnouncement'
import FileRoomWorkspace from '../Common/FileRoom/FileRoomWorkspace'
import CCTVManagement from '../Pages/Operations/CCTV/CCTVManagement'
import PROManagement from '../Pages/Operations/PRO/PROManagement'
import CampusMaintenance from '../Pages/Operations/Maintenance/CampusMaintenance'
import PlannedOperationsCapabilities from '../Common/operations/PlannedOperationsCapabilities'

const JointDirectorAssistantRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/joint-director-assistant/dashboard" element={<Dashboard />} />
            {TaskManagementRoutes({ basePath: '/joint-director-assistant' })}
            <Route path="/joint-director-assistant/employee-management/drivers" element={<DriversList />} />
            <Route path="/joint-director-assistant/employee-management/drivers/view/:id" element={<ViewDriver />} />
            <Route path="/joint-director-assistant/employee-management/:roleKey" element={<ViewEmployeeProfile />} />
            <Route path="/joint-director-assistant/employee-management" element={<Navigate to="/joint-director-assistant/employee-management/canteen-manager" replace />} />
            <Route path="/joint-director-assistant/request-approvals" element={<RequestApprovals />} />
            <Route path="/joint-director-assistant/request-approvals/view-request" element={<ViewRequestApproval />} />
            <Route path="/joint-director-assistant/escalations" element={<Escalations />} />
            <Route path="/joint-director-assistant/escalations/view-escalation/:id" element={<ViewEscalation />} />
            <Route path="/joint-director-assistant/meetings-calendar" element={<MeetingsCalendar />} />
            <Route path="/joint-director-assistant/assets-inventory" element={<AssetsInventoryOverview />} />
            <Route path="/joint-director-assistant/assets-inventory/view/:id" element={<ViewAssetInventoryItem />} />
                        <Route path="/joint-director-assistant/file-room" element={<FileRoomWorkspace roleOverride="jointdirectorassistant" />} />
            <Route path="/joint-director-assistant/cctv-surveillance" element={<CCTVManagement />} />
            <Route path="/joint-director-assistant/public-relations" element={<PROManagement />} />
            <Route path="/joint-director-assistant/campus-maintenance" element={<CampusMaintenance />} />
            <Route path="/joint-director-assistant/operations-capabilities" element={<PlannedOperationsCapabilities />} />
            <Route path="/joint-director-assistant/broadcast" element={<AnnouncementList />} />
            <Route path="/joint-director-assistant/broadcast/add-broadcast" element={<AddAnnouncement />} />
            <Route path="/joint-director-assistant/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
                        <Route path="/joint-director-assistant/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />
            {EnterpriseOperationsRoutes({ basePath: '/joint-director-assistant', role: 'jointdirectorassistant' })}
            <Route path="*" element={<Navigate to="/joint-director-assistant/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default JointDirectorAssistantRoutes
