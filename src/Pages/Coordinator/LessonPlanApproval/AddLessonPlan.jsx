import React from 'react'
import LessonPlanEntryForm from '../../../Common/LessonPlanApproval/Components/LessonPlanEntryForm'
import { COORDINATOR_NAME, COORDINATOR_ROLE } from '../../../Common/LessonPlanApproval/lessonPlanApprovalData'

const AddLessonPlan = () => (
    <LessonPlanEntryForm
        submitterName={COORDINATOR_NAME}
        submitterRole={COORDINATOR_ROLE}
        successPath='/coordinator/lesson-plan-approval'
    />
)

export default AddLessonPlan
