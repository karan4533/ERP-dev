import React from 'react'
import AssignedAuditObservations from '../Common/auditDomain/AssignedAuditObservations'
import { staffCommonRoutes } from '../Common/staffCommonRoutes'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import Dashboard from '../Pages/Librarian/Dashboard/Dashboard'
import BookList from '../Pages/Librarian/BookManagement/BookList/BookList'
import AddBooks from '../Pages/Librarian/BookManagement/BookList/AddBooks'
import IssuedBooks from '../Pages/Librarian/IssuedBooks/IssuedBooks'
import AddIssueBook from '../Pages/Librarian/IssuedBooks/AddIssueBook'
import BookRequests from '../Pages/Librarian/BookRequests/BookRequests'
import MembersList from '../Pages/Librarian/Members/MembersList'
import TcNocList from '../Pages/TransportManager/TcNoc/TcNocList'
import ViewTcNoc from '../Pages/TransportManager/TcNoc/ViewTcNoc'
import ReminderList from '../Pages/Librarian/Notification/ReminderList'
import EscalationList from '../Pages/Librarian/EscalationManagement/EscalationList'
import AddEscalation from '../Pages/Librarian/EscalationManagement/AddEscalation'
import ViewEscalation from '../Pages/Librarian/EscalationManagement/ViewEscalation'
import CommunicationInbox from '../Pages/Librarian/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import AcademicCalendar from '../Pages/Librarian/AcademicCalendar/AcademicCalendar'
import AnnouncementList from '../Pages/Librarian/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/Librarian/Announcement/ViewAnnouncement'
import MyAttendance from '../Pages/Librarian/Attendance/MyAttendance'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'

const LibrarianRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/librarian/dashboard" element={<Dashboard />} />

            {/* Book Management */}
            <Route path="/librarian/book-management/book-list" element={<BookList />} />
            <Route path="/librarian/book-management/add-book" element={<AddBooks />} />
            <Route path="/librarian/book-management/add-books" element={<AddBooks />} />
            <Route path="/librarian/book-requests" element={<BookRequests />} />

            {/* Issued Books */}
            <Route path="/librarian/issued-books/issued-book-list" element={<IssuedBooks />} />
            <Route path="/librarian/issued-books/add-issued-book" element={<AddIssueBook />} />
            <Route path="/librarian/issued-books/add-issue-book" element={<AddIssueBook />} />

            {/* Members */}
            <Route path="/librarian/members/member-list" element={<MembersList />} />

            {/* TC NOC (library dues clearance) */}
            <Route path="/librarian/tc-noc" element={<TcNocList />} />
            <Route path="/librarian/tc-noc/view/:id" element={<ViewTcNoc />} />

            {/* Notification */}
            <Route path="/librarian/notifications" element={<ReminderList />} />
            <Route path="/librarian/notification/reminder-list" element={<Navigate to="/librarian/notifications" replace />} />

            {/* Academic Calendar */}
            <Route path="/librarian/academic-calendar" element={<AcademicCalendar />} />

            {/* Announcement (view only) */}
            <Route path="/librarian/announcement" element={<AnnouncementList />} />
            <Route path="/librarian/announcement/view/:id" element={<ViewAnnouncement />} />

            {/* Attendance */}
            <Route path="/librarian/attendance" element={<Navigate to="/librarian/attendance/my-attendance" replace />} />
            <Route path="/librarian/attendance/my-attendance" element={<MyAttendance />} />

            {/* Communication */}
            <Route path="/librarian/communication" element={<Navigate to="/librarian/communication/inbox" replace />} />
            <Route path="/librarian/communication/inbox" element={<CommunicationInbox />} />
            <Route path="/librarian/communication/inbox/:conversationId" element={<CommunicationInbox />} />
            <Route path="/librarian/communication/direct-messages" element={<RedirectLegacyDirectMessages inboxBase="/librarian/communication/inbox" />} />
            <Route path="/librarian/communication/direct-messages/:conversationId" element={<RedirectLegacyDirectMessages inboxBase="/librarian/communication/inbox" />} />

            {TaskManagementRoutes({ basePath: '/librarian' })}

            {/* Escalation Management */}
            <Route path="/librarian/escalation-management" element={<EscalationList />} />
            <Route path="/librarian/escalation-management/add-escalation" element={<AddEscalation />} />
            <Route path="/librarian/escalation-management/view/:id" element={<ViewEscalation />} />

            <Route path="*" element={<Navigate to="/librarian/dashboard" replace />} />
            {staffCommonRoutes('/librarian', 'librarian', 'Librarian', { communication: false, calendar: false, notifications: false, leaveKey: 'librarian' })}
            <Route path="/librarian/audit-observations" element={<AssignedAuditObservations />} />
        </ReactRoutes>
    )
}

export default LibrarianRoutes
