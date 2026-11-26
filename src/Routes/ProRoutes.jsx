import React from 'react'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import ProDashboard from '../Pages/PRO/ProDashboard'
import ProComplianceCalendar from '../Pages/PRO/ProComplianceCalendar'
import ProCorrespondence from '../Pages/PRO/ProCorrespondence'
import ProAffiliations from '../Pages/PRO/ProAffiliations'
import ProPermits from '../Pages/PRO/ProPermits'
import ProInspections from '../Pages/PRO/ProInspections'
import ProFileRoomLinkages from '../Pages/PRO/ProFileRoomLinkages'
import ProChallans from '../Pages/PRO/ProChallans'
import ProErpDataHandover from '../Pages/PRO/ProErpDataHandover'
import ProDailyWorkUpdate from '../Pages/PRO/ProDailyWorkUpdate'
import { EnterpriseOperationsRoutes } from './EnterpriseOperationsRoutes'
import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'

const ProRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/pro/dashboard" element={<ProDashboard />} />
            <Route path="/pro/statutory-calendar" element={<ProComplianceCalendar />} />
            <Route path="/pro/correspondence" element={<ProCorrespondence />} />
            <Route path="/pro/affiliations" element={<ProAffiliations />} />
            <Route path="/pro/permits" element={<ProPermits />} />
            <Route path="/pro/inspections" element={<ProInspections />} />
            <Route path="/pro/file-room" element={<ProFileRoomLinkages />} />
            <Route path="/pro/challans" element={<ProChallans />} />
            <Route path="/pro/erp-data-handover" element={<ProErpDataHandover />} />
            <Route path="/pro/daily-work-update" element={<ProDailyWorkUpdate />} />
            <Route path="/pro/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />

            {/* Standard Enterprise Operations */}
            {EnterpriseOperationsRoutes({ basePath: '/pro', role: 'pro' })}

            <Route path="*" element={<Navigate to="/pro/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default ProRoutes
