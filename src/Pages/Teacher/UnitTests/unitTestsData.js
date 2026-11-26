import { CLASSES, SECTIONS, SUBJECTS } from '../AssignedClass/assignedClassData'

const STORAGE_KEY = 'teacher-unit-tests'

export const ROUTE_BASE = '/teacher/unit-tests'

export const DEFAULT_UNIT_TESTS = [
    {
        id: 'UT-1001',
        entryId: 'UT-1001',
        subject: 'Mathematics',
        className: 'Class 10',
        section: 'A',
        title: 'Continuous Assessment 1 (CA-1): Quadratic Equations',
        description: 'Comprehensive evaluation of quadratic roots, discriminants, and word problems.',
        testDate: '2026-03-15',
        totalMarks: 50,
        duration: 60,
        fileName: 'Math_Class10A_CA1.pdf',
        fileType: 'pdf',
        teacher: 'Anita Verma',
        teacherId: 'TEA-1001',
        type: 'CA',
        marksEntered: true,
        averageScore: 42.5
    },
    {
        id: 'UT-1002',
        entryId: 'UT-1002',
        subject: 'Mathematics',
        className: 'Class 10',
        section: 'A',
        title: 'Periodic Continuous Assessment 2 (PCA-2): Trigonometric Identities',
        description: 'Applied trigonometry, complementary angles, and heights & distances.',
        testDate: '2026-04-02',
        totalMarks: 50,
        duration: 60,
        fileName: 'Math_Class10A_PCA2.pdf',
        fileType: 'pdf',
        teacher: 'Anita Verma',
        teacherId: 'TEA-1001',
        type: 'PCA',
        marksEntered: false,
        averageScore: null
    },
    {
        id: 'UT-1003',
        entryId: 'UT-1003',
        subject: 'Mathematics',
        className: 'Class 10',
        section: 'B',
        title: 'Continuous Assessment 1: Real Numbers & Polynomials',
        description: 'Fundamental theorem of arithmetic, Euclid division lemma, and zeroes of polynomials.',
        testDate: '2026-03-20',
        totalMarks: 40,
        duration: 45,
        fileName: 'Math_Class10B_CA1.pdf',
        fileType: 'pdf',
        teacher: 'Anita Verma',
        teacherId: 'TEA-1001',
        type: 'CA',
        marksEntered: true,
        averageScore: 34.0
    },
    {
        id: 'UT-1004',
        entryId: 'UT-1004',
        subject: 'Mathematics',
        className: 'Class 9',
        section: 'A',
        title: 'Periodic Assessment 1: Coordinate Geometry & Lines',
        description: 'Cartesian plane, coordinates, linear equations in two variables.',
        testDate: '2026-03-22',
        totalMarks: 40,
        duration: 45,
        fileName: 'Math_Class9A_PA1.pdf',
        fileType: 'pdf',
        teacher: 'Anita Verma',
        teacherId: 'TEA-1001',
        type: 'PCA',
        marksEntered: false,
        averageScore: null
    },
    {
        id: 'UT-1005',
        entryId: 'UT-1005',
        subject: 'Physics',
        className: 'Class 10',
        section: 'A',
        title: 'Continuous Assessment: Optics, Reflection & Refraction',
        description: 'Ray diagrams, lens formula, and power of combination of lenses.',
        testDate: '2026-03-18',
        totalMarks: 50,
        duration: 60,
        fileName: 'Physics_Optics_CA.pdf',
        fileType: 'pdf',
        teacher: 'Dr. Subramanian',
        teacherId: 'TEA-1002',
        type: 'CA',
        marksEntered: true,
        averageScore: 41.2
    },
    {
        id: 'UT-1006',
        entryId: 'UT-1006',
        subject: 'Chemistry',
        className: 'Class 10',
        section: 'A',
        title: 'Periodic Continuous Assessment: Chemical Reactions & Equations',
        description: 'Balancing reactions, types of chemical combinations, oxidation & reduction.',
        testDate: '2026-03-25',
        totalMarks: 50,
        duration: 60,
        fileName: 'Chemistry_PCA1.pdf',
        fileType: 'pdf',
        teacher: 'Ananya Roy',
        teacherId: 'TEA-1003',
        type: 'PCA',
        marksEntered: false,
        averageScore: null
    },
    {
        id: 'UT-1007',
        entryId: 'UT-1007',
        subject: 'English',
        className: 'Class 12',
        section: 'A',
        title: 'Continuous Assessment: Prose & Poetry Comprehension',
        description: 'Critical analysis of prescribed texts, unseen passage, and precis writing.',
        testDate: '2026-03-28',
        totalMarks: 80,
        duration: 90,
        fileName: 'English_Grade12_CA.pdf',
        fileType: 'pdf',
        teacher: 'Sandy Selva',
        teacherId: 'TEA-1004',
        type: 'CA',
        marksEntered: true,
        averageScore: 68.5
    }
]

export const getUnitTests = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
    } catch {
        /* ignore */
    }
    return DEFAULT_UNIT_TESTS
}

export const saveUnitTests = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getUnitTestById = (id) =>
    getUnitTests().find((item) => item.id === id) ?? null

export const generateEntryId = () => {
    const list = getUnitTests()
    const max = list.reduce((acc, item) => {
        const num = Number(item.entryId?.split('-').pop())
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 1000)
    return `UT-${max + 1}`
}

export const addUnitTest = (values) => {
    const entryId = generateEntryId()
    const record = {
        id: entryId,
        entryId,
        subject: values.subject,
        className: values.className,
        section: values.section,
        title: values.title,
        description: values.description,
        testDate: values.testDate,
        totalMarks: values.totalMarks,
        duration: values.duration,
        fileName: values.fileName || '—',
        fileType: values.fileType || 'pdf',
        teacher: values.teacher || 'Anita Verma',
        teacherId: values.teacherId || 'TEA-1001',
        type: values.type || 'CA',
        marksEntered: false,
        averageScore: null
    }
    saveUnitTests([record, ...getUnitTests()])
    return record
}

export const filterUnitTests = (items, filters) =>
    items.filter((item) => {
        const search = filters.search?.trim().toLowerCase() || ''
        const matchesSearch =
            !search ||
            item.entryId?.toLowerCase().includes(search) ||
            item.title?.toLowerCase().includes(search) ||
            item.description?.toLowerCase().includes(search) ||
            item.fileName?.toLowerCase().includes(search) ||
            item.teacher?.toLowerCase().includes(search)

        const matchesSubject = !filters.subject || item.subject === filters.subject
        const matchesClass = !filters.className || item.className === filters.className
        const matchesSection = !filters.section || item.section === filters.section

        return matchesSearch && matchesSubject && matchesClass && matchesSection
    })

export const formatTestDate = (value) => {
    if (!value) return '—'
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

export const calculateGrade = (marks, totalMarks) => {
    if (!marks || !totalMarks) return '—'
    const pct = (Number(marks) / Number(totalMarks)) * 100
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B+'
    if (pct >= 60) return 'B'
    if (pct >= 50) return 'C'
    if (pct >= 35) return 'D'
    return 'F'
}

export { CLASSES, SECTIONS, SUBJECTS }
