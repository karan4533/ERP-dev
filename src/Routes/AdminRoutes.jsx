import React from 'react'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import AdmissionList from '../Pages/Admin/FrontOffice/AdminssionList/AdminssionList'
import AdmissionEnquiry from '../Pages/Admin/FrontOffice/AdmissionEnquiry/AdmissionEnquiry'
import ViewAdmissionEnquiry from '../Pages/Admin/FrontOffice/AdmissionEnquiry/ViewAdmissionEnquiry'
import ViewAdmission from '../Pages/Admin/FrontOffice/AdminssionList/ViewAdmission'
import TeachersList from '../Pages/Admin/FrontOffice/TeachersList/TeachersList'
import AddTeacher from '../Pages/Admin/FrontOffice/TeachersList/AddTeacher'
import LibrarianList from '../Pages/Admin/FrontOffice/LibrarianList/LibrarianList'
import AddLibrarian from '../Pages/Admin/FrontOffice/LibrarianList/AddLibrarian'
import DriverList from '../Pages/Admin/FrontOffice/DriverList/DriverList'
import AddDriverList from '../Pages/Admin/FrontOffice/DriverList/AddDriverList'
import StudentsList from '../Pages/Admin/Attendance/Students/StudentsList'
import EmployeesList from '../Pages/Admin/Attendance/Employees/EmployeesList'
import ClassDetails from '../Pages/Admin/Class/ClassDetails/ClassDetails'
import AddClassDetails from '../Pages/Admin/Class/ClassDetails/AddClassDetails'
import OnlineClass from '../Pages/Admin/Class/OnlineClass/OnlineClass'
import AddOnlineClass from '../Pages/Admin/Class/OnlineClass/AddOnlineClass'
import ExtendedClass from '../Pages/Admin/Class/ExtendedClass/ExtendedClass'
import AddExtendedClass from '../Pages/Admin/Class/ExtendedClass/AddExtendedClass'
import TimeTable from '../Pages/Admin/Class/Timetable/TimeTable'
import AddTimeTable from '../Pages/Admin/Class/Timetable/AddTimeTable'
import Subjects from '../Pages/Admin/Subjects/Subjects'
import AddSubjects from '../Pages/Admin/Subjects/AddSubjects'
import BookList from '../Pages/Admin/LibraryDetails/BookList/BookList'
import AddBooks from '../Pages/Admin/LibraryDetails/BookList/AddBooks'
import IssuedBooks from '../Pages/Admin/LibraryDetails/IssuedBooks/IssuedBooks'
import AddIssueBook from '../Pages/Admin/LibraryDetails/IssuedBooks/AddIssueBook'
import ClassFeeDetails from '../Pages/Admin/Students/ClassFeeDetails/ClassFeeDetails'
import AddClassFeeDetails from '../Pages/Admin/Students/ClassFeeDetails/AddClassFeeDetails'
import StudentDocuments from '../Pages/Admin/Documents/StudentDocuments/StudentDocuments'
import AddStudentDocuments from '../Pages/Admin/Documents/StudentDocuments/AddStudentDocuments'
import EditStudentDocuments from '../Pages/Admin/Documents/StudentDocuments/EditStudentDocuments'
import ViewStudentDocuments from '../Pages/Admin/Documents/StudentDocuments/ViewStudentDocuments'
import EmployeeDocuments from '../Pages/Admin/Documents/EmployeeDocuments/EmployeeDocuments'
import AddEmployeeDocuments from '../Pages/Admin/Documents/EmployeeDocuments/AddEmployeeDocuments'
import EditEmployeeDocuments from '../Pages/Admin/Documents/EmployeeDocuments/EditEmployeeDocuments'
import VehicleDetailsList from '../Pages/Admin/Transport/VehicleDetails/VehicleDetailsList'
import AddVehicleDetails from '../Pages/Admin/Transport/VehicleDetails/AddVehicleDetails'
import RouteDetailsList from '../Pages/Admin/Transport/RouteDetails/RouteDetailsList'
import AddRouteDetails from '../Pages/Admin/Transport/RouteDetails/AddRouteDetails'
import RouteDataList from '../Pages/Admin/Transport/RouteData/RouteDataList'
import AssignedRouteList from '../Pages/Admin/Transport/AssignedRouteList/AssignedRouteList'
import AssignRoute from '../Pages/Admin/Transport/AssignedRouteList/AssignRoute'
import ExamDetailsList from '../Pages/Admin/ExamDetails/ExamDetailsList'
import AddExamDetails from '../Pages/Admin/ExamDetails/AddExamDetails'
import SalariesList from '../Pages/Admin/Expenses/Salaries/SalariesList'
import AddSalariesList from '../Pages/Admin/Expenses/Salaries/AddSalariesList'
import HostelExpensesList from '../Pages/Admin/Expenses/Hostel/HostelExpensesList'
import AddHostelExpenses from '../Pages/Admin/Expenses/Hostel/AddHostelExpenses'
import TransportExpensesList from '../Pages/Admin/Expenses/Transport/TransportExpensesList'
import AddTransportExpenses from '../Pages/Admin/Expenses/Transport/AddTransportExpenses'
import LibraryExpensesList from '../Pages/Admin/Expenses/Library/LibraryExpensesList'
import AddLibraryExpenses from '../Pages/Admin/Expenses/Library/AddLibraryExpenses'
import OtherExpensesList from '../Pages/Admin/Expenses/Others/OtherExpensesList'
import AddOtherExpensesList from '../Pages/Admin/Expenses/Others/AddOtherExpensesList'
import Notifications from '../Pages/Admin/Notification/Notifications'
import AnnouncementList from '../Pages/Admin/Announcement/AnnouncementList'
import AddAnnouncement from '../Pages/Admin/Announcement/AddAnnouncement'
import ViewAnnouncement from '../Pages/Admin/Announcement/ViewAnnouncement'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import MyLeaveRequests from '../Pages/Admin/LeaveRequest/MyLeaveRequests'
import AddLeaveRequest from '../Pages/Admin/LeaveRequest/AddLeaveRequest'
import ViewMyLeaveRequest from '../Pages/Admin/LeaveRequest/ViewMyLeaveRequest'
import ReceivedLeaveRequests from '../Pages/Admin/LeaveRequest/ReceivedLeaveRequests'
import ViewReceivedLeaveRequest from '../Pages/Admin/LeaveRequest/ViewReceivedLeaveRequest'
import TcRequestApprovalList from '../Pages/Admin/TcRequest/TcRequestApprovalList'
import ViewTcRequestApproval from '../Pages/Admin/TcRequest/ViewTcRequestApproval'
import EscalationList from '../Pages/Admin/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/Admin/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/Admin/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/Admin/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/Admin/AcademicCalendar/AcademicCalendar'
import ActivityListView from '../Common/Activities/ActivityListView'
import AddActivityForm from '../Common/Activities/AddActivityForm'
import ViewActivityPage from '../Common/Activities/ViewActivityPage'
import ChessResultPage from '../Common/Activities/ChessResultPage'
import AdminStudentDatabaseList from '../Pages/Admin/UserManagement/StudentDatabase/StudentsList'
import AdminViewStudentDatabase from '../Pages/Admin/UserManagement/StudentDatabase/ViewStudent'
import AdminEmployeeDatabaseList from '../Pages/Admin/UserManagement/EmployeeDatabase/EmployeesList'
import AdminViewEmployeeDatabase from '../Pages/Admin/UserManagement/EmployeeDatabase/ViewEmployee'
import UserCreationPage from '../Pages/Admin/RBAC/UserCreationPage'
import CreateUserPage from '../Pages/Admin/RBAC/CreateUserPage'
import RolesPage from '../Pages/Admin/RBAC/RolesPage'

