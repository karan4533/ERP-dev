import React from 'react'
import StudentPortalRoutes from './StudentPortalRoutes'
import {
    STUDENT_HOME_FUN_ROUTE,
    STUDENT_SAMPLE_QUESTIONS_ROUTE,
    STUDENT_STUDY_MATERIALS_ROUTE,
} from '../Pages/Student/StudentDeliverables/studentDeliverablesConfig'

const StudentRoutes = () => (
    <StudentPortalRoutes
        routePrefix="/student"
        homeFunRoute={STUDENT_HOME_FUN_ROUTE}
        studyMaterialsRoute={STUDENT_STUDY_MATERIALS_ROUTE}
        sampleQuestionsRoute={STUDENT_SAMPLE_QUESTIONS_ROUTE}
        communicationInboxBase="/student/communication/inbox"
    />
)

export default StudentRoutes
