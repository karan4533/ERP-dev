import AttendanceAndLeaveWorkspace from '../Common/AttendanceAndLeave/AttendanceAndLeaveWorkspace'
import { EnterpriseOperationsRoutes } from './EnterpriseOperationsRoutes'
import React from 'react'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
// Unified Library Workspace replaces separate legacy list views
import AddBooks from '../Pages/Librarian/BookManagement/BookList/AddBooks'
// import IssuedBooks from '../Pages/Librarian/IssuedBooks/IssuedBooks'
import AddIssueBook from '../Pages/Librarian/IssuedBooks/AddIssueBook'
import MembersList from '../Pages/Librarian/Members/MembersList'
import BookRequestsList from '../Pages/Librarian/BookRequests/BookRequestsList'
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
import Dashboard from '../Pages/Librarian/Dashboard/Dashboard'
import LibraryManagementWorkspace from '../Pages/Librarian/LibraryManagementWorkspace'

const LibrarianRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/librarian/dashboard" element={<Dashboard />} />

            {/* Book Management */}
            <Route path="/librarian/library-workspace" element={<LibraryManagementWorkspace />} />
            <Route path="/librarian/book-management" element={<LibraryManagementWorkspace defaultTab="catalog" />} />
            <Route path="/librarian/book-management/book-list" element={<LibraryManagementWorkspace defaultTab="catalog" />} />
            <Route path="/librarian/book-management/add-book" element={<AddBooks />} />

            {/* Issued Books */}
            <Route path="/librarian/book-issue" element={<LibraryManagementWorkspace defaultTab="circulation" />} />
            <Route path="/librarian/issued-books" element={<LibraryManagementWorkspace defaultTab="circulation" />} />
            <Route path="/librarian/issued-books/issued-book-list" element={<LibraryManagementWorkspace defaultTab="circulation" />} />
            <Route path="/librarian/issued-books/add-issued-book" element={<AddIssueBook />} />

            {/* Members */}
            <Route path="/librarian/members/member-list" element={<MembersList />} />
            <Route path="/librarian/book-requests" element={<BookRequestsList />} />

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
            <Route path="/librarian/attendance-and-leave" element={<AttendanceAndLeaveWorkspace defaultTab="overview" />} />
            <Route path="/librarian/attendance/my-attendance" element={<AttendanceAndLeaveWorkspace defaultTab="records" />} />

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

            {/* Enterprise Functional Operations (Stores, Gate Pass, File Room, Ticketing, Monitoring, Lost & Found) */}
            {EnterpriseOperationsRoutes({ basePath: '/librarian', role: 'librarian' })}

            <Route path="*" element={<Navigate to="/librarian/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default LibrarianRoutes
