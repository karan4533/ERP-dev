import { CLASSES, SECTIONS, SUBJECTS } from '../AssignedClass/assignedClassData'

export const COMPLETION_STATUSES = ['Completed', 'In-Process', 'Pending']

export const statusBadgeColor = {
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    'In-Process': 'bg-[#2196F333] text-[#2196F3]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
}

export const SYLLABUS_LIST = [
    {
        id: 'SYL-1001',
        syllabusId: 'SYL-1001',
        subject: 'Mathematics',
        className: '10',
        section: 'A',
        chapterName: 'Real Numbers',
        syllabusDescription: 'Euclid\'s division lemma, fundamental theorem of arithmetic, irrational numbers, and decimal expansions.',
        targetCompletionDate: '15-06-2026',
        actualCompletionDate: '14-06-2026',
        uploadDate: '01-04-2026',
        uploadedBy: 'Mr. Anand Kumar',
        completionStatus: 'Completed',
    },
    {
        id: 'SYL-1002',
        syllabusId: 'SYL-1002',
        subject: 'Mathematics',
        className: '10',
        section: 'A',
        chapterName: 'Polynomials',
        syllabusDescription: 'Zeros of polynomials, relationship between zeros and coefficients, division algorithm for polynomials.',
        targetCompletionDate: '30-06-2026',
        actualCompletionDate: '—',
        uploadDate: '01-04-2026',
        uploadedBy: 'Mr. Anand Kumar',
        completionStatus: 'In-Process',
    },
    {
        id: 'SYL-1003',
        syllabusId: 'SYL-1003',
        subject: 'Mathematics',
        className: '10',
        section: 'A',
        chapterName: 'Pair of Linear Equations in Two Variables',
        syllabusDescription: 'Graphical and algebraic methods of solving linear equations, substitution, elimination, and cross-multiplication.',
        targetCompletionDate: '20-07-2026',
        actualCompletionDate: '—',
        uploadDate: '01-04-2026',
        uploadedBy: 'Mr. Anand Kumar',
        completionStatus: 'Pending',
    },
    {
        id: 'SYL-1004',
        syllabusId: 'SYL-1004',
        subject: 'Mathematics',
        className: '10',
        section: 'B',
        chapterName: 'Quadratic Equations',
        syllabusDescription: 'Standard form, factorisation, completing the square, quadratic formula, and nature of roots.',
        targetCompletionDate: '10-08-2026',
        actualCompletionDate: '—',
        uploadDate: '05-04-2026',
        uploadedBy: 'Mr. Anand Kumar',
        completionStatus: 'Pending',
    },
    {
        id: 'SYL-1005',
        syllabusId: 'SYL-1005',
        subject: 'Mathematics',
        className: '9',
        section: 'A',
        chapterName: 'Number Systems',
        syllabusDescription: 'Review of rational and irrational numbers, laws of exponents for real numbers, and representation on number line.',
        targetCompletionDate: '25-06-2026',
        actualCompletionDate: '24-06-2026',
        uploadDate: '02-04-2026',
        uploadedBy: 'Mr. Anand Kumar',
        completionStatus: 'Completed',
    },
    {
        id: 'SYL-1006',
        syllabusId: 'SYL-1006',
        subject: 'Mathematics',
        className: '11',
        section: 'A',
        chapterName: 'Sets',
        syllabusDescription: 'Sets and their representations, types of sets, operations on sets, and Venn diagrams.',
        targetCompletionDate: '05-07-2026',
        actualCompletionDate: '—',
        uploadDate: '08-04-2026',
        uploadedBy: 'Mr. Anand Kumar',
        completionStatus: 'In-Process',
    },
]

export const getSyllabusById = (id) =>
    SYLLABUS_LIST.find((item) => item.id === id) ?? null

export { CLASSES, SECTIONS, SUBJECTS }
