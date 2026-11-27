import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import NotificationsListView from '../../../Common/Notifications/NotificationsListView'
import {
    STAFF_NOTIFICATIONS,
    STAFF_NOTIFICATION_TYPES,
    staffTypeBadgeColor,
} from '../../../Common/Notifications/staffNotificationsData'
import {
    canUseNotificationsApi,
    listNotificationsApi,
    markNotificationReadApi,
} from '../../../services/notificationsApi'
import {
    NOTIFICATION_TYPES,
    mapServerNotification,
    typeBadgeColor,
} from '../../Admin/Notification/notificationsData'

const messageFor = (error) =>
    error?.status === 403
        ? 'You do not have permission to view notifications.'
        : error?.message || 'Notifications could not be loaded.'

const Notifications = () => {
    const location = useLocation()
    const api = canUseNotificationsApi()
    const requestKey = api ? location.key : ''
    const [answer, setAnswer] = useState({ key: '', items: [], error: '' })

    useEffect(() => {
        if (!api) return undefined
        let active = true
        listNotificationsApi()
            .then((rows) => {
                if (active) setAnswer({ key: requestKey, items: rows.map(mapServerNotification), error: '' })
            })
            .catch((error) => {
                if (active) setAnswer({ key: requestKey, items: [], error: messageFor(error) })
            })
        return () => {
            active = false
        }
    }, [api, requestKey])

    if (!api) {
        return (
            <NotificationsListView
                notifications={STAFF_NOTIFICATIONS}
                notificationTypes={STAFF_NOTIFICATION_TYPES}
                typeBadgeColor={staffTypeBadgeColor}
            />
        )
    }

    if (answer.key !== requestKey) return <p className='text-[#667085]'>Loading notifications…</p>
    if (answer.error) return <p className='text-[#B42318]'>{answer.error}</p>

    const handleOpen = (record) => {
        if (record.isRead) return
        setAnswer((current) => ({
            ...current,
            items: current.items.map((item) => (item.id === record.id ? { ...item, isRead: true } : item)),
        }))
        markNotificationReadApi(record.id).catch(() => {
            setAnswer((current) => ({
                ...current,
                items: current.items.map((item) => (item.id === record.id ? { ...item, isRead: false } : item)),
            }))
        })
    }

    return (
        <NotificationsListView
            notifications={answer.items}
            notificationTypes={NOTIFICATION_TYPES}
            typeBadgeColor={typeBadgeColor}
            onOpen={handleOpen}
        />
    )
}

export default Notifications
