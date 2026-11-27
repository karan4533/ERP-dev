import StaffNotificationsPage from '../../../Common/Notifications/StaffNotificationsPage'
import {
    STAFF_NOTIFICATIONS,
    STAFF_NOTIFICATION_TYPES,
    staffTypeBadgeColor,
} from '../../../Common/Notifications/staffNotificationsData'

const Notifications = () => (
    <StaffNotificationsPage
        fallback={STAFF_NOTIFICATIONS}
        notificationTypes={STAFF_NOTIFICATION_TYPES}
        typeBadgeColor={staffTypeBadgeColor}
        title="Gate Keeper Manager Notifications"
    />
)

export default Notifications
