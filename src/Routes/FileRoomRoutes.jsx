import React from 'react'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import FileRoomDashboard from '../Pages/FileRoom/FileRoomDashboard'
import FileRoomRepository from '../Pages/FileRoom/FileRoomRepository'
import FileRoomStorageMapping from '../Pages/FileRoom/FileRoomStorageMapping'
import FileRoomCheckoutRegister from '../Pages/FileRoom/FileRoomCheckoutRegister'
import FileRoomAccessApprovals from '../Pages/FileRoom/FileRoomAccessApprovals'
import FileRoomMovementLogs from '../Pages/FileRoom/FileRoomMovementLogs'
import FileRoomRetentionAudit from '../Pages/FileRoom/FileRoomRetentionAudit'
import FileRoomReportsActivity from '../Pages/FileRoom/FileRoomReportsActivity'
import { EnterpriseOperationsRoutes } from './EnterpriseOperationsRoutes'
import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'

const FileRoomRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/file-room/dashboard" element={<FileRoomDashboard />} />
            <Route path="/file-room/documents" element={<FileRoomRepository />} />
            <Route path="/file-room/storage-mapping" element={<FileRoomStorageMapping />} />
            <Route path="/file-room/checkout-register" element={<FileRoomCheckoutRegister />} />
            <Route path="/file-room/access-approvals" element={<FileRoomAccessApprovals />} />
            <Route path="/file-room/movement-logs" element={<FileRoomMovementLogs />} />
            <Route path="/file-room/retention-audit" element={<FileRoomRetentionAudit />} />
            <Route path="/file-room/reports-activity" element={<FileRoomReportsActivity />} />
            <Route path="/file-room/activity-reports" element={<FileRoomReportsActivity />} />
            <Route path="/file-room/reports" element={<FileRoomReportsActivity />} />
            <Route path="/file-room/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />

            {/* Standard Enterprise Operations */}
            {EnterpriseOperationsRoutes({ basePath: '/file-room', role: 'fileroom' })}

            <Route path="*" element={<Navigate to="/file-room/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default FileRoomRoutes
