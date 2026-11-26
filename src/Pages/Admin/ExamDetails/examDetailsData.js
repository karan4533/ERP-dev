const STORAGE_KEY = 'schoolerp-admin-exam-details-v1'

export const CLASS_OPTIONS = [
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12',
]

export const SUBJECT_OPTIONS = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Tamil',
    'Social Science',
    'Computer Science',
    'Hindi',
]

export const ROOM_OPTIONS = [
    'Room 101',
    'Room 102',
    'Room 103',
    'Room 201',
    'Room 202',
    'Science Lab 1',
    'Computer Lab 2',
    'Auditorium Hall A',
]

export const INVIGILATOR_OPTIONS = [
    'Mr. Ravi Kumar',
    'Ms. Anitha Verma',
    'Dr. Suresh Menon',
    'Dr. Subramanian',
    'Mrs. Priya Nair',
    'Mr. Karthik Selvan',
]

export const DEFAULT_EXAM_DETAILS = [
    {
        id: 'EXD-001',
        examName: 'Mid Term Examination',
        className: 'Class 10',
        section: 'A',
        subject: 'Mathematics',
        examDate: '15-09-2025',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        room: 'Room 101',
        invigilator: 'Mr. Ravi Kumar',
    },
    {
        id: 'EXD-002',
        examName: 'Mid Term Examination',
        className: 'Class 10',
        section: 'A',
        subject: 'Physics',
        examDate: '17-09-2025',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        room: 'Room 102',
        invigilator: 'Dr. Subramanian',
    },
    {
        id: 'EXD-003',
        examName: 'Annual Assessment',
        className: 'Class 9',
        section: 'B',
        subject: 'English',
        examDate: '18-09-2025',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        room: 'Room 103',
        invigilator: 'Ms. Anitha Verma',
    },
]

export const getStoredExamDetails = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    return DEFAULT_EXAM_DETAILS
}

export const saveStoredExamDetails = (records) => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
            window.dispatchEvent(new Event('schoolerp-exam-details-sync'))
        }
    } catch {
        /* ignore */
    }
}

export const addExamDetail = (data) => {
    const records = getStoredExamDetails()
    const newRecord = {
        id: `EXD-${Date.now().toString().slice(-4)}`,
        examName: data.examName || 'Assessment',
        className: data.className || 'Class 10',
        section: data.section || 'A',
        subject: data.subject || 'Mathematics',
        examDate: data.examDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        startTime: data.startTime || '09:00 AM',
        endTime: data.endTime || '12:00 PM',
        room: data.room || 'Room 101',
        invigilator: data.invigilator || 'Staff Member',
    }
    const updated = [newRecord, ...records]
    saveStoredExamDetails(updated)
    return newRecord
}

export const deleteExamDetail = (id) => {
    const records = getStoredExamDetails()
    const updated = records.filter((r) => r.id !== id)
    saveStoredExamDetails(updated)
    return updated
}

