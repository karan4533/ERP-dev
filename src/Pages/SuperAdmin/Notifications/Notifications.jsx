import React from 'react'
import NotificationsListView from '../../../Common/Notifications/NotificationsListView'
import {
    STAFF_NOTIFICATIONS,
    STAFF_NOTIFICATION_TYPES,
    staffTypeBadgeColor,
} from '../../../Common/Notifications/staffNotificationsData'

const Notifications = () => (
    <NotificationsListView
        notifications={STAFF_NOTIFICATIONS}
        notificationTypes={STAFF_NOTIFICATION_TYPES}
        typeBadgeColor={staffTypeBadgeColor}
    />
)

export default Notifications
