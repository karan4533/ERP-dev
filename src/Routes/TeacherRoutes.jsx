import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'
import { EnterpriseOperationsRoutes } from './EnterpriseOperationsRoutes'
import React from 'react'
import CentralActivitiesWorkspace from '../Common/Activities/CentralActivitiesWorkspace'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/Teacher/Dashboard/Dashboard'
import MyAttendance from '../Pages/Teacher/Attendance/MyAttendance'
import ClassAttendance from '../Pages/Teacher/Attendance/ClassAttendance'
import ClassRoutine from '../Pages/Teacher/ClassRoutine/ClassRoutine'
import ExtraClass from '../Pages/Teacher/ExtraClass/ExtraClass'
import AddExtraClass from '../Pages/Teacher/ExtraClass/AddExtraClass'
import ViewExtraClass from '../Pages/Teacher/ExtraClass/ViewExtraClass'
import OnlineClass from '../Pages/Teacher/OnlineClass/OnlineClass'
import AddOnlineClass from '../Pages/Teacher/OnlineClass/AddOnlineClass'
import ViewOnlineClass from '../Pages/Teacher/OnlineClass/ViewOnlineClass'
import MyLeaveRequests from '../Pages/Teacher/LeaveRequest/MyLeaveRequests'
import AddLeaveRequest from '../Pages/Teacher/LeaveRequest/AddLeaveRequest'
import ViewMyLeaveRequest from '../Pages/Teacher/LeaveRequest/ViewMyLeaveRequest'
import ReceivedLeaveRequests from '../Pages/Teacher/LeaveRequest/ReceivedLeaveRequests'
import ViewReceivedLeaveRequest from '../Pages/Teacher/LeaveRequest/ViewReceivedLeaveRequest'
import ParentsList from '../Pages/Teacher/ParentsList/ParentsList'
import StudentsList from '../Pages/Teacher/StudentsList/StudentsList'
import ViewStudent from '../Pages/Teacher/StudentsList/ViewStudent'
import ViewStudentFullDetails from '../Pages/Teacher/StudentsList/ViewStudentFullDetails'
import BooksBorrowed from '../Pages/Teacher/BooksBorrowed/BooksBorrowed'
import Notifications from '../Pages/Teacher/Notifications/Notifications'
import HomeFun from '../Pages/Teacher/StudentDeliverables/HomeFun/HomeFun'
import AddHomeFun from '../Pages/Teacher/StudentDeliverables/HomeFun/AddHomeFun'
import ViewHomeFun from '../Pages/Teacher/StudentDeliverables/HomeFun/ViewHomeFun'
import StudentDeliverablesStudyMaterials from '../Pages/Teacher/StudentDeliverables/StudyMaterials/StudyMaterials'
import AddStudentDeliverablesStudyMaterial from '../Pages/Teacher/StudentDeliverables/StudyMaterials/AddStudyMaterial'
import ViewStudentDeliverablesStudyMaterial from '../Pages/Teacher/StudentDeliverables/StudyMaterials/ViewStudyMaterial'
import SampleQuestions from '../Pages/Teacher/StudentDeliverables/SampleQuestions/SampleQuestions'
import AddSampleQuestion from '../Pages/Teacher/StudentDeliverables/SampleQuestions/AddSampleQuestion'
import ViewSampleQuestion from '../Pages/Teacher/StudentDeliverables/SampleQuestions/ViewSampleQuestion'
import UnitTests from '../Pages/Teacher/UnitTests/UnitTests'
import AddUnitTest from '../Pages/Teacher/UnitTests/AddUnitTest'
import ViewUnitTest from '../Pages/Teacher/UnitTests/ViewUnitTest'
import ReportCardGenerator from '../Common/Academic/ReportCardGenerator'
import { BiometricAttendancePage, ExamTypesPage, MyProfilePage, StudentAnalyticsPage } from '../Common/demoDomain/DemoScreens'
import EscalationList from '../Pages/Teacher/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/Teacher/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/Teacher/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/Teacher/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/Teacher/AcademicCalendar/AcademicCalendar'
import SubmitLessonPlan from '../Pages/Teacher/LessonPlanApproval/SubmitLessonPlan'
import AddLessonPlan from '../Pages/Teacher/LessonPlanApproval/AddLessonPlan'
import MyLessonPlan from '../Pages/Teacher/LessonPlanApproval/MyLessonPlan'
import LessonPlanGroupDetail from '../Common/LessonPlanApproval/Components/LessonPlanGroupDetail'
import AnnouncementList from '../Pages/Teacher/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/Teacher/Announcement/ViewAnnouncement'
import MarkEntry from '../Pages/Teacher/StudentEvaluation/MarkEntry/MarkEntry'
import ExamSchedule from '../Pages/Teacher/StudentEvaluation/ExamSchedule/ExamSchedule'
import EnterpriseRecognitionPage from '../Common/Recognition/EnterpriseRecognitionPage'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import { StudentStarRatingsRoutes } from '../Common/StudentStarRatings/StudentStarRatingsRoutes'
import UnavailableWorkflowPage from '../Common/ui/UnavailableWorkflowPage'

