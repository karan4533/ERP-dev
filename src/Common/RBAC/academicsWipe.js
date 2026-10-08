const WIPE_FLAG = 'schoolerp-academics-wipe-v1'

const ACADEMICS_STORAGE_KEYS = [
    'school-erp-lesson-plan-approvals',
    'teacher-mark-entry-sessions',
    'teacher-unit-tests',
    'teacher-home-fun-deliverables',
    'teacher-student-deliverables-study-materials',
    'teacher-student-deliverables-sample-questions',
    'teacher-enter-marks',
    'teacher-result-summary',
    'student-home-fun-submissions',
    'teacher-student-transfers',
    'student-star-ratings-som',
]

/** One-time clear of Academics-related localStorage seeds for a blank demo slate. */
export const runAcademicsWipeIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined') return
        if (localStorage.getItem(WIPE_FLAG) === '1') return

        ACADEMICS_STORAGE_KEYS.forEach((key) => {
            localStorage.removeItem(key)
        })
        localStorage.setItem(WIPE_FLAG, '1')
    } catch {
        /* ignore */
    }
}
