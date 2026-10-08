import React from 'react'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import AdmissionEnquiry from '../Pages/FrontOffice/AdmissionEnquiry/AdmissionEnquiry'
import AddAdmissionEnquiry from '../Pages/FrontOffice/AdmissionEnquiry/AddAdmissionEnquiry'
import ViewAdmissionEnquiry from '../Pages/FrontOffice/AdmissionEnquiry/ViewAdmissionEnquiry'
import AdmissionList from '../Pages/FrontOffice/AdmissionList/AdmissionList'
import AddAdmission from '../Pages/FrontOffice/AdmissionList/AddAdmission'
import ViewAdmission from '../Pages/FrontOffice/AdmissionList/ViewAdmission'
import StudentsList from '../Pages/FrontOffice/StudentManagement/StudentsList'
import TeachersList from '../Pages/FrontOffice/TeacherManagement/TeachersList'
import ViewStudent from '../Pages/FrontOffice/StudentManagement/ViewStudent'
import ViewTeacher from '../Pages/FrontOffice/TeacherManagement/ViewTeacher'
import ParentsList from '../Pages/FrontOffice/ParentManagement/ParentsList'
import ViewParent from '../Pages/FrontOffice/ParentManagement/ViewParent'
import GatePassList from '../Pages/FrontOffice/GatePass/GatePassList'
import AddGatePass from '../Pages/FrontOffice/GatePass/AddGatePass'
import EditGatePass from '../Pages/FrontOffice/GatePass/EditGatePass'
import ViewGatePass from '../Pages/FrontOffice/GatePass/ViewGatePass'
import HostelGatePassList from '../Pages/FrontOffice/HostelGatePass/HostelGatePassList'
import AddHostelGatePass from '../Pages/FrontOffice/HostelGatePass/AddHostelGatePass'
import EditHostelGatePass from '../Pages/FrontOffice/HostelGatePass/EditHostelGatePass'
import ViewHostelGatePass from '../Pages/FrontOffice/HostelGatePass/ViewHostelGatePass'
import MaterialGatePassList from '../Pages/FrontOffice/MaterialGatePass/MaterialGatePassList'
import AddMaterialGatePass from '../Pages/FrontOffice/MaterialGatePass/AddMaterialGatePass'
import EditMaterialGatePass from '../Pages/FrontOffice/MaterialGatePass/EditMaterialGatePass'
import ViewMaterialGatePass from '../Pages/FrontOffice/MaterialGatePass/ViewMaterialGatePass'
import GoodsReceivedPassList from '../Pages/FrontOffice/GoodsReceivedPass/GoodsReceivedPassList'
import AddGoodsReceivedPass from '../Pages/FrontOffice/GoodsReceivedPass/AddGoodsReceivedPass'
import EditGoodsReceivedPass from '../Pages/FrontOffice/GoodsReceivedPass/EditGoodsReceivedPass'
import ViewGoodsReceivedPass from '../Pages/FrontOffice/GoodsReceivedPass/ViewGoodsReceivedPass'
import EscalationList from '../Pages/FrontOffice/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/FrontOffice/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/FrontOffice/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/FrontOffice/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/FrontOffice/AcademicCalendar/AcademicCalendar'
import StudentTransfer from '../Pages/FrontOffice/StudentTransfer/StudentTransfer'
import AddStudentTransfer from '../Pages/FrontOffice/StudentTransfer/AddStudentTransfer'
import StudentReEnrollmentList from '../Pages/FrontOffice/StudentReEnrollment/StudentReEnrollmentList'
import AddStudentReEnrollment from '../Pages/FrontOffice/StudentReEnrollment/AddStudentReEnrollment'
import ViewStudentReEnrollment from '../Pages/FrontOffice/StudentReEnrollment/ViewStudentReEnrollment'
import EditStudentReEnrollment from '../Pages/FrontOffice/StudentReEnrollment/EditStudentReEnrollment'
import MyLeaveRequests from '../Pages/FrontOffice/LeaveRequest/MyLeaveRequests'
import AddLeaveRequest from '../Pages/FrontOffice/LeaveRequest/AddLeaveRequest'
import ViewMyLeaveRequest from '../Pages/FrontOffice/LeaveRequest/ViewMyLeaveRequest'
import ReceivedLeaveRequests from '../Pages/FrontOffice/LeaveRequest/ReceivedLeaveRequests'
import ViewReceivedLeaveRequest from '../Pages/FrontOffice/LeaveRequest/ViewReceivedLeaveRequest'
import Notifications from '../Pages/FrontOffice/Notifications/Notifications'
import MyAttendance from '../Pages/FrontOffice/Attendance/MyAttendance'
import TcRequestList from '../Pages/FrontOffice/TcRequest/TcRequestList'
import ViewTcRequest from '../Pages/FrontOffice/TcRequest/ViewTcRequest'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import AnnouncementList from '../Pages/FrontOffice/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/FrontOffice/Announcement/ViewAnnouncement'

const FrontOfficeRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/front-office/dashboard" element={<div>Front Office Dashboard</div>} />
            <Route path="/front-office/attendance" element={<Navigate to="/front-office/attendance/my-attendance" replace />} />
            <Route path="/front-office/attendance/my-attendance" element={<MyAttendance />} />
            <Route path="/front-office/admission-enquiry" element={<AdmissionEnquiry />} />
            <Route path="/front-office/admission-enquiry/add" element={<AddAdmissionEnquiry />} />
            <Route path="/front-office/add-admission-enquiry" element={<AddAdmissionEnquiry />} />
            <Route path="/front-office/admission-enquiry/edit/:id" element={<AddAdmissionEnquiry />} />
            <Route path="/front-office/admission-enquiry/view/:id" element={<ViewAdmissionEnquiry />} />
            <Route path="/front-office/view-admission-enquiry/:id" element={<ViewAdmissionEnquiry />} />
            <Route path="/front-office/admission-list" element={<AdmissionList />} />
            <Route path="/front-office/admission-list/view/:id" element={<ViewAdmission />} />
            <Route path="/front-office/admission-list/edit/:id" element={<AddAdmission />} />
            <Route path="/front-office/add-admission" element={<AddAdmission />} />
            <Route path="/front-office/student-management" element={<StudentsList />} />
            <Route path="/front-office/student-management/view/:id" element={<ViewStudent />} />
            <Route path="/front-office/teacher-management" element={<TeachersList />} />
            <Route path="/front-office/teacher-management/view/:id" element={<ViewTeacher />} />
            <Route path="/front-office/parent-management" element={<ParentsList />} />
            <Route path="/front-office/view-student" element={<Navigate to="/front-office/student-management" replace />} />
            <Route path="/front-office/view-teacher" element={<Navigate to="/front-office/teacher-management" replace />} />
            <Route path="/front-office/view-parent" element={<ViewParent />} />
            <Route path="/front-office/student-transfer" element={<StudentTransfer />} />
            <Route path="/front-office/student-transfer/add" element={<AddStudentTransfer />} />
            <Route path="/front-office/student-re-enrollment" element={<StudentReEnrollmentList />} />
            <Route path="/front-office/student-re-enrollment/add" element={<AddStudentReEnrollment />} />
            <Route path="/front-office/student-re-enrollment/view/:id" element={<ViewStudentReEnrollment />} />
            <Route path="/front-office/student-re-enrollment/edit/:id" element={<EditStudentReEnrollment />} />
            <Route path="/front-office/tc-request" element={<TcRequestList />} />
            <Route path="/front-office/tc-request/view/:id" element={<ViewTcRequest />} />
            <Route path="/front-office/gate-pass-list" element={<GatePassList />} />
            <Route path="/front-office/add-gate-pass" element={<AddGatePass />} />
            <Route path="/front-office/student-gate-pass/view/:id" element={<ViewGatePass />} />
            <Route path="/front-office/student-gate-pass/edit/:id" element={<EditGatePass />} />
            <Route path="/front-office/hostel-gate-pass-list" element={<HostelGatePassList />} />
            <Route path="/front-office/add-hostel-gate-pass" element={<AddHostelGatePass />} />
            <Route path="/front-office/hostel-gate-pass/view/:id" element={<ViewHostelGatePass />} />
            <Route path="/front-office/hostel-gate-pass/edit/:id" element={<EditHostelGatePass />} />
            <Route path="/front-office/material-gate-pass-list" element={<MaterialGatePassList />} />
            <Route path="/front-office/add-material-gate-pass" element={<AddMaterialGatePass />} />
            <Route path="/front-office/material-gate-pass/view/:id" element={<ViewMaterialGatePass />} />
            <Route path="/front-office/material-gate-pass/edit/:id" element={<EditMaterialGatePass />} />
            <Route path="/front-office/goods-received-pass-list" element={<GoodsReceivedPassList />} />
            <Route path="/front-office/add-goods-received-pass" element={<AddGoodsReceivedPass />} />
            <Route path="/front-office/goods-received-pass/view/:id" element={<ViewGoodsReceivedPass />} />
            <Route path="/front-office/goods-received-pass/edit/:id" element={<EditGoodsReceivedPass />} />
            <Route path="/front-office/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/front-office/announcement" element={<AnnouncementList />} />
            <Route path="/front-office/announcement/view/:id" element={<ViewAnnouncement />} />
            <Route path="/front-office/notifications" element={<Notifications />} />
            <Route path="/front-office/leave-request/my-requests" element={<MyLeaveRequests />} />
            <Route path="/front-office/leave-request/my-requests/add" element={<AddLeaveRequest />} />
            <Route path="/front-office/leave-request/my-requests/view/:id" element={<ViewMyLeaveRequest />} />
            <Route path="/front-office/leave-request/received" element={<ReceivedLeaveRequests />} />
            <Route path="/front-office/leave-request/received/view/:id" element={<ViewReceivedLeaveRequest />} />
            <Route path="/front-office/communication" element={<Navigate to="/front-office/communication/inbox" replace />} />
            <Route path="/front-office/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/front-office/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/front-office/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/front-office/communication/inbox" />} />
            <Route path="/front-office/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/front-office/communication/inbox" />} />
            {TaskManagementRoutes({ basePath: '/front-office' })}
            <Route path="/front-office/escalation-management" element={<EscalationList />} />
            <Route path="/front-office/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/front-office/escalation-management/view/:id" element={<ViewEscalation />} />
            <Route path="*" element={<div>Front Office Home</div>} />
        </ReactRoutes>
    )
}

export default FrontOfficeRoutes
