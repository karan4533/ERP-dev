import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import NotificationsListView from '../../../Common/Notifications/NotificationsListView'
import { getNotifications, NOTIFICATION_TYPES, typeBadgeColor } from './notificationsData'

const Notifications = () => {
    const location = useLocation()
    const [records, setRecords] = useState(() => getNotifications())

    useEffect(() => {
        setRecords(getNotifications())
    }, [location.pathname])

    const notifications = useMemo(
        () => records.map((record) => ({
            ...record,
            isRead: record.isRead ?? true,
        })),
        [records],
    )

    return (
        <NotificationsListView
            notifications={notifications}
            notificationTypes={NOTIFICATION_TYPES}
            typeBadgeColor={typeBadgeColor}
        />
    )
}

export default Notifications
