import React, { useMemo } from 'react'
import NotificationsListView from '../../../Common/Notifications/NotificationsListView'
import { getNotifications, saveNotifications } from '../domain/hrStore'
import { useHrTick } from '../components/HrUi'

const TYPES = ['Training', 'Recruitment', 'Payroll', 'Internal Job', 'Leave', 'Disciplinary', 'Exit', 'Onboarding']

const badge = {
    Training: 'bg-[#4CAF5033] text-[#4CAF50]',
    Recruitment: 'bg-[#2196F333] text-[#2196F3]',
    Payroll: 'bg-[#FF980033] text-[#FF9800]',
    'Internal Job': 'bg-[#515DEF33] text-[#515DEF]',
    Leave: 'bg-[#9C27B033] text-[#9C27B0]',
    Disciplinary: 'bg-[#FF000033] text-[#FF0000]',
    Exit: 'bg-[#66708533] text-[#667085]',
    Onboarding: 'bg-[#2196F333] text-[#2196F3]',
}

const Notifications = () => {
    const tick = useHrTick()
    const notifications = useMemo(() => getNotifications().map((item) => ({ ...item, meta: item.type })), [tick])
    return (
        <div onClick={(event) => {
            const card = event.target.closest('[data-notification-id]')
            if (!card) return
            const id = card.getAttribute('data-notification-id')
            if (!id) return
            saveNotifications(getNotifications().map((item) => item.id === id ? { ...item, isRead: true } : item))
        }}>
            <NotificationsListView notifications={notifications} notificationTypes={TYPES} typeBadgeColor={badge} title='HR Notifications' />
        </div>
    )
}

export default Notifications
