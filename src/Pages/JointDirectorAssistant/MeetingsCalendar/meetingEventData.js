import { addDays } from 'date-fns'
import { generateId, toDateKey } from '../../../Common/MeetingsCalendar/utils/dateHelpers'

const today = new Date()

export const SEED_EVENTS = [
    {
        id: generateId(),
        title: 'JD Office Coordination',
        description: 'Prepare agenda and minutes for Joint Director meetings',
        date: toDateKey(today),
        startTime: '09:00',
        endTime: '09:45',
        colorIdx: 1,
    },
    {
        id: generateId(),
        title: 'Request Follow-up Call',
        description: 'Follow up on pending department manager approval requests',
        date: toDateKey(today),
        startTime: '11:30',
        endTime: '12:15',
        colorIdx: 3,
    },
    {
        id: generateId(),
        title: 'Escalation Triage',
        description: 'Review open escalations and assign action owners',
        date: toDateKey(addDays(today, 1)),
        startTime: '15:00',
        endTime: '16:00',
        colorIdx: 5,
    },
]
