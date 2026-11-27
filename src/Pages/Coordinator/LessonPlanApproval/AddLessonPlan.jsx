import React from 'react'
import LessonPlanEntryForm from '../../../Common/LessonPlanApproval/Components/LessonPlanEntryForm'
import { COORDINATOR_ROLE } from '../../../Common/LessonPlanApproval/lessonPlanApprovalData'
import { useTeacherAssignments } from '../../../Common/Teacher/useTeacherAssignments'
import { useAuth } from '../../../context/AuthContext'

const AddLessonPlan = () => {
    const { name } = useAuth()
    const assignments = useTeacherAssignments()
    const submitterName = assignments.profile?.name || name || ''

    return (
        <LessonPlanEntryForm
            submitterName={submitterName}
            submitterRole={COORDINATOR_ROLE}
            successPath='/coordinator/lesson-plan-approval'
            classOptions={assignments.classes}
            sectionOptionsFor={assignments.sectionsFor}
            subjectOptions={assignments.subjects}
            emptyHint={assignments.emptyReason}
        />
    )
}

export default AddLessonPlan
