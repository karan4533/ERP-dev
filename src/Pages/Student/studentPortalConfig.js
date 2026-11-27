/** Default demo student profile for standalone Student login (unchanged behaviour). */
export const DEFAULT_STUDENT_PROFILE = {
    id: 'STU-2024-1042',
    name: 'Arjun Sharma',
    className: '10',
    section: 'A',
    classSection: '10-A',
    rollNumber: '10-A-01',
    admissionNumber: 'ADM-2024-1042',
    placementStatus: 'placed',
}

export const formatGradeSection = (student) => {
    const className = String(student?.className ?? '').trim()
    const label = /^(grade|class)\b/i.test(className) ? className : `Grade ${className}`
    return student?.section ? `${label} - ${student.section}` : label
}
