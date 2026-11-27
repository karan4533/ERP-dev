/**
 * The school's grade bands and pass mark as currently configured in the frontend.
 * The server has no grading configuration; these values are unchanged from markEntryApprovalData.
 */
export const PASS_MARK_PERCENT = 33

export const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    if (percentage >= PASS_MARK_PERCENT) return 'D'
    return 'F'
}
