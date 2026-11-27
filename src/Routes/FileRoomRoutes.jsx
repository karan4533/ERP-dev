import React from 'react'
import AssignedAuditObservations from '../Common/auditDomain/AssignedAuditObservations'
import { staffCommonRoutes } from '../Common/staffCommonRoutes'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import Dashboard from '../Pages/FileRoom/Dashboard/Dashboard'
import PendingFeature from '../Pages/FileRoom/PendingFeature'
import FileRegister from '../Pages/FileRoom/FileRegister/FileRegister'
import FileRequests from '../Pages/FileRoom/FileRequests/FileRequests'
import FileManagement from '../Pages/Admin/FileManagement/FileManagement'
import StudentDocuments from '../Pages/Admin/Documents/StudentDocuments/StudentDocuments'
import AddStudentDocuments from '../Pages/Admin/Documents/StudentDocuments/AddStudentDocuments'
import ViewStudentDocuments from '../Pages/Admin/Documents/StudentDocuments/ViewStudentDocuments'
import EditStudentDocuments from '../Pages/Admin/Documents/StudentDocuments/EditStudentDocuments'
import EmployeeDocuments from '../Pages/Admin/Documents/EmployeeDocuments/EmployeeDocuments'
import AddEmployeeDocuments from '../Pages/Admin/Documents/EmployeeDocuments/AddEmployeeDocuments'
import EditEmployeeDocuments from '../Pages/Admin/Documents/EmployeeDocuments/EditEmployeeDocuments'
import {
    FILE_ROOM_EMPLOYEE_DOCUMENT_PATHS,
    FILE_ROOM_STUDENT_DOCUMENT_PATHS,
} from '../Pages/Admin/Documents/documentRoutePaths'

const FileRoomRoutes = () => (
    <ReactRoutes>
        <Route path="/file-room/dashboard" element={<Dashboard />} />
        <Route path="/file-room/file-management" element={<FileManagement />} />

        <Route
            path="/file-room/student-records"
            element={<StudentDocuments paths={FILE_ROOM_STUDENT_DOCUMENT_PATHS} />}
        />
        <Route
            path="/file-room/student-records/add"
            element={<AddStudentDocuments paths={FILE_ROOM_STUDENT_DOCUMENT_PATHS} />}
        />
        <Route
            path="/file-room/student-records/view/:id"
            element={<ViewStudentDocuments paths={FILE_ROOM_STUDENT_DOCUMENT_PATHS} />}
        />
        <Route
            path="/file-room/student-records/edit/:id"
            element={<EditStudentDocuments paths={FILE_ROOM_STUDENT_DOCUMENT_PATHS} />}
        />

        <Route
            path="/file-room/staff-records"
            element={<EmployeeDocuments paths={FILE_ROOM_EMPLOYEE_DOCUMENT_PATHS} />}
        />
        <Route
            path="/file-room/staff-records/add"
            element={<AddEmployeeDocuments paths={FILE_ROOM_EMPLOYEE_DOCUMENT_PATHS} />}
        />
        <Route
            path="/file-room/staff-records/edit/:id"
            element={<EditEmployeeDocuments paths={FILE_ROOM_EMPLOYEE_DOCUMENT_PATHS} />}
        />

        <Route path="/file-room/file-register" element={<FileRegister />} />
        <Route path="/file-room/file-requests" element={<FileRequests />} />
        <Route path="/file-room/search-retrieval" element={<FileRegister />} />
        <Route
            path="/file-room/archive-disposal"
            element={(
                <PendingFeature
                    title="Archive & Disposal"
                    description="Set status to Archived or Disposed on File Register rows. Formal retention-policy automation is still proposed in the Non-Academics draft."
                />
            )}
        />
        <Route
            path="/file-room/activity-reports"
            element={(
                <PendingFeature
                    title="Activity & Reports"
                    description="Use File Requests and File Register lists for operational activity. A dedicated reporting export API is not delivered yet."
                />
            )}
        />
        <Route
            path="/file-room/settings"
            element={(
                <PendingFeature
                    title="Settings"
                    description="File Room settings have not been specified beyond confidentiality-at-entry (implemented on File Register)."
                />
            )}
        />

        <Route path="/file-room" element={<Navigate to="/file-room/dashboard" replace />} />
        <Route path="/file-room/*" element={<Navigate to="/file-room/dashboard" replace />} />
        {staffCommonRoutes('/file-room', 'fileRoom', 'File Room', { leaveKey: 'fileroom' })}
        <Route path="/file-room/audit-observations" element={<AssignedAuditObservations />} />
    </ReactRoutes>
)

export default FileRoomRoutes
