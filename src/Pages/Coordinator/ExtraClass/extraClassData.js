import { CLASSES, SECTIONS, SUBJECTS } from '../AssignedClass/assignedClassData'

export const VENUES = [
    'Room 204 — Science Block',
    'Room 112 — Main Building',
    'Computer Lab — Block B',
    'Seminar Hall — Admin Wing',
    'Library Conference Room',
]

export const EXTRA_CLASSES = [
    {
        id: 'EC-1001',
        extraClassId: 'EC-1001',
        subject: 'Mathematics',
        className: '10',
        section: 'A',
        classSection: '10-A',
        topic: 'Quadratic Equations — Problem Solving',
        date: '12-06-2026',
        startTime: '03:30 PM',
        endTime: '04:30 PM',
        venue: 'Room 204 — Science Block',
        reason: 'Board exam preparation for weak performers',
    },
    {
        id: 'EC-1002',
        extraClassId: 'EC-1002',
        subject: 'Mathematics',
        className: '10',
        section: 'B',
        classSection: '10-B',
        topic: 'Trigonometry — Identity Proofs',
        date: '14-06-2026',
        startTime: '04:00 PM',
        endTime: '05:00 PM',
        venue: 'Room 112 — Main Building',
        reason: 'Revision before unit test',
    },
    {
        id: 'EC-1003',
        extraClassId: 'EC-1003',
        subject: 'Mathematics',
        className: '9',
        section: 'A',
        classSection: '9-A',
        topic: 'Algebra — Factorisation Techniques',
        date: '16-06-2026',
        startTime: '03:00 PM',
        endTime: '04:00 PM',
        venue: 'Room 204 — Science Block',
        reason: 'Catch-up session after sports day holiday',
    },
    {
        id: 'EC-1004',
        extraClassId: 'EC-1004',
        subject: 'Mathematics',
        className: '11',
        section: 'A',
        classSection: '11-A',
        topic: 'Calculus — Limits & Continuity',
        date: '18-06-2026',
        startTime: '02:30 PM',
        endTime: '03:45 PM',
        venue: 'Seminar Hall — Admin Wing',
        reason: 'Advanced learners enrichment session',
    },
    {
        id: 'EC-1005',
        extraClassId: 'EC-1005',
        subject: 'Mathematics',
        className: '10',
        section: 'A',
        classSection: '10-A',
        topic: 'Statistics — Mean, Median & Mode',
        date: '20-06-2026',
        startTime: '03:30 PM',
        endTime: '04:30 PM',
        venue: 'Computer Lab — Block B',
        reason: 'Practical worksheet completion',
    },
]

export const getExtraClassById = (id) =>
    EXTRA_CLASSES.find((item) => item.id === id) ?? null

export { CLASSES, SECTIONS, SUBJECTS }
