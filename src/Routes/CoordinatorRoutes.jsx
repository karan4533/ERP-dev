import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/Coordinator/Dashboard/Dashboard'
import MyAttendance from '../Pages/Coordinator/Attendance/MyAttendance'
import ClassAttendance from '../Pages/Coordinator/Attendance/ClassAttendance'
import ClassRoutine from '../Pages/Coordinator/ClassRoutine/ClassRoutine'
import ExtraClass from '../Pages/Coordinator/ExtraClass/ExtraClass'
import { BiometricAttendancePage, ExamTypesPage, MyProfilePage, StudentAnalyticsPage } from '../Common/demoDomain/DemoScreens'
import AddExtraClass from '../Pages/Coordinator/ExtraClass/AddExtraClass'
import ViewExtraClass from '../Pages/Coordinator/ExtraClass/ViewExtraClass'
import OnlineClass from '../Pages/Coordinator/OnlineClass/OnlineClass'
import AddOnlineClass from '../Pages/Coordinator/OnlineClass/AddOnlineClass'
import ViewOnlineClass from '../Pages/Coordinator/OnlineClass/ViewOnlineClass'
import MyLeaveRequests from '../Pages/Coordinator/LeaveRequest/MyLeaveRequests'
import AddLeaveRequest from '../Pages/Coordinator/LeaveRequest/AddLeaveRequest'
import ViewMyLeaveRequest from '../Pages/Coordinator/LeaveRequest/ViewMyLeaveRequest'
import ReceivedLeaveRequests from '../Pages/Coordinator/LeaveRequest/ReceivedLeaveRequests'
import ViewReceivedLeaveRequest from '../Pages/Coordinator/LeaveRequest/ViewReceivedLeaveRequest'
import ParentsList from '../Pages/Coordinator/ParentsList/ParentsList'
import StudentsList from '../Pages/Coordinator/StudentsList/StudentsList'
import ViewStudent from '../Pages/Coordinator/StudentsList/ViewStudent'
import ViewStudentFullDetails from '../Pages/Coordinator/StudentsList/ViewStudentFullDetails'
import BooksBorrowed from '../Pages/Coordinator/BooksBorrowed/BooksBorrowed'
import Notifications from '../Pages/Coordinator/Notifications/Notifications'
import HomeFun from '../Pages/Coordinator/StudentDeliverables/HomeFun/HomeFun'
import AddHomeFun from '../Pages/Coordinator/StudentDeliverables/HomeFun/AddHomeFun'
import ViewHomeFun from '../Pages/Coordinator/StudentDeliverables/HomeFun/ViewHomeFun'
import StudentDeliverablesStudyMaterials from '../Pages/Coordinator/StudentDeliverables/StudyMaterials/StudyMaterials'
import AddStudentDeliverablesStudyMaterial from '../Pages/Coordinator/StudentDeliverables/StudyMaterials/AddStudyMaterial'
import ViewStudentDeliverablesStudyMaterial from '../Pages/Coordinator/StudentDeliverables/StudyMaterials/ViewStudyMaterial'
import SampleQuestions from '../Pages/Coordinator/StudentDeliverables/SampleQuestions/SampleQuestions'
import AddSampleQuestion from '../Pages/Coordinator/StudentDeliverables/SampleQuestions/AddSampleQuestion'
import ViewSampleQuestion from '../Pages/Coordinator/StudentDeliverables/SampleQuestions/ViewSampleQuestion'
import UnitTests from '../Pages/Coordinator/UnitTests/UnitTests'
import AddUnitTest from '../Pages/Coordinator/UnitTests/AddUnitTest'
import ViewUnitTest from '../Pages/Coordinator/UnitTests/ViewUnitTest'
import EscalationList from '../Pages/Coordinator/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/Coordinator/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/Coordinator/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/Coordinator/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/Coordinator/AcademicCalendar/AcademicCalendar'
import SubmitLessonPlan from '../Pages/Teacher/LessonPlanApproval/SubmitLessonPlan'
import AddLessonPlan from '../Pages/Coordinator/LessonPlanApproval/AddLessonPlan'
import MyLessonPlan from '../Pages/Teacher/LessonPlanApproval/MyLessonPlan'
import LessonPlanGroupDetail from '../Common/LessonPlanApproval/Components/LessonPlanGroupDetail'
import AnnouncementList from '../Pages/Coordinator/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/Coordinator/Announcement/ViewAnnouncement'
import MarkEntry from '../Pages/Coordinator/StudentEvaluation/MarkEntry/MarkEntry'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import { StudentStarRatingsRoutes } from '../Common/StudentStarRatings/StudentStarRatingsRoutes'

const CoordinatorRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/coordinator/dashboard" element={<Dashboard />} />
            <Route path="/coordinator/attendance" element={<Navigate to="/coordinator/attendance/my-attendance" replace />} />
            <Route path="/coordinator/attendance-history" element={<Navigate to="/coordinator/attendance/my-attendance" replace />} />
            <Route path="/coordinator/attendance/my-attendance" element={<MyAttendance />} />
            <Route path="/coordinator/attendance/class-attendance" element={<ClassAttendance />} />
            <Route path="/coordinator/class/class-routine" element={<ClassRoutine />} />
            <Route path="/coordinator/class/extra-class" element={<ExtraClass />} />
            <Route path="/coordinator/class/extra-class/add" element={<AddExtraClass />} />
            <Route path="/coordinator/class/extra-class/view/:id" element={<ViewExtraClass />} />
            <Route path="/coordinator/class/online-class" element={<OnlineClass />} />
            <Route path="/coordinator/class/online-class/add" element={<AddOnlineClass />} />
            <Route path="/coordinator/class/online-class/view/:id" element={<ViewOnlineClass />} />
            <Route path="/coordinator/class/leave-request" element={<Navigate to="/coordinator/leave-request/received" replace />} />
            <Route path="/coordinator/leave-request/my-requests" element={<MyLeaveRequests />} />
            <Route path="/coordinator/leave-request/my-requests/add" element={<AddLeaveRequest />} />
            <Route path="/coordinator/leave-request/my-requests/view/:id" element={<ViewMyLeaveRequest />} />
            <Route path="/coordinator/leave-request/received" element={<ReceivedLeaveRequests />} />
            <Route path="/coordinator/leave-request/received/view/:id" element={<ViewReceivedLeaveRequest />} />
            <Route path="/coordinator/student-deliverables/home-fun" element={<HomeFun />} />
            <Route path="/coordinator/student-deliverables/home-fun/add" element={<AddHomeFun />} />
            <Route path="/coordinator/student-deliverables/home-fun/view/:id" element={<ViewHomeFun />} />
            <Route path="/coordinator/student-deliverables/study-materials" element={<StudentDeliverablesStudyMaterials />} />
            <Route path="/coordinator/student-deliverables/study-materials/add" element={<AddStudentDeliverablesStudyMaterial />} />
            <Route path="/coordinator/student-deliverables/study-materials/view/:id" element={<ViewStudentDeliverablesStudyMaterial />} />
            <Route path="/coordinator/student-deliverables/sample-questions" element={<SampleQuestions />} />
            <Route path="/coordinator/student-deliverables/sample-questions/add" element={<AddSampleQuestion />} />
            <Route path="/coordinator/student-deliverables/sample-questions/view/:id" element={<ViewSampleQuestion />} />
            <Route path="/coordinator/unit-tests" element={<UnitTests />} />
            <Route path="/coordinator/unit-tests/add" element={<AddUnitTest />} />
            <Route path="/coordinator/unit-tests/view/:id" element={<ViewUnitTest />} />
            <Route path="/coordinator/student-evaluation/mark-entry" element={<MarkEntry />} />
            <Route path="/coordinator/user-management/students-list" element={<StudentsList />} />
            <Route path="/coordinator/user-management/students-list/view/:id" element={<ViewStudent />} />
            <Route path="/coordinator/user-management/students-list/view/:id/full" element={<ViewStudentFullDetails />} />
            <Route path="/coordinator/user-management/parents-list" element={<ParentsList />} />
            <Route path="/coordinator/library/books-borrowed" element={<BooksBorrowed />} />
            <Route path="/coordinator/notifications" element={<Notifications />} />
            <Route path="/coordinator/announcement" element={<AnnouncementList />} />
            <Route path="/coordinator/announcement/view/:id" element={<ViewAnnouncement />} />
            <Route path="/coordinator/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/coordinator/lesson-plan-approval" element={<SubmitLessonPlan />} />
            <Route path="/coordinator/lesson-plan-approval/add" element={<AddLessonPlan />} />
            <Route path="/coordinator/lesson-plan-approval/group/:teacherName/:subject" element={<LessonPlanGroupDetail />} />
            <Route path="/coordinator/lesson-plan/my-lesson-plan" element={<MyLessonPlan />} />
            <Route path="/coordinator/lesson-plan/my-lesson-plan/group/:teacherName/:subject" element={<LessonPlanGroupDetail />} />
            <Route path="/coordinator/student-allocation" element={<Navigate to="/coordinator/dashboard" replace />} />
            <Route path="/coordinator/student-allocation/allocate/:id" element={<Navigate to="/coordinator/dashboard" replace />} />
            {TaskManagementRoutes({ basePath: '/coordinator' })}
            {StudentStarRatingsRoutes({ basePath: '/coordinator' })}
            <Route path="/coordinator/communication" element={<Navigate to="/coordinator/communication/inbox" replace />} />
            <Route path="/coordinator/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/coordinator/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/coordinator/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/coordinator/communication/inbox" />} />
            <Route path="/coordinator/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/coordinator/communication/inbox" />} />
            <Route path="/coordinator/escalation-management" element={<EscalationList />} />
            <Route path="/coordinator/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/coordinator/escalation-management/view/:id" element={<ViewEscalation />} />
            <Route path="/coordinator/student-evaluation/exam" element={<ExamTypesPage />} />
            <Route path="/coordinator/student-evaluation/analytics" element={<StudentAnalyticsPage />} />
            <Route path="/coordinator/attendance/biometric" element={<BiometricAttendancePage />} />
            <Route path="/coordinator/my-profile" element={<MyProfilePage roleLabel="Coordinator" />} />
            <Route path="*" element={<Navigate to="/coordinator/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default CoordinatorRoutes
