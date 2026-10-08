import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/Director/Dashboard/Dashboard'
import AnnouncementList from '../Pages/Director/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/Director/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/Director/Announcement/ViewAnnouncement'
import StarRatings from '../Pages/Director/StarRatings/StarRatings'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import AddRatings from '../Pages/Director/StarRatings/AddRatings'
import ExamApprovals from '../Pages/Director/ExamApprovals/ExamApprovals'
import StudentDatabaseList from '../Pages/Director/UserManagement/StudentDatabase/StudentsList'
import ViewStudentDatabase from '../Pages/Director/UserManagement/StudentDatabase/ViewStudent'
import EmployeeDatabaseList from '../Pages/Director/UserManagement/EmployeeDatabase/EmployeesList'
import ViewEmployeeDatabase from '../Pages/Director/UserManagement/EmployeeDatabase/ViewEmployee'
import StudentLMS from '../Pages/Director/LMS/StudentLMS'
import TeacherLMS from '../Pages/Director/LMS/TeacherLMS'
import ViewStudentLMS from '../Pages/Director/LMS/ViewStudentLMS'
import ViewTeacherLMS from '../Pages/Director/LMS/ViewTeacherLMS'
import RequestApprovals from '../Pages/Director/Request-Approvals/RequestApprovals'
import ViewRequestApproval from '../Pages/Director/Request-Approvals/ViewRequestApproval'
import EscalationList from '../Pages/Director/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/Director/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/Director/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/Director/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/Director/AcademicCalendar/AcademicCalendar'
import ActivityListView from '../Common/Activities/ActivityListView'
import AddActivityForm from '../Common/Activities/AddActivityForm'
import ViewActivityPage from '../Common/Activities/ViewActivityPage'
import ChessResultPage from '../Common/Activities/ChessResultPage'
import MyLeaveRequests from '../Pages/Director/LeaveRequest/MyLeaveRequests'
import AddLeaveRequest from '../Pages/Director/LeaveRequest/AddLeaveRequest'
import ViewMyLeaveRequest from '../Pages/Director/LeaveRequest/ViewMyLeaveRequest'
import ReceivedLeaveRequests from '../Pages/Director/LeaveRequest/ReceivedLeaveRequests'
import ViewReceivedLeaveRequest from '../Pages/Director/LeaveRequest/ViewReceivedLeaveRequest'
import LessonPlanApproval from '../Pages/Director/LessonPlanApproval/LessonPlanApproval'
import LessonPlanGroupDetail from '../Common/LessonPlanApproval/Components/LessonPlanGroupDetail'
import Notifications from '../Pages/Director/Notifications/Notifications'
import MyAttendance from '../Pages/Director/Attendance/MyAttendance'
import MarkEntryApproval from '../Pages/Director/MarkEntryApproval/MarkEntryApproval'
import MarkEntryReview from '../Pages/Director/MarkEntryApproval/MarkEntryReview'

const DirectorRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/director/dashboard" element={<Dashboard />} />
            <Route path="/director/attendance" element={<Navigate to="/director/attendance/my-attendance" replace />} />
            <Route path="/director/attendance/my-attendance" element={<MyAttendance />} />
            <Route path="/director/broadcast" element={<AnnouncementList />} />
            <Route path="/director/broadcast/add-broadcast" element={<AddAnnouncement />} />
            <Route path="/director/broadcast/view-broadcast/:id" element={<ViewAnnouncement />} />
            {TaskManagementRoutes({ basePath: '/director' })}
            <Route path="/director/star-ratings/star-of-month" element={<StarRatings view="som" />} />
            <Route path="/director/star-ratings/star-of-year" element={<StarRatings view="soy" />} />
            <Route path="/director/star-ratings/add-ratings" element={<AddRatings />} />
            <Route path="/director/star-ratings-list" element={<Navigate to="/director/star-ratings/star-of-month" replace />} />
            <Route path="/director/examination-approvals" element={<ExamApprovals />} />
            <Route path="/director/class-timetable-approvals" element={<Navigate to="/director/examination-approvals" replace />} />
            <Route path="/director/user-management/student-database" element={<StudentDatabaseList />} />
            <Route path="/director/user-management/student-database/view/:id" element={<ViewStudentDatabase />} />
            <Route path="/director/user-management/employee-database" element={<EmployeeDatabaseList />} />
            <Route path="/director/user-management/employee-database/view/:id" element={<ViewEmployeeDatabase />} />
            <Route path="/director/student-transfer" element={<Navigate to='/front-office/student-transfer' replace />} />
            <Route path="/director/student-transfer/add" element={<Navigate to='/front-office/student-transfer/add' replace />} />
            <Route path="/director/activities/cultural-list" element={<ActivityListView roleKey="director" activityType="cultural" />} />
            <Route path="/director/activities/add-cultural" element={<AddActivityForm roleKey="director" activityType="cultural" />} />
            <Route path="/director/activities/view-cultural/:id" element={<ViewActivityPage roleKey="director" activityType="cultural" />} />
            <Route path="/director/activities/edit-cultural/:id" element={<AddActivityForm roleKey="director" activityType="cultural" mode="edit" />} />
            <Route path="/director/activities/sports-list" element={<ActivityListView roleKey="director" activityType="sports" />} />
            <Route path="/director/activities/add-sports" element={<AddActivityForm roleKey="director" activityType="sports" />} />
            <Route path="/director/activities/view-sports/:id" element={<ViewActivityPage roleKey="director" activityType="sports" />} />
            <Route path="/director/activities/edit-sports/:id" element={<AddActivityForm roleKey="director" activityType="sports" mode="edit" />} />
            <Route path="/director/activities/chess-result" element={<ChessResultPage />} />
            <Route path="/director/activities/competitions-list" element={<ActivityListView roleKey="director" activityType="competition" />} />
            <Route path="/director/activities/add-competition" element={<AddActivityForm roleKey="director" activityType="competition" />} />
            <Route path="/director/activities/view-competition/:id" element={<ViewActivityPage roleKey="director" activityType="competition" />} />
            <Route path="/director/activities/edit-competition/:id" element={<AddActivityForm roleKey="director" activityType="competition" mode="edit" />} />
            <Route path="/director/lms/student-lms" element={<StudentLMS />} />
            <Route path="/director/lms/view-student-lms" element={<ViewStudentLMS />} />
            <Route path="/director/lms/teacher-lms" element={<TeacherLMS />} />
            <Route path="/director/lms/view-teacher-lms" element={<ViewTeacherLMS />} />
            <Route path="/director/request-approvals" element={<RequestApprovals />} />
            <Route path="/director/request-approvals/view-request" element={<ViewRequestApproval />} />
            <Route path="/director/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/director/notifications" element={<Notifications />} />
            <Route path="/director/communication" element={<Navigate to="/director/communication/inbox" replace />} />
            <Route path="/director/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/director/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/director/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/director/communication/inbox" />} />
            <Route path="/director/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/director/communication/inbox" />} />
            <Route path="/director/escalation-management" element={<EscalationList />} />
            <Route path="/director/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/director/escalation-management/view/:id" element={<ViewEscalation />} />
            <Route path="/director/leave-request/my-requests" element={<MyLeaveRequests />} />
            <Route path="/director/leave-request/my-requests/add" element={<AddLeaveRequest />} />
            <Route path="/director/leave-request/my-requests/view/:id" element={<ViewMyLeaveRequest />} />
            <Route path="/director/leave-request/received" element={<ReceivedLeaveRequests />} />
            <Route path="/director/leave-request/received/view/:id" element={<ViewReceivedLeaveRequest />} />
            <Route path="/director/lesson-plan-approval" element={<LessonPlanApproval />} />
            <Route path="/director/lesson-plan-approval/group/:teacherName/:subject" element={<LessonPlanGroupDetail />} />
            <Route path="/director/mark-entry-approval" element={<MarkEntryApproval />} />
            <Route path="/director/mark-entry-approval/review/:contextKey" element={<MarkEntryReview />} />
            <Route path="/director/student-allocation-approval" element={<Navigate to="/director/dashboard" replace />} />
            <Route path="/director/student-allocation-approval/review/:id" element={<Navigate to="/director/dashboard" replace />} />
            <Route path="/director/student-allocation" element={<Navigate to="/director/dashboard" replace />} />
            <Route path="/director/student-allocation/review/:id" element={<Navigate to="/director/dashboard" replace />} />
            <Route path="/director/student-allocation/allocate/:id" element={<Navigate to="/director/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/director/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default DirectorRoutes
