import React from 'react'
import { staffCommonRoutes } from '../Common/staffCommonRoutes'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import CameraRegister from '../Pages/Admin/CameraManagement/CameraRegister'
import Dashboard from '../Pages/CctvRoom/Dashboard/Dashboard'
import PendingFeature from '../Pages/CctvRoom/PendingFeature'
import SchoolLocations from '../Pages/CctvRoom/SchoolLocations/SchoolLocations'
import FootageRequests from '../Pages/CctvRoom/FootageRequests/FootageRequests'
import CameraStatus from '../Pages/CctvRoom/CameraStatus/CameraStatus'

const CctvRoomRoutes = () => (
    <ReactRoutes>
        <Route path="/cctv-room/dashboard" element={<Dashboard />} />
        <Route
            path="/cctv-room/live-monitoring"
            element={(
                <PendingFeature
                    title="Live Monitoring"
                    description="The ERP does not embed live CCTV video. View streams in the school NVR/VMS when configured. No feed is simulated here."
                />
            )}
        />
        <Route path="/cctv-room/camera-management" element={<CameraRegister canEdit={false} />} />
        <Route path="/cctv-room/camera-status" element={<CameraStatus />} />
        <Route path="/cctv-room/footage-requests" element={<FootageRequests />} />
        <Route
            path="/cctv-room/recording-playback"
            element={(
                <PendingFeature
                    title="Recording & Playback"
                    description="Recording and playback remain on the school NVR/VMS. Use Footage Requests to log clip provision in the ERP."
                />
            )}
        />
        <Route
            path="/cctv-room/incident-management"
            element={(
                <PendingFeature
                    title="Incident Management"
                    description="Dedicated incident tickets are not separate from footage requests yet. Use Footage Requests and mark sensitive cases for MD approval."
                />
            )}
        />
        <Route
            path="/cctv-room/alerts-events"
            element={(
                <PendingFeature
                    title="Alerts & Events"
                    description="Camera alerts and security events are not wired. Alert counts are not fabricated."
                />
            )}
        />
        <Route path="/cctv-room/school-locations" element={<SchoolLocations />} />
        <Route
            path="/cctv-room/security-reports"
            element={(
                <PendingFeature
                    title="Security Reports"
                    description="Aggregated security reporting has no dedicated backend yet."
                />
            )}
        />
        <Route
            path="/cctv-room/audit-logs"
            element={(
                <PendingFeature
                    title="Access Logs"
                    description="Per-request access logs are stored on each Footage Request row. A campus-wide CCTV audit export is not built yet."
                />
            )}
        />
        <Route
            path="/cctv-room/settings"
            element={(
                <PendingFeature
                    title="Settings"
                    description="Footage retention period is a recommended setting (30–60 days) and is not configured in-app yet."
                />
            )}
        />

        <Route path="/cctv-room" element={<Navigate to="/cctv-room/dashboard" replace />} />
        <Route path="/cctv-room/*" element={<Navigate to="/cctv-room/dashboard" replace />} />
        {staffCommonRoutes('/cctv-room', 'cctvRoom', 'CCTV Room', { leaveKey: 'cctv' })}
    </ReactRoutes>
)

export default CctvRoomRoutes
