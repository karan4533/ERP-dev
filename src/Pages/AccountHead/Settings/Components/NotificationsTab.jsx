import React, { useState } from 'react'
import { IntegrationNotice } from '../../../../Common/ui'
import { COMMUNICATION_ALERTS, FINANCE_MANAGER_ALERTS } from '../settingsData'
import { SettingRow, SettingsPanel } from './SettingsShared'

const NotificationsTab = () => {
    const [financeAlerts, setFinanceAlerts] = useState(FINANCE_MANAGER_ALERTS)
    const [communicationAlerts, setCommunicationAlerts] = useState(COMMUNICATION_ALERTS)

    const toggleFinanceAlert = (id) => {
        setFinanceAlerts((prev) =>
            prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
        )
    }

    const toggleCommunicationAlert = (id) => {
        setCommunicationAlerts((prev) =>
            prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
        )
    }

    return (
        <div className='space-y-6'>
            <IntegrationNotice state='demo' title='Delivery services disconnected' description='Toggles are local preference previews. Email, SMS and messaging delivery require server-side templates, consent, queues and audit logging.' />
            <SettingsPanel title='Alerts for the Finance Manager'>
                {financeAlerts.map((item) => (
                    <SettingRow
                        key={item.id}
                        label={item.label}
                        sub={item.sub}
                        enabled={item.enabled}
                        onChange={() => toggleFinanceAlert(item.id)}
                    />
                ))}
            </SettingsPanel>

            <SettingsPanel title='Parent / staff communication'>
                {communicationAlerts.map((item) => (
                    <SettingRow
                        key={item.id}
                        label={item.label}
                        sub={item.sub}
                        enabled={item.enabled}
                        onChange={() => toggleCommunicationAlert(item.id)}
                    />
                ))}
            </SettingsPanel>
        </div>
    )
}

export default NotificationsTab
