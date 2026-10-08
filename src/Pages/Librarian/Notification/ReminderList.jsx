import React from 'react'
import NotificationsListView from '../../../Common/Notifications/NotificationsListView'
import { LIBRARIAN_NOTIFICATIONS, NOTIFICATION_TYPES, typeBadgeColor } from './notificationsData'

const ReminderList = () => (
    <NotificationsListView
        notifications={LIBRARIAN_NOTIFICATIONS}
        notificationTypes={NOTIFICATION_TYPES}
        typeBadgeColor={typeBadgeColor}
    />
)

export default ReminderList
