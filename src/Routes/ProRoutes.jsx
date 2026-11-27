import React from 'react'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import { staffCommonRoutes } from '../Common/staffCommonRoutes'
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom'
import Dashboard from '../Pages/Pro/Dashboard/Dashboard'
import PendingFeature from '../Pages/Pro/PendingFeature'
import GovernmentCases from '../Pages/Pro/GovernmentCases/GovernmentCases'
import AnnouncementList from '../Pages/Pro/Announcement/AnnouncementList'
import ViewAnnouncement from '../Pages/Pro/Announcement/ViewAnnouncement'
import CommunicationInbox from '../Pages/Pro/Communication/Inbox'
import RedirectLegacyDirectMessages from '../Common/Communication/RedirectLegacyDirectMessages'
import EventsHub from '../Pages/Pro/Events/EventsHub'
import CulturalList from '../Pages/Pro/Events/CulturalList'
import SportsList from '../Pages/Pro/Events/SportsList'
import CompetitionsList from '../Pages/Pro/Events/CompetitionsList'
import ViewCultural from '../Pages/Pro/Events/ViewCultural'
import ViewSports from '../Pages/Pro/Events/ViewSports'
import ViewCompetition from '../Pages/Pro/Events/ViewCompetition'
import AdmissionEnquiry from '../Pages/FrontOffice/AdmissionEnquiry/AdmissionEnquiry'
import AddAdmissionEnquiry from '../Pages/FrontOffice/AdmissionEnquiry/AddAdmissionEnquiry'
import ViewAdmissionEnquiry from '../Pages/FrontOffice/AdmissionEnquiry/ViewAdmissionEnquiry'

const ProRoutes = () => (
    <ReactRoutes>
        <Route path="/pro/dashboard" element={<Dashboard />} />
        <Route path="/pro/government-cases" element={<GovernmentCases />} />

        <Route path="/pro/announcements" element={<AnnouncementList />} />
        <Route path="/pro/announcements/view/:id" element={<ViewAnnouncement />} />

        <Route path="/pro/events" element={<EventsHub />} />
        <Route path="/pro/events/cultural" element={<CulturalList />} />
        <Route path="/pro/events/cultural/view/:id" element={<ViewCultural />} />
        <Route path="/pro/events/sports" element={<SportsList />} />
        <Route path="/pro/events/sports/view/:id" element={<ViewSports />} />
        <Route path="/pro/events/competitions" element={<CompetitionsList />} />
        <Route path="/pro/events/competitions/view/:id" element={<ViewCompetition />} />

        <Route path="/pro/communication" element={<Navigate to="/pro/communication/inbox" replace />} />
        <Route path="/pro/communication/inbox" element={<CommunicationInbox />} />
        <Route path="/pro/communication/inbox/:conversationId" element={<CommunicationInbox />} />
        <Route
            path="/pro/communication/direct-messages"
            element={<RedirectLegacyDirectMessages inboxBase="/pro/communication/inbox" />}
        />
        <Route
            path="/pro/communication/direct-messages/:conversationId"
            element={<RedirectLegacyDirectMessages inboxBase="/pro/communication/inbox" />}
        />

        <Route path="/pro/enquiries" element={<AdmissionEnquiry />} />
        <Route path="/pro/enquiries/add" element={<AddAdmissionEnquiry />} />
        <Route path="/pro/enquiries/edit/:id" element={<AddAdmissionEnquiry />} />
        <Route path="/pro/enquiries/view/:id" element={<ViewAdmissionEnquiry />} />

        <Route
            path="/pro/reports"
            element={(
                <PendingFeature
                    title="Communication Reports"
                    description="No PRO communication-reporting API exists yet. Reports are not generated from this screen."
                />
            )}
        />
        <Route
            path="/pro/settings"
            element={(
                <PendingFeature
                    title="Settings"
                    description="PRO portal settings have not been specified or implemented."
                />
            )}
        />

        <Route path="/pro" element={<Navigate to="/pro/dashboard" replace />} />
        <Route path="/pro/*" element={<Navigate to="/pro/dashboard" replace />} />
        {TaskManagementRoutes({ basePath: '/pro' })}
        {staffCommonRoutes('/pro', 'pro', 'PRO', { communication: false, leaveKey: 'pro' })}
    </ReactRoutes>
)

export default ProRoutes
