/** Default demo student profile for standalone Student login (unchanged behaviour). */
export const DEFAULT_STUDENT_PROFILE = {
    id: 'STU-2024-1042',
    name: 'Arjun Sharma',
    className: '10',
    section: 'A',
    classSection: '10-A',
    rollNumber: '10-A-01',
    admissionNumber: 'ADM-2024-1042',
}

export const formatGradeSection = (student) =>
    `Grade ${student.className} - ${student.section}`
