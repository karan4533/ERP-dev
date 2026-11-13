import React from 'react'
import NotificationsListView from '../../../Common/Notifications/NotificationsListView'
import {
    NOTIFICATION_TYPES,
    STUDENT_NOTIFICATIONS,
    typeBadgeColor,
} from './notificationsData'

const NotificationsList = () => (
    <NotificationsListView
        notifications={STUDENT_NOTIFICATIONS}
        notificationTypes={NOTIFICATION_TYPES}
        typeBadgeColor={typeBadgeColor}
    />
)

export default NotificationsList
