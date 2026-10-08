import MeetingsCalendar from '../../../../Common/MeetingsCalendar/MeetingsCalendar'
import { buildSeedCalendarEvents } from './auditScheduleData'

const AuditScheduleCalendar = () => (
    <MeetingsCalendar
        seedEvents={buildSeedCalendarEvents()}
        embedded
        title='Audit Schedule'
        showCreateButton={false}
    />
)

export default AuditScheduleCalendar
