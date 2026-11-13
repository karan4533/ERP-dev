import React from 'react'
import NotificationsListView from '../../../Common/Notifications/NotificationsListView'
import { NOTIFICATIONS, NOTIFICATION_TYPES, typeBadgeColor } from './notificationsData'

const Notifications = () => (
    <NotificationsListView
        notifications={NOTIFICATIONS}
        notificationTypes={NOTIFICATION_TYPES}
        typeBadgeColor={typeBadgeColor}
    />
)

export default Notifications
