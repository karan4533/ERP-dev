import { addDays } from 'date-fns'
import { generateId, toDateKey } from '../../../Common/MeetingsCalendar/utils/dateHelpers'

const today = new Date()

export const SEED_EVENTS = [
    {
        id: generateId(),
        title: 'Audit Team Weekly Sync',
        description: 'HR Manager, Process Audit Manager, and Quality Audit Principal — open findings review',
        date: toDateKey(today),
        startTime: '10:00',
        endTime: '11:00',
        colorIdx: 0,
    },
    {
        id: generateId(),
        title: 'Process Audit Planning — Finance',
        description: 'Process Audit Manager and Executive — scope walkthrough for AUD-2026-022',
        date: toDateKey(today),
        startTime: '14:00',
        endTime: '15:30',
        colorIdx: 2,
    },
    {
        id: generateId(),
        title: 'HR Audit Compliance Briefing',
        description: 'HR Manager and HR Executive — policy gap analysis before department site visits',
        date: toDateKey(addDays(today, 1)),
        startTime: '09:30',
        endTime: '10:30',
        colorIdx: 4,
    },
    {
        id: generateId(),
        title: 'Quality Audit — Academic Standards Review',
        description: 'Quality Audit Principal — moderation and assessment integrity checkpoint',
        date: toDateKey(addDays(today, 2)),
        startTime: '11:00',
        endTime: '12:00',
        colorIdx: 1,
    },
]
