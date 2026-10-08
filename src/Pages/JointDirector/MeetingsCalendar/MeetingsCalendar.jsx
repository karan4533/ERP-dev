import MeetingsCalendar from '../../../Common/MeetingsCalendar/MeetingsCalendar'
import { SEED_EVENTS } from './meetingEventData'

export default function JointDirectorMeetingsCalendar() {
    return <MeetingsCalendar seedEvents={SEED_EVENTS} />
}
