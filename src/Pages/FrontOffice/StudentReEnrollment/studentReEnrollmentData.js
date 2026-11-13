const STORAGE_KEY = 'front-office-student-re-enrollment'

export const ROUTE_BASE = '/front-office/student-re-enrollment'
export const ADD_ROUTE = '/front-office/student-re-enrollment/add'

export const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'Re-Enrolled']

export const GRADES = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
export const SECTIONS = ['A', 'B', 'C']
export const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027']
export const ORIGINAL_TC_OPTIONS = ['Yes', 'No']

export const statusBadgeColor = {
    Pending: 'text-[#FF9800] border-[#FF980033] bg-[#FF980014]',
    Approved: 'text-[#4CAF50] border-[#4CAF5033] bg-[#4CAF5014]',
    Rejected: 'text-[#980E0F] border-[#980E0F33] bg-[#980E0F14]',
    'Re-Enrolled': 'text-[#515DEF] border-[#515DEF33] bg-[#515DEF14]',
}

export const defaultForm = () => ({
    admissionNumber: '',
    studentName: '',
    guardianName: '',
    mobileNumber: '',
    previousAcademicYear: '2024-2025',
    previousClass: 'Grade 10',
    previousSection: '',
    tcNumber: '',
    tcIssuedDate: null,
    tcReturnedDate: null,
    originalTcReceived: 'Yes',
    academicYear: '2025-2026',
    newClass: 'Grade 11',
    section: '',
    rollNumber: '',
    status: 'Pending',
})

const formatDate = (value) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    return value.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const DEFAULT_RECORDS = [
    {
        id: 'SRE-001',
        admissionNumber: 'ADM-NO1845',
        studentName: 'Sandy Selva',
        guardianName: 'Selvam R.',
        mobileNumber: '9944076993',
        previousAcademicYear: '2024-2025',
        previousClass: 'Grade 10',
        previousSection: 'A',
        tcNumber: 'TC/2025/0142',
        tcIssuedDate: '15-05-2025',
        tcReturnedDate: '02-06-2025',
        originalTcReceived: 'Yes',
        academicYear: '2025-2026',
        newClass: 'Grade 11',
        section: 'A',
        rollNumber: '11',
        status: 'Re-Enrolled',
        admissionStatus: 'Active',
        submittedDate: '02-06-2025',
    },
    {
        id: 'SRE-002',
        admissionNumber: 'ADM-NO1846',
        studentName: 'John Milton',
        guardianName: 'Milton Joseph',
        mobileNumber: '9944076994',
        previousAcademicYear: '2024-2025',
        previousClass: 'Grade 10',
        previousSection: 'B',
        tcNumber: 'TC/2025/0158',
        tcIssuedDate: '20-05-2025',
        tcReturnedDate: '05-06-2025',
        originalTcReceived: 'Yes',
        academicYear: '2025-2026',
        newClass: 'Grade 11',
        section: 'B',
        rollNumber: '24',
        status: 'Pending',
        admissionStatus: 'Inactive',
        submittedDate: '05-06-2025',
    },
]

export const getReEnrollments = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return [...DEFAULT_RECORDS]
}

export const saveReEnrollments = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getReEnrollmentById = (id) =>
    getReEnrollments().find((item) => item.id === id) ?? null

export const generateReEnrollmentId = () => {
    const list = getReEnrollments()
    const max = list.reduce((acc, item) => {
        const num = Number(item.id.replace('SRE-', ''))
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 0)
    return `SRE-${String(max + 1).padStart(3, '0')}`
}

export const validateReEnrollmentForm = (form) => {
    const errors = []
    if (!form.admissionNumber?.trim()) errors.push('Admission Number is required.')
    if (!form.studentName?.trim()) errors.push('Student Name is required.')
    if (!form.guardianName?.trim()) errors.push('Father / Guardian Name is required.')
    if (!form.mobileNumber?.trim()) errors.push('Mobile Number is required.')
    if (!form.previousSection) errors.push('Previous Section is required.')
    if (!form.tcNumber?.trim()) errors.push('TC Number is required.')
    if (!form.tcIssuedDate) errors.push('TC Issued Date is required.')
    if (!form.tcReturnedDate) errors.push('TC Returned Date is required.')
    if (!form.section) errors.push('New Section is required.')
    if (!form.rollNumber?.trim()) errors.push('Roll Number is required.')
    return errors
}

const buildRecord = (form, existingId) => {
    const isReEnrolled = form.status === 'Re-Enrolled' || form.status === 'Approved'
    return {
        id: existingId || generateReEnrollmentId(),
        admissionNumber: form.admissionNumber.trim(),
        studentName: form.studentName.trim(),
        guardianName: form.guardianName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        previousAcademicYear: form.previousAcademicYear,
        previousClass: form.previousClass,
        previousSection: form.previousSection,
        tcNumber: form.tcNumber.trim(),
        tcIssuedDate: formatDate(form.tcIssuedDate),
        tcReturnedDate: formatDate(form.tcReturnedDate),
        originalTcReceived: form.originalTcReceived,
        academicYear: form.academicYear,
        newClass: form.newClass,
        section: form.section,
        rollNumber: form.rollNumber.trim(),
        status: form.status || 'Pending',
        admissionStatus: isReEnrolled ? 'Active' : 'Inactive',
        submittedDate: formatDate(new Date()),
    }
}

export const addReEnrollment = (form) => {
    const record = buildRecord(form)
    saveReEnrollments([record, ...getReEnrollments()])
    return record
}

export const updateReEnrollment = (id, form) => {
    const record = buildRecord(form, id)
    saveReEnrollments(getReEnrollments().map((item) => (item.id === id ? record : item)))
    return record
}

export const formFromRecord = (record) => ({
    admissionNumber: record.admissionNumber,
    studentName: record.studentName,
    guardianName: record.guardianName,
    mobileNumber: record.mobileNumber,
    previousAcademicYear: record.previousAcademicYear,
    previousClass: record.previousClass,
    previousSection: record.previousSection,
    tcNumber: record.tcNumber,
    tcIssuedDate: record.tcIssuedDate,
    tcReturnedDate: record.tcReturnedDate,
    originalTcReceived: record.originalTcReceived,
    academicYear: record.academicYear,
    newClass: record.newClass,
    section: record.section,
    rollNumber: record.rollNumber,
    status: record.status,
})
