import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import StudentDashboard from '../Pages/Student/Dashboard/StudentDashboard'
import OnlineClassDetails from '../Pages/Student/Class/OnlineClassDetails'
import ExtraClassDetails from '../Pages/Student/Class/ExtraClassDetails'
import TimeTableDetails from '../Pages/Student/Class/TimeTableDetails'
import AttendanceDetails from '../Pages/Student/Class/AttendanceDetails'
import AttendanceReport from '../Pages/Student/Class/AttendanceReport'
import ExamSchedule from '../Pages/Student/StudentEvaluation/ExamSchedule'
import ResultDetails from '../Pages/Student/Results/ResultDetails'
import { StudentAnalyticsPage } from '../Common/demoDomain/DemoScreens'
import BorrowedBooksList from '../Pages/Student/Library/BorrowedBooksList'
import BusRouteDetails from '../Pages/Student/Transport/BusRouteDetails'
import TrackBus from '../Pages/Student/Transport/TrackBus'
import HostelDetails from '../Pages/Student/Hostel/HostelDetails'
import FeesPayemnt from '../Pages/Student/PaymentDetails/FeesPayemnt'
import HostelPayment from '../Pages/Student/PaymentDetails/HostelPayment'
import TransportPayment from '../Pages/Student/PaymentDetails/TransportPayment'
import NotificationsList from '../Pages/Student/Notifications/NotificationsList'
import AnnouncementList from '../Pages/Student/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/Student/Announcement/ViewAnnouncement'
import TcRequestList from '../Pages/Student/TcRequest/TcRequestList'
import AddTcRequest from '../Pages/Student/TcRequest/AddTcRequest'
import ViewTcRequest from '../Pages/Student/TcRequest/ViewTcRequest'
import ViewRatings from '../Pages/Student/StarRatings/ViewRatings'
import EscalationList from '../Pages/Student/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/Student/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/Student/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/Student/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/Student/AcademicCalendar/AcademicCalendar'
import HomeFun from '../Pages/Teacher/StudentDeliverables/HomeFun/HomeFun'
import ViewHomeFun from '../Pages/Teacher/StudentDeliverables/HomeFun/ViewHomeFun'
import StudyMaterials from '../Pages/Teacher/StudentDeliverables/StudyMaterials/StudyMaterials'
import ViewStudyMaterial from '../Pages/Teacher/StudentDeliverables/StudyMaterials/ViewStudyMaterial'
import SampleQuestions from '../Pages/Teacher/StudentDeliverables/SampleQuestions/SampleQuestions'
import ViewSampleQuestion from '../Pages/Teacher/StudentDeliverables/SampleQuestions/ViewSampleQuestion'

