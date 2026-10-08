import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { DEFAULT_STUDENT_PROFILE } from '../studentPortalConfig'

export const STUDENT_HOME_FUN_ROUTE = '/student/student-deliverables/home-fun'
export const STUDENT_STUDY_MATERIALS_ROUTE = '/student/student-deliverables/study-materials'
export const STUDENT_SAMPLE_QUESTIONS_ROUTE = '/student/student-deliverables/sample-questions'

/** @deprecated Use useActiveStudent().activeStudentId in components */
export const CURRENT_STUDENT_ID = DEFAULT_STUDENT_PROFILE.id
/** @deprecated Use useActiveStudent().activeStudent.name in components */
export const CURRENT_STUDENT_NAME = DEFAULT_STUDENT_PROFILE.name

export { useActiveStudent }
