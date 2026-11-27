import StaffNotificationsPage from '../../../Common/Notifications/StaffNotificationsPage'
import { LIBRARIAN_NOTIFICATIONS, NOTIFICATION_TYPES, typeBadgeColor } from './notificationsData'

const ReminderList = () => (
    <StaffNotificationsPage
        fallback={LIBRARIAN_NOTIFICATIONS}
        notificationTypes={NOTIFICATION_TYPES}
        typeBadgeColor={typeBadgeColor}
        title="Librarian Notifications"
    />
)

export default ReminderList
