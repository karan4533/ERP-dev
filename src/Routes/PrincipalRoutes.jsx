import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/Principal/Dashboard/Dashboard'
import StarRatings from '../Pages/Principal/StarRatings/StarRatings'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import AddRatings from '../Pages/Principal/StarRatings/AddRatings'
import ExaminationTimetableList from '../Pages/Principal/ExaminationTimetable/ExaminationTimetableList'
import CreateExaminationTimetable from '../Pages/Principal/ExaminationTimetable/CreateExaminationTimetable'
import ClassTimetableList from '../Pages/Principal/ClassTimetable/ClassTimetableList'
import CreateClassTimetable from '../Pages/Principal/ClassTimetable/CreateClassTimetable'
import StudentDatabaseList from '../Pages/Principal/UserManagement/StudentDatabase/StudentsList'
import ViewStudentDatabase from '../Pages/Principal/UserManagement/StudentDatabase/ViewStudent'
import EmployeeDatabaseList from '../Pages/Principal/UserManagement/EmployeeDatabase/EmployeesList'
import ViewEmployeeDatabase from '../Pages/Principal/UserManagement/EmployeeDatabase/ViewEmployee'
import StudentLMS from '../Pages/Principal/LMS/StudentLMS'
import TeacherLMS from '../Pages/Principal/LMS/TeacherLMS'
import ViewStudentLMS from '../Pages/Principal/LMS/ViewStudentLMS'
import ViewTeacherLMS from '../Pages/Principal/LMS/ViewTeacherLMS'
import EscalationList from '../Pages/Principal/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/Principal/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/Principal/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/Principal/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/Principal/AcademicCalendar/AcademicCalendar'
import TeacherAllocationList from '../Pages/Principal/TeacherAllocation/TeacherAllocationList'
import AllocateTeacher from '../Pages/Principal/TeacherAllocation/AllocateTeacher'
import ViewTeacherAllocation from '../Pages/Principal/TeacherAllocation/ViewTeacherAllocation'
import EditTeacherAllocation from '../Pages/Principal/TeacherAllocation/EditTeacherAllocation'
import Notifications from '../Pages/Principal/Notifications/Notifications'
import MyLeaveRequests from '../Pages/Principal/LeaveRequest/MyLeaveRequests'
import AddLeaveRequest from '../Pages/Principal/LeaveRequest/AddLeaveRequest'
import ViewMyLeaveRequest from '../Pages/Principal/LeaveRequest/ViewMyLeaveRequest'
import ReceivedLeaveRequests from '../Pages/Principal/LeaveRequest/ReceivedLeaveRequests'
import ViewReceivedLeaveRequest from '../Pages/Principal/LeaveRequest/ViewReceivedLeaveRequest'
import ExtraClass from '../Pages/Teacher/ExtraClass/ExtraClass'
import AddExtraClass from '../Pages/Teacher/ExtraClass/AddExtraClass'
import AnnouncementList from '../Pages/Principal/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/Principal/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/Principal/Announcement/ViewAnnouncement'
import MyAttendance from '../Pages/Principal/Attendance/MyAttendance'
import PrincipalStudentAllocationApproval from '../Pages/Principal/StudentAllocation/PrincipalStudentAllocationApproval'
import StudentAllocationDetail from '../Common/StudentAllocation/StudentAllocationDetail'

const PrincipalRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/principal/dashboard" element={<Dashboard />} />
            <Route path="/principal/attendance" element={<Navigate to="/principal/attendance/my-attendance" replace />} />
            <Route path="/principal/attendance/my-attendance" element={<MyAttendance />} />
            {TaskManagementRoutes({ basePath: '/principal' })}
            <Route path="/principal/star-ratings/star-of-month" element={<StarRatings view="som" />} />
            <Route path="/principal/star-ratings/star-of-year" element={<StarRatings view="soy" />} />
            <Route path="/principal/star-ratings/add-ratings" element={<AddRatings />} />
            <Route path="/principal/star-ratings-list" element={<Navigate to="/principal/star-ratings/star-of-month" replace />} />
            <Route path="/principal/examination-timetable" element={<ExaminationTimetableList />} />
            <Route path="/principal/create-examination-timetable" element={<CreateExaminationTimetable />} />
            <Route path="/principal/class-timetable" element={<ClassTimetableList />} />
            <Route path="/principal/create-class-timetable" element={<CreateClassTimetable />} />
            <Route path="/principal/user-management/student-database" element={<StudentDatabaseList />} />
            <Route path="/principal/user-management/student-database/view/:id" element={<ViewStudentDatabase />} />
            <Route path="/principal/user-management/employee-database" element={<EmployeeDatabaseList />} />
            <Route path="/principal/user-management/employee-database/view/:id" element={<ViewEmployeeDatabase />} />
            <Route path="/principal/students/student-details-list" element={<Navigate to="/principal/user-management/student-database" replace />} />
            <Route path="/principal/students/view-student" element={<Navigate to="/principal/user-management/student-database" replace />} />
            <Route path="/principal/employees-management/teachers" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/view-teacher" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/coordinators" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/view-coordinator" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/front-office" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/view-front-office" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/librarians" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/view-librarian" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/gatekeeper-manager" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/view-gatekeeper-manager" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/gatekeepers" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/employees-management/view-gatekeeper" element={<Navigate to="/principal/user-management/employee-database" replace />} />
            <Route path="/principal/lms/student-lms" element={<StudentLMS />} />
            <Route path="/principal/lms/view-student-lms" element={<ViewStudentLMS />} />
            <Route path="/principal/lms/teacher-lms" element={<TeacherLMS />} />
            <Route path="/principal/lms/view-teacher-lms" element={<ViewTeacherLMS />} />
            <Route path="/principal/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/principal/notifications" element={<Notifications />} />
            <Route path="/principal/announcement" element={<AnnouncementList />} />
            <Route path="/principal/announcement/add" element={<AddAnnouncement />} />
            <Route path="/principal/announcement/view/:id" element={<ViewAnnouncement />} />
            <Route path="/principal/academic/teacher-allocation" element={<TeacherAllocationList />} />
            <Route path="/principal/academic/teacher-allocation/allocate/:employeeId" element={<AllocateTeacher />} />
            <Route path="/principal/academic/teacher-allocation/view/:employeeId" element={<ViewTeacherAllocation />} />
            <Route path="/principal/academic/teacher-allocation/edit/:employeeId" element={<EditTeacherAllocation />} />
            <Route path="/principal/student-allocation-approval" element={<PrincipalStudentAllocationApproval />} />
            <Route path="/principal/student-allocation-approval/allocate/:id" element={<StudentAllocationDetail />} />
            <Route path="/principal/student-allocation-approval/review/:id" element={<StudentAllocationDetail />} />
            <Route path="/principal/communication" element={<Navigate to="/principal/communication/inbox" replace />} />
            <Route path="/principal/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/principal/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/principal/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/principal/communication/inbox" />} />
            <Route path="/principal/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/principal/communication/inbox" />} />
            <Route path="/principal/escalation-management" element={<EscalationList />} />
            <Route path="/principal/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/principal/escalation-management/view/:id" element={<ViewEscalation />} />
            <Route path="/principal/leave-request/my-requests" element={<MyLeaveRequests />} />
            <Route path="/principal/leave-request/my-requests/add" element={<AddLeaveRequest />} />
            <Route path="/principal/leave-request/my-requests/view/:id" element={<ViewMyLeaveRequest />} />
            <Route path="/principal/leave-request/received" element={<ReceivedLeaveRequests />} />
            <Route path="/principal/leave-request/received/view/:id" element={<ViewReceivedLeaveRequest />} />
            <Route path="/principal/class/extra-class" element={<ExtraClass canCreate listPath="/principal/class/extra-class" addPath="/principal/class/extra-class/add" />} />
            <Route path="/principal/class/extra-class/add" element={<AddExtraClass listPath="/principal/class/extra-class" />} />
            <Route path="*" element={<Navigate to="/principal/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default PrincipalRoutes