const StudentPortalRoutes = ({
    routePrefix,
    homeFunRoute,
    studyMaterialsRoute,
    sampleQuestionsRoute,
    communicationInboxBase,
    dashboardComponent = null,
    includeOnlineClass = true,
    includeExtraClass = true,
    includeStarRatings = true,
    timetableWeeklyOnly = false,
    includeBusRoute = true,
    trackBusWithRouteDetails = false,
}) => {
    const DashboardComponent = dashboardComponent ?? StudentDashboard

    return (
        <ReactRoutes>
            <Route path={`${routePrefix}/dashboard`} element={<DashboardComponent />} />

            {includeOnlineClass && (
                <Route path={`${routePrefix}/class/online-class`} element={<OnlineClassDetails />} />
            )}
            {includeExtraClass && (
                <Route path={`${routePrefix}/class/extra-class`} element={<ExtraClassDetails />} />
            )}
            <Route path={`${routePrefix}/class/timetable-list`} element={<TimeTableDetails weeklyOnly={timetableWeeklyOnly} />} />
            <Route path={`${routePrefix}/class/attendance-list`} element={<AttendanceDetails />} />
            <Route path={`${routePrefix}/class/attendance-report`} element={<AttendanceReport />} />

            <Route path={`${routePrefix}/student-evaluation/exam-result`} element={<ResultDetails />} />
            <Route path={`${routePrefix}/student-evaluation/exam-schedule`} element={<ExamSchedule />} />
            <Route path={`${routePrefix}/student-evaluation/analytics`} element={<StudentAnalyticsPage />} />

            <Route path={homeFunRoute} element={<HomeFun routeBase={homeFunRoute} viewMode="student" />} />
            <Route path={`${homeFunRoute}/view/:id`} element={<ViewHomeFun routeBase={homeFunRoute} viewMode="student" />} />
            <Route path={studyMaterialsRoute} element={<StudyMaterials routeBase={studyMaterialsRoute} viewMode="student" />} />
            <Route path={`${studyMaterialsRoute}/view/:id`} element={<ViewStudyMaterial routeBase={studyMaterialsRoute} />} />
            <Route path={sampleQuestionsRoute} element={<SampleQuestions routeBase={sampleQuestionsRoute} viewMode="student" />} />
            <Route path={`${sampleQuestionsRoute}/view/:id`} element={<ViewSampleQuestion routeBase={sampleQuestionsRoute} />} />

            <Route path={`${routePrefix}/library/borrowed-books-list`} element={<BorrowedBooksList />} />
            {includeBusRoute && (
                <Route path={`${routePrefix}/transport/bus-route-details`} element={<BusRouteDetails />} />
            )}
            {!includeBusRoute && (
                <Route path={`${routePrefix}/transport/bus-route-details`} element={<Navigate to={`${routePrefix}/transport/track-bus`} replace />} />
            )}
            <Route path={`${routePrefix}/transport/track-bus`} element={<TrackBus showRouteDetails={trackBusWithRouteDetails} />} />
            <Route path={`${routePrefix}/hostel/hostel-details`} element={<HostelDetails />} />
            <Route path={`${routePrefix}/payment/fees-payment`} element={<FeesPayemnt />} />
            <Route path={`${routePrefix}/payment/hostel-payment`} element={<HostelPayment />} />
            <Route path={`${routePrefix}/payment/transport-payment`} element={<TransportPayment />} />

            <Route path={`${routePrefix}/notifications`} element={<NotificationsList />} />
            <Route path={`${routePrefix}/notification/exam-notification`} element={<Navigate to={`${routePrefix}/notifications`} replace />} />
            <Route path={`${routePrefix}/notification/event-notification`} element={<Navigate to={`${routePrefix}/notifications`} replace />} />
            <Route path={`${routePrefix}/notification/holiday-notification`} element={<Navigate to={`${routePrefix}/notifications`} replace />} />
            <Route path={`${routePrefix}/notification/payment-notification`} element={<Navigate to={`${routePrefix}/notifications`} replace />} />

            <Route path={`${routePrefix}/announcement`} element={<AnnouncementList />} />
            <Route path={`${routePrefix}/announcement/view/:id`} element={<ViewAnnouncement />} />

            <Route path={`${routePrefix}/tc-request`} element={<TcRequestList />} />
            <Route path={`${routePrefix}/tc-request/add`} element={<AddTcRequest />} />
            <Route path={`${routePrefix}/tc-request/view/:id`} element={<ViewTcRequest />} />

            {includeStarRatings && (
                <Route path={`${routePrefix}/star-ratings/view-ratings`} element={<ViewRatings />} />
            )}

            <Route path={`${routePrefix}/academic-calendar`} element={<AcademicCalendar />} />

            <Route path={`${routePrefix}/communication`} element={<Navigate to={communicationInboxBase} replace />} />
            <Route path={`${communicationInboxBase}`} element={<CommunicationInbox />} />
            <Route path={`${communicationInboxBase}/:conversationId`} element={<CommunicationInbox />} />
            <Route
                path={`${routePrefix}/communication/direct-messages`}
                element={<RedirectLegacyDirectMessages inboxBase={communicationInboxBase} />}
            />
            <Route
                path={`${routePrefix}/communication/direct-messages/:conversationId`}
                element={<RedirectLegacyDirectMessages inboxBase={communicationInboxBase} />}
            />

            <Route path={`${routePrefix}/escalation-management`} element={<EscalationList />} />
            <Route path={`${routePrefix}/escalation-management/add-escalation`} element={<AddEscalation />} />
            <Route path={`${routePrefix}/escalation-management/view/:id`} element={<ViewEscalation />} />

            <Route path="*" element={<Navigate to={`${routePrefix}/dashboard`} replace />} />
        </ReactRoutes>
    )
}

export default StudentPortalRoutes