// import Dashboard from '../Pages/Dashboard/Dashboard'

const AdminRoutes = () => {
    return (
        <ReactRoutes>

            <Route path="/dashboard" element={<div>Admin Dashboard</div>} />
            <Route path="*" element={<div>Admin Home</div>} />

            {/* Front Office */}

            <Route path="/admin/front-office/admission-list" element={<AdmissionList />} />
            <Route path="/admin/front-office/admission-list/view/:id" element={<ViewAdmission />} />
            <Route path="/admin/front-office/admission-enquiry" element={<AdmissionEnquiry />} />
            <Route path="/admin/front-office/admission-enquiry/view/:id" element={<ViewAdmissionEnquiry />} />
            <Route path="/admin/front-office/view-admission-enquiry/:id" element={<ViewAdmissionEnquiry />} />
            <Route path="/admin/front-office/teachers-list" element={<TeachersList />} />
            <Route path="/admin/front-office/add-teacher" element={<AddTeacher />} />
            <Route path="/admin/front-office/librarian-list" element={<LibrarianList />} />
            <Route path="/admin/front-office/add-librarian" element={<AddLibrarian />} />
            <Route path="/admin/front-office/driver-list" element={<DriverList />} />
            <Route path="/admin/front-office/add-driver" element={<AddDriverList />} />

            {/* Attendance */}

            <Route path="/admin/attendance/students-list" element={<StudentsList />} />
            <Route path="/admin/attendance/employees-list" element={<EmployeesList />} />
            <Route path="/admin/attendance/leave-request-list" element={<Navigate to='/admin/leave-request/my-requests' replace />} />
            <Route path="/admin/attendance/leave-request" element={<Navigate to='/admin/leave-request/my-requests' replace />} />

            {/* Class */}

            <Route path="/admin/class/class-details" element={<ClassDetails />} />
            <Route path="/admin/class/add-class-details" element={<AddClassDetails />} />
            <Route path="/admin/class/online-class" element={<OnlineClass />} />
            <Route path="/admin/class/add-online-class" element={<AddOnlineClass />} />
            <Route path="/admin/class/extended-class" element={<ExtendedClass />} />
            <Route path="/admin/class/add-extended-class" element={<AddExtendedClass />} />
            <Route path="/admin/class/timetable-list" element={<TimeTable />} />
            <Route path="/admin/class/add-timetable" element={<AddTimeTable />} />
            <Route path="/admin/class/subjects" element={<Subjects />} />
            <Route path="/admin/class/add-subjects" element={<AddSubjects />} />

            {/* Library Details */}

            <Route path="/admin/library-details/book-list" element={<BookList />} />
            <Route path="/admin/library-details/add-book" element={<AddBooks />} />
            <Route path="/admin/library-details/issued-book" element={<IssuedBooks />} />
            <Route path="/admin/library-details/add-issued-book" element={<AddIssueBook />} />

            {/* Student */}

            <Route path="/admin/user-management/student-database" element={<AdminStudentDatabaseList />} />
            <Route path="/admin/user-management/student-database/view/:id" element={<AdminViewStudentDatabase />} />
            <Route path="/admin/user-management/employee-database" element={<AdminEmployeeDatabaseList />} />
            <Route path="/admin/user-management/employee-database/view/:id" element={<AdminViewEmployeeDatabase />} />
            <Route path="/admin/student/student-details" element={<Navigate to="/admin/user-management/student-database" replace />} />
            <Route path="/admin/student/class-fee-details" element={<ClassFeeDetails />} />
            <Route path="/admin/student/add-class-fee-details" element={<AddClassFeeDetails />} />
            <Route path="/admin/student/parent-details" element={<Navigate to="/admin/user-management/student-database" replace />} />
            <Route path="/admin/student/student-transfer" element={<Navigate to='/front-office/student-transfer' replace />} />
            <Route path="/admin/student/add-student-transfer" element={<Navigate to='/front-office/student-transfer/add' replace />} />
            {/* <Route path="/admin/student/leave-request" element={< />} /> */}

            {/* Activities */}
            <Route path="/admin/activities/cultural-list" element={<ActivityListView roleKey="admin" activityType="cultural" />} />
            <Route path="/admin/activities/add-cultural" element={<AddActivityForm roleKey="admin" activityType="cultural" />} />
            <Route path="/admin/activities/view-cultural/:id" element={<ViewActivityPage roleKey="admin" activityType="cultural" />} />
            <Route path="/admin/activities/edit-cultural/:id" element={<AddActivityForm roleKey="admin" activityType="cultural" mode="edit" />} />
            <Route path="/admin/activities/sports-list" element={<ActivityListView roleKey="admin" activityType="sports" />} />
            <Route path="/admin/activities/add-sports" element={<AddActivityForm roleKey="admin" activityType="sports" />} />
            <Route path="/admin/activities/view-sports/:id" element={<ViewActivityPage roleKey="admin" activityType="sports" />} />
            <Route path="/admin/activities/edit-sports/:id" element={<AddActivityForm roleKey="admin" activityType="sports" mode="edit" />} />
            <Route path="/admin/activities/chess-result" element={<ChessResultPage />} />
            <Route path="/admin/activities/competitions-list" element={<ActivityListView roleKey="admin" activityType="competition" />} />
            <Route path="/admin/activities/add-competition" element={<AddActivityForm roleKey="admin" activityType="competition" />} />
            <Route path="/admin/activities/view-competition/:id" element={<ViewActivityPage roleKey="admin" activityType="competition" />} />
            <Route path="/admin/activities/edit-competition/:id" element={<AddActivityForm roleKey="admin" activityType="competition" mode="edit" />} />

            {/* Documents */}
            <Route path="/admin/documents/student-documents" element={<StudentDocuments />} />
            <Route path="/admin/documents/add-student-documents" element={<AddStudentDocuments />} />
            <Route path="/admin/documents/view-student-documents/:id" element={<ViewStudentDocuments />} />
            <Route path="/admin/documents/edit-student-documents/:id" element={<EditStudentDocuments />} />
            <Route path="/admin/documents/employee-documents" element={<EmployeeDocuments />} />
            <Route path="/admin/documents/add-employee-documents" element={<AddEmployeeDocuments />} />
            <Route path="/admin/documents/edit-employee-documents/:id" element={<EditEmployeeDocuments />} />

            {/* Transport */}
            <Route path="/admin/transport/vehicle-details" element={<VehicleDetailsList />} />
            <Route path="/admin/transport/add-vehicle-details" element={<AddVehicleDetails />} />
            <Route path="/admin/transport/route-details" element={<RouteDetailsList />} />
            <Route path="/admin/transport/add-route-details" element={<AddRouteDetails />} />
            <Route path='/admin/transport/route-data-list' element={<RouteDataList />} />
            <Route path='/admin/transport/assigned-route-list' element={<AssignedRouteList />} />
            <Route path='/admin/transport/assign-route' element={<AssignRoute />} />

            {/* Exam Details */}
            <Route path='/admin/exam-details/exam-details-list' element={<ExamDetailsList />} />
            <Route path='/admin/exam-details/add-exam-details' element={<AddExamDetails />} />

            {/* Expenses */}
            <Route path='/admin/expenses/salaries-list' element={<SalariesList />} />
            <Route path='/admin/expenses/add-salaries-exp' element={<AddSalariesList />} />
            <Route path='/admin/expenses/hostel-list' element={<HostelExpensesList />} />
            <Route path='/admin/expenses/add-hostel-exp' element={<AddHostelExpenses />} />
            <Route path='/admin/expenses/transport-list' element={<TransportExpensesList />} />
            <Route path='/admin/expenses/add-transport-exp' element={<AddTransportExpenses />} />
            <Route path='/admin/expenses/library-list' element={<LibraryExpensesList />} />
            <Route path='/admin/expenses/add-library-exp' element={<AddLibraryExpenses />} />
            <Route path='/admin/expenses/others-list' element={<OtherExpensesList />} />
            <Route path='/admin/expenses/add-others-exp' element={<AddOtherExpensesList />} />

            {/* Notifications */}
            <Route path='/admin/notifications' element={<Notifications />} />
            <Route path='/admin/notification/exam-list' element={<Navigate to='/admin/notifications' replace />} />
            <Route path='/admin/notification/event-list' element={<Navigate to='/admin/notifications' replace />} />

            {/* Announcement */}
            <Route path='/admin/announcement' element={<AnnouncementList />} />
            <Route path='/admin/announcement/add' element={<AddAnnouncement />} />
            <Route path='/admin/announcement/view/:id' element={<ViewAnnouncement />} />

            {/* TC Request Approval (Super Admin) */}
            <Route path='/admin/tc-request-approval' element={<TcRequestApprovalList />} />
            <Route path='/admin/tc-request-approval/view/:id' element={<ViewTcRequestApproval />} />

            {/* Task Management */}
            {TaskManagementRoutes({ basePath: '/admin' })}

            {/* Leave Request */}
            <Route path='/admin/leave-request/my-requests' element={<MyLeaveRequests />} />
            <Route path='/admin/leave-request/my-requests/add' element={<AddLeaveRequest />} />
            <Route path='/admin/leave-request/my-requests/view/:id' element={<ViewMyLeaveRequest />} />
            <Route path='/admin/leave-request/received' element={<ReceivedLeaveRequests />} />
            <Route path='/admin/leave-request/received/view/:id' element={<ViewReceivedLeaveRequest />} />

            {/* Academic Calendar */}
            <Route path='/admin/academic-calendar' element={<AcademicCalendar />} />

            {/* Communication */}
            <Route path='/admin/communication' element={<Navigate to='/admin/communication/inbox' replace />} />
            <Route path='/admin/communication/inbox' element={<CommunicationInbox />} />
            <Route path='/admin/communication/inbox/:conversationId' element={<CommunicationInbox />} />
            <Route path='/admin/communication/direct-messages' element={<RedirectLegacyDirectMessages inboxBase='/admin/communication/inbox' />} />
            <Route path='/admin/communication/direct-messages/:conversationId' element={<RedirectLegacyDirectMessages inboxBase='/admin/communication/inbox' />} />

            {/* Escalation Management */}
            <Route path='/admin/escalation-management' element={<EscalationList />} />
            <Route path='/admin/escalation-management/add-escalation' element={<AddEscalation />} />
            <Route path='/admin/escalation-management/view/:id' element={<ViewEscalation />} />

            {/* RBAC */}
            <Route path='/admin/rbac/user-creation' element={<UserCreationPage />} />
            <Route path='/admin/rbac/user-creation/add' element={<CreateUserPage />} />
            <Route path='/admin/rbac/roles' element={<RolesPage />} />
        </ReactRoutes>
    )
}

export default AdminRoutes
