import { addDays } from 'date-fns'
import { generateId, toDateKey } from '../../../Common/MeetingsCalendar/utils/dateHelpers'

const today = new Date()

export const SEED_EVENTS = [
    {
        id: generateId(),
        title: 'Department Heads Meeting',
        description: 'Monthly review with canteen, IT, transport, and housekeeping managers',
        date: toDateKey(today),
        startTime: '10:00',
        endTime: '11:30',
        colorIdx: 0,
    },
    {
        id: generateId(),
        title: 'Budget Approval Review',
        description: 'Cross-department budget requests pending Joint Director sign-off',
        date: toDateKey(today),
        startTime: '14:00',
        endTime: '15:00',
        colorIdx: 2,
    },
    {
        id: generateId(),
        title: 'Director Office Briefing',
        description: 'Weekly sync with school director on operational updates',
        date: toDateKey(addDays(today, 1)),
        startTime: '09:30',
        endTime: '10:30',
        colorIdx: 4,
    },
]