const Placeholder = () => null

const TeacherRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/teacher/dashboard" element={<Dashboard />} />
            <Route path="/teacher/activities" element={<CentralActivitiesWorkspace defaultCategory="all" roleKey="teacher" />} />
            <Route path="/teacher/attendance" element={<Navigate to="/teacher/attendance/my-attendance" replace />} />
            <Route path="/teacher/attendance-history" element={<Navigate to="/teacher/attendance/my-attendance" replace />} />
            <Route path="/teacher/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />
            <Route path="/teacher/attendance/my-attendance" element={<AttendanceAndLeaveWorkspace defaultTab="records" />} />
            <Route path="/teacher/attendance/class-attendance" element={<ClassAttendance />} />
            <Route path="/teacher/class/class-routine" element={<ClassRoutine />} />
            <Route path="/teacher/class/extra-class" element={<ExtraClass />} />
            <Route path="/teacher/class/extra-class/add" element={<AddExtraClass />} />
            <Route path="/teacher/class/extra-class/view/:id" element={<ViewExtraClass />} />
            <Route path="/teacher/class/online-class" element={<OnlineClass />} />
            <Route path="/teacher/class/online-class/add" element={<AddOnlineClass />} />
            <Route path="/teacher/class/online-class/view/:id" element={<ViewOnlineClass />} />
            <Route path="/teacher/class/leave-request" element={<Navigate to="/teacher/leave-request/received" replace />} />
            <Route path="/teacher/leave-request/my-requests" element={<AttendanceAndLeaveWorkspace defaultTab="my-leaves" />} />
            <Route path="/teacher/leave-request/my-requests/add" element={<AddLeaveRequest />} />
            <Route path="/teacher/leave-request/my-requests/view/:id" element={<ViewMyLeaveRequest />} />
            <Route path="/teacher/leave-request/received" element={<AttendanceAndLeaveWorkspace defaultTab="received-leaves" />} />
            <Route path="/teacher/leave-request/received/view/:id" element={<ViewReceivedLeaveRequest />} />
            <Route path="/teacher/student-deliverables/home-fun" element={<HomeFun />} />
            <Route path="/teacher/student-deliverables/home-fun/add" element={<AddHomeFun />} />
            <Route path="/teacher/student-deliverables/home-fun/view/:id" element={<ViewHomeFun />} />
            <Route path="/teacher/student-deliverables/study-materials" element={<StudentDeliverablesStudyMaterials />} />
            <Route path="/teacher/student-deliverables/study-materials/add" element={<AddStudentDeliverablesStudyMaterial />} />
            <Route path="/teacher/student-deliverables/study-materials/view/:id" element={<ViewStudentDeliverablesStudyMaterial />} />
            <Route path="/teacher/student-deliverables/sample-questions" element={<SampleQuestions />} />
            <Route path="/teacher/student-deliverables/sample-questions/add" element={<AddSampleQuestion />} />
            <Route path="/teacher/student-deliverables/sample-questions/view/:id" element={<ViewSampleQuestion />} />
            <Route path="/teacher/unit-tests" element={<UnitTests />} />
            <Route path="/teacher/unit-tests/add" element={<AddUnitTest />} />
            <Route path="/teacher/unit-tests/view/:id" element={<ViewUnitTest />} />
            <Route path="/teacher/student-evaluation/ca-pca" element={<Navigate to="/teacher/unit-tests" replace />} />
            <Route path="/teacher/student-evaluation/mark-entry" element={<MarkEntry />} />
            <Route path="/teacher/student-evaluation/exam-schedule" element={<ExamSchedule />} />
            <Route path="/teacher/student-evaluation/report-cards" element={<ReportCardGenerator />} />
            <Route path="/teacher/star-ratings" element={<EnterpriseRecognitionPage view="som" defaultDomain="academic" />} />
            <Route path="/teacher/user-management/students-list" element={<StudentsList />} />
            <Route path="/teacher/user-management/students-list/view/:id" element={<ViewStudent />} />
            <Route path="/teacher/user-management/students-list/view/:id/full" element={<ViewStudentFullDetails />} />
            <Route path="/teacher/user-management/parents-list" element={<Navigate to="/teacher/user-management/students-list" replace />} />
            <Route path="/teacher/library/books-borrowed" element={<BooksBorrowed />} />
            <Route path="/teacher/notifications" element={<Notifications />} />
            <Route path="/teacher/announcement" element={<AnnouncementList />} />
            <Route path="/teacher/announcement/view/:id" element={<ViewAnnouncement />} />
            <Route path="/teacher/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/teacher/lesson-plan-approval" element={<SubmitLessonPlan />} />
            <Route path="/teacher/lesson-plan-approval/add" element={<AddLessonPlan />} />
            <Route path="/teacher/lesson-plan-approval/group/:teacherName/:subject" element={<LessonPlanGroupDetail />} />
            <Route path="/teacher/lesson-plan/my-lesson-plan" element={<MyLessonPlan />} />
            <Route path="/teacher/lesson-plan/my-lesson-plan/group/:teacherName/:subject" element={<LessonPlanGroupDetail />} />
            <Route path="/teacher/student-allocation" element={<UnavailableWorkflowPage title="Student allocation" />} />
            <Route path="/teacher/student-allocation/allocate/:id" element={<UnavailableWorkflowPage title="Allocate student" />} />
            {TaskManagementRoutes({ basePath: '/teacher' })}
            {StudentStarRatingsRoutes({ basePath: '/teacher' })}
            <Route path="/teacher/communication" element={<Navigate to="/teacher/communication/inbox" replace />} />
            <Route path="/teacher/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/teacher/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/teacher/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/teacher/communication/inbox" />} />
            <Route path="/teacher/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/teacher/communication/inbox" />} />
            <Route path="/teacher/escalation-management" element={<EscalationList />} />
            <Route path="/teacher/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/teacher/escalation-management/view/:id" element={<ViewEscalation />} />
            <Route path="/teacher/student-evaluation/exam" element={<ExamTypesPage />} />
            <Route path="/teacher/student-evaluation/analytics" element={<StudentAnalyticsPage />} />
            <Route path="/teacher/attendance/biometric" element={<BiometricAttendancePage canOverride />} />
            <Route path="/teacher/my-profile" element={<MyProfilePage roleLabel="Teacher" />} />
            {/* Enterprise Functional Operations (Stores, Gate Pass, File Room, Ticketing, Monitoring, Lost & Found) */}
            {EnterpriseOperationsRoutes({ basePath: '/teacher', role: 'teacher' })}

            <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default TeacherRoutes
