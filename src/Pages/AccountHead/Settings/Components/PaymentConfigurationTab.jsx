import React, { useState } from 'react'
import {
    GST_APPLICABILITY_OPTIONS,
    LATE_FEE_SETTINGS,
    LATE_FEE_TYPES,
    PAYMENT_MODES,
    REMINDER_FREQUENCIES,
    TAX_SETTINGS,
    TDS_OPTIONS,
} from '../settingsData'
import {
    FormField,
    FormGrid,
    SettingRow,
    SettingsPanel,
    fieldClass,
} from './SettingsShared'

const PaymentConfigurationTab = () => {
    const [paymentModes, setPaymentModes] = useState(PAYMENT_MODES)
    const [lateFee, setLateFee] = useState(LATE_FEE_SETTINGS)
    const [tax, setTax] = useState(TAX_SETTINGS)

    const togglePaymentMode = (id) => {
        setPaymentModes((prev) =>
            prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
        )
    }

    const updateLateFee = (key, value) => {
        setLateFee((prev) => ({ ...prev, [key]: value }))
    }

    const updateTax = (key, value) => {
        setTax((prev) => ({ ...prev, [key]: value }))
    }

    return (
        <div className='space-y-6'>
            <SettingsPanel title='Accepted payment modes'>
                {paymentModes.map((item) => (
                    <SettingRow
                        key={item.id}
                        label={item.label}
                        sub={item.sub}
                        enabled={item.enabled}
                        onChange={() => togglePaymentMode(item.id)}
                    />
                ))}
            </SettingsPanel>

            <SettingsPanel title='Late fee & reminder rules'>
                <FormGrid>
                    <FormField label='Late Fee Type'>
                        <select
                            value={lateFee.lateFeeType}
                            onChange={(event) => updateLateFee('lateFeeType', event.target.value)}
                            className={fieldClass}
                        >
                            {LATE_FEE_TYPES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Late Fee Value'>
                        <input
                            type='text'
                            value={lateFee.lateFeeValue}
                            onChange={(event) => updateLateFee('lateFeeValue', event.target.value)}
                            className={fieldClass}
                        />
                    </FormField>
                    <FormField label='Grace Period'>
                        <input
                            type='text'
                            value={lateFee.gracePeriod}
                            onChange={(event) => updateLateFee('gracePeriod', event.target.value)}
                            className={fieldClass}
                        />
                    </FormField>
                    <FormField label='Auto-reminder Frequency'>
                        <select
                            value={lateFee.reminderFrequency}
                            onChange={(event) => updateLateFee('reminderFrequency', event.target.value)}
                            className={fieldClass}
                        >
                            {REMINDER_FREQUENCIES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                </FormGrid>
            </SettingsPanel>

            <SettingsPanel title='Tax configuration'>
                <FormGrid>
                    <FormField label='GST/HSN Applicability'>
                        <select
                            value={tax.gstApplicability}
                            onChange={(event) => updateTax('gstApplicability', event.target.value)}
                            className={fieldClass}
                        >
                            {GST_APPLICABILITY_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='TDS on Vendor Payments'>
                        <select
                            value={tax.tdsOnVendor}
                            onChange={(event) => updateTax('tdsOnVendor', event.target.value)}
                            className={fieldClass}
                        >
                            {TDS_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                </FormGrid>
            </SettingsPanel>
        </div>
    )
}

export default PaymentConfigurationTab
