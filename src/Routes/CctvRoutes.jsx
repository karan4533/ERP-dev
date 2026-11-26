import React from 'react'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import CctvDashboard from '../Pages/CCTV/CctvDashboard'
import CctvCameraInventory from '../Pages/CCTV/CctvCameraInventory'
import CctvOperationalStatus from '../Pages/CCTV/CctvOperationalStatus'
import CctvFootageRequests from '../Pages/CCTV/CctvFootageRequests'
import CctvIncidentVault from '../Pages/CCTV/CctvIncidentVault'
import CctvDeliveryLogs from '../Pages/CCTV/CctvDeliveryLogs'
import CctvRetentionLogs from '../Pages/CCTV/CctvRetentionLogs'
import CctvTeachersLateReport from '../Pages/CCTV/CctvTeachersLateReport'
import CctvIssueRegister from '../Pages/CCTV/CctvIssueRegister'
import CctvPaAnnouncements from '../Pages/CCTV/CctvPaAnnouncements'
import CctvGpsHalt from '../Pages/CCTV/CctvGpsHalt'
import CctvBusLastDrop from '../Pages/CCTV/CctvBusLastDrop'
import CctvBusCameraMonitoring from '../Pages/CCTV/CctvBusCameraMonitoring'
import { EnterpriseOperationsRoutes } from './EnterpriseOperationsRoutes'
import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'

const CctvRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/cctv/dashboard" element={<CctvDashboard />} />
            <Route path="/cctv/cameras" element={<CctvCameraInventory />} />
            <Route path="/cctv/operational-status" element={<CctvOperationalStatus />} />
            <Route path="/cctv/footage-requests" element={<CctvFootageRequests />} />
            <Route path="/cctv/incident-vault" element={<CctvIncidentVault />} />
            <Route path="/cctv/delivery-logs" element={<CctvDeliveryLogs />} />
            <Route path="/cctv/retention-logs" element={<CctvRetentionLogs />} />
            <Route path="/cctv/teachers-late-report" element={<CctvTeachersLateReport />} />
            <Route path="/cctv/issue-register" element={<CctvIssueRegister />} />
            <Route path="/cctv/pa-announcements" element={<CctvPaAnnouncements />} />
            <Route path="/cctv/gps-halt" element={<CctvGpsHalt />} />
            <Route path="/cctv/bus-last-drop" element={<CctvBusLastDrop />} />
            <Route path="/cctv/bus-camera-monitoring" element={<CctvBusCameraMonitoring />} />
            <Route path="/cctv/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />

            {/* Standard Enterprise Operations */}
            {EnterpriseOperationsRoutes({ basePath: '/cctv', role: 'cctv' })}

            <Route path="*" element={<Navigate to="/cctv/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default CctvRoutes
