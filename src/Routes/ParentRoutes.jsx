import React from 'react'
import { Route, Routes as ReactRoutes } from 'react-router-dom'
import StudentPortalRoutes from './StudentPortalRoutes'
import ChildSelection from '../Pages/Parent/ChildSelection'
import ParentDashboard from '../Pages/Parent/ParentDashboard'
import {
    PARENT_COMMUNICATION_INBOX,
    PARENT_HOME_FUN_ROUTE,
    PARENT_ROUTE_PREFIX,
    PARENT_SAMPLE_QUESTIONS_ROUTE,
    PARENT_SELECT_CHILD_ROUTE,
    PARENT_STUDY_MATERIALS_ROUTE,
} from '../Pages/Parent/parentPortalConfig'

const ParentRoutes = () => (
    <ReactRoutes>
        <Route path={PARENT_SELECT_CHILD_ROUTE} element={<ChildSelection />} />
        <Route
            path="*"
            element={(
                <StudentPortalRoutes
                    routePrefix={PARENT_ROUTE_PREFIX}
                    homeFunRoute={PARENT_HOME_FUN_ROUTE}
                    studyMaterialsRoute={PARENT_STUDY_MATERIALS_ROUTE}
                    sampleQuestionsRoute={PARENT_SAMPLE_QUESTIONS_ROUTE}
                    communicationInboxBase={PARENT_COMMUNICATION_INBOX}
                    dashboardComponent={ParentDashboard}
                    includeOnlineClass
                    includeExtraClass
                    includeStarRatings={false}
                    timetableWeeklyOnly
                    includeBusRoute={false}
                    trackBusWithRouteDetails
                />
            )}
        />
    </ReactRoutes>
)

export default ParentRoutes
