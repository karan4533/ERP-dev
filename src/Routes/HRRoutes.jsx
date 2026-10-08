import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/HR/Dashboard/Dashboard'
import EmployeesList from '../Pages/HR/EmployeeManagement/EmployeesList'
import EmployeeProfile from '../Pages/HR/EmployeeManagement/EmployeeProfile'
import EmployeeDocuments from '../Pages/HR/EmployeeManagement/EmployeeDocuments'
import JobOpenings from '../Pages/HR/Recruitment/JobOpenings'
import Candidates from '../Pages/HR/Recruitment/Candidates'
import Interviews from '../Pages/HR/Recruitment/Interviews'
import Onboarding from '../Pages/HR/Onboarding/Onboarding'
import Offers from '../Pages/HR/Onboarding/Offers'
import Attendance from '../Pages/HR/Attendance/Attendance'
import LeaveManagement from '../Pages/HR/LeaveManagement/LeaveManagement'
import Training from '../Pages/HR/Training/Training'
import Performance from '../Pages/HR/Performance/Performance'
import Payroll from '../Pages/HR/Payroll/Payroll'
import ChildConcession from '../Pages/HR/Payroll/ChildConcession'
import Disciplinary from '../Pages/HR/Relations/Disciplinary'
import ExitFormalities from '../Pages/HR/Exit/ExitFormalities'
import Reports from '../Pages/HR/Reports/Reports'
import Notifications from '../Pages/HR/Notifications/Notifications'
import Announcements from '../Pages/HR/Announcements/Announcements'
import AddAnnouncement from '../Pages/HR/Announcements/AddAnnouncement'
import ViewAnnouncement from '../Pages/HR/Announcements/ViewAnnouncement'
import { EMPLOYEES } from '../Pages/HR/EmployeeManagement/employeeData'

const defaultEmployeeId = EMPLOYEES[0]?.id ?? 'EMP-2026-001'

const HRRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/hr/dashboard" element={<Dashboard />} />
            <Route path="/hr/employee-management/employees" element={<EmployeesList />} />
            <Route path="/hr/employee-management/employee-profile/:id" element={<EmployeeProfile />} />
            <Route path="/hr/employee-management/employee-profile" element={<Navigate to={`/hr/employee-management/employee-profile/${defaultEmployeeId}`} replace />} />
            <Route path="/hr/employee-management/documents" element={<EmployeeDocuments />} />
            <Route path="/hr/employee-management" element={<Navigate to="/hr/employee-management/employees" replace />} />
            <Route path="/hr/recruitment/job-openings" element={<JobOpenings />} />
            <Route path="/hr/recruitment/candidates" element={<Candidates />} />
            <Route path="/hr/recruitment/interviews" element={<Interviews />} />
            <Route path="/hr/recruitment/interview-feedback" element={<Interviews />} />
            <Route path="/hr/recruitment" element={<Navigate to="/hr/recruitment/job-openings" replace />} />
            <Route path="/hr/onboarding/offers" element={<Offers />} />
            <Route path="/hr/onboarding/appointment" element={<Offers />} />
            <Route path="/hr/onboarding/joiners" element={<Onboarding />} />
            <Route path="/hr/onboarding/observations" element={<Onboarding />} />
            <Route path="/hr/onboarding/shadow-mentor" element={<Onboarding />} />
            <Route path="/hr/onboarding-checklist" element={<Onboarding />} />
            <Route path="/hr/attendance" element={<Attendance />} />
            <Route path="/hr/leave-management/policies" element={<LeaveManagement />} />
            <Route path="/hr/leave-management" element={<LeaveManagement />} />
            <Route path="/hr/training-records" element={<Training />} />
            <Route path="/hr/training-feedback" element={<Training />} />
            <Route path="/hr/training" element={<Training />} />
            <Route path="/hr/performance-comparison" element={<Performance />} />
            <Route path="/hr/performance-bsc" element={<Performance />} />
            <Route path="/hr/performance-increment" element={<Performance />} />
            <Route path="/hr/performance-review" element={<Performance />} />
            <Route path="/hr/payroll/salary-statement" element={<Payroll />} />
            <Route path="/hr/payroll/payslip" element={<Payroll />} />
            <Route path="/hr/payroll/salary-advance" element={<Payroll />} />
            <Route path="/hr/payroll/ctc" element={<Payroll />} />
            <Route path="/hr/payroll/referral-bonus" element={<Payroll />} />
            <Route path="/hr/payroll/claim-compensation" element={<Payroll />} />
            <Route path="/hr/payroll/child-concession" element={<ChildConcession />} />
            <Route path="/hr/payroll" element={<Navigate to="/hr/payroll/salary-statement" replace />} />
            <Route path="/hr/disciplinary" element={<Disciplinary />} />
            <Route path="/hr/exit" element={<ExitFormalities />} />
            <Route path="/hr/reports" element={<Reports />} />
            <Route path="/hr/notifications" element={<Notifications />} />
            <Route path="/hr/announcements/add" element={<AddAnnouncement />} />
            <Route path="/hr/announcements/view/:id" element={<ViewAnnouncement />} />
            <Route path="/hr/announcements" element={<Announcements />} />
            <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default HRRoutes
