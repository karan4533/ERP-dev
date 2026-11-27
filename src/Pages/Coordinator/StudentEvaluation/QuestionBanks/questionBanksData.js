import { CLASSES, SECTIONS, SUBJECTS } from '../../AssignedClass/assignedClassData'

export const EXAM_TYPES = ['Unit Test', 'Mid Term', 'Annual Exam', 'Pre-Board', 'Practice Test']

const STORAGE_KEY = 'teacher-question-banks'

export const formatDate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(d.getTime())) return typeof date === 'string' ? date : ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

const DEFAULT_QUESTION_BANKS = [
    {
        id: 'QB-1001',
        documentId: 'QB-1001',
        subject: 'Mathematics',
        className: '10',
        section: 'A',
        classSection: '10 - A',
        examType: 'Mid Term',
        paperTitle: 'Quadratic Equations — Question Paper',
        fileName: 'Maths_Quadratic_Equations_QP.pdf',
        description: 'Mid term question paper covering quadratic formula, factorisation, and word problems.',
        uploadDate: '01-06-2026',
    },
    {
        id: 'QB-1002',
        documentId: 'QB-1002',
        subject: 'Physics',
        className: '10',
        section: 'A',
        classSection: '10 - A',
        examType: 'Unit Test',
        paperTitle: 'Light Reflection & Refraction — Unit Test',
        fileName: 'Physics_Light_Unit_Test.pdf',
        description: 'Unit test bank with MCQs and numerical problems on mirrors and lenses.',
        uploadDate: '05-06-2026',
    },
    {
        id: 'QB-1003',
        documentId: 'QB-1003',
        subject: 'English',
        className: '10',
        section: 'A',
        classSection: '10 - A',
        examType: 'Annual Exam',
        paperTitle: 'English Literature — Annual Exam Paper',
        fileName: 'English_Literature_Annual.pdf',
        description: 'Annual exam question bank including comprehension, essay, and grammar sections.',
        uploadDate: '08-06-2026',
    },
    {
        id: 'QB-1004',
        documentId: 'QB-1004',
        subject: 'Chemistry',
        className: '10',
        section: 'A',
        classSection: '10 - A',
        examType: 'Pre-Board',
        paperTitle: 'Periodic Table & Chemical Bonding',
        fileName: 'Chemistry_Periodic_Table_PreBoard.pdf',
        description: 'Pre-board practice paper with theory and diagram-based questions.',
        uploadDate: '10-06-2026',
    },
    {
        id: 'QB-1005',
        documentId: 'QB-1005',
        subject: 'Computer Science',
        className: '10',
        section: 'A',
        classSection: '10 - A',
        examType: 'Practice Test',
        paperTitle: 'Flowcharts & Python Basics',
        fileName: 'CS_Flowcharts_Practice.pdf',
        description: 'Practice test questions on algorithms, flowcharts, and basic Python syntax.',
        uploadDate: '12-06-2026',
    },
]

export const saveQuestionBanks = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getQuestionBanks = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveQuestionBanks(DEFAULT_QUESTION_BANKS)
    return DEFAULT_QUESTION_BANKS
}

export const getQuestionBankById = (id) =>
    getQuestionBanks().find((item) => item.id === id || item.documentId === id) ?? null

export const addQuestionBank = (payload) => {
    const list = getQuestionBanks()
    const maxId = list.reduce((max, item) => {
        const num = parseInt(String(item.documentId).replace('QB-', ''), 10)
        return Number.isNaN(num) ? max : Math.max(max, num)
    }, 1000)
    const documentId = `QB-${maxId + 1}`

    const record = {
        id: documentId,
        documentId,
        subject: payload.subject,
        className: payload.className,
        section: payload.section,
        classSection: `${payload.className} - ${payload.section}`,
        examType: payload.examType,
        paperTitle: payload.paperTitle,
        fileName: payload.fileName || '—',
        description: payload.description,
        uploadDate: payload.uploadDate,
    }

    const next = [...list, record]
    saveQuestionBanks(next)
    return record
}

export { CLASSES, SECTIONS, SUBJECTS }
