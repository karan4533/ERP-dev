import React from 'react'
import LessonPlanEntryForm from '../../../Common/LessonPlanApproval/Components/LessonPlanEntryForm'
import { TEACHER_NAME, TEACHER_ROLE } from '../../../Common/LessonPlanApproval/lessonPlanApprovalData'

const AddLessonPlan = () => (
    <LessonPlanEntryForm
        submitterName={TEACHER_NAME}
        submitterRole={TEACHER_ROLE}
        successPath='/teacher/lesson-plan-approval'
    />
)

export default AddLessonPlan
