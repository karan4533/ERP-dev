import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { RotateCcw } from 'lucide-react'
import {
    ACADEMIC_YEARS,
    BOOKS_CLOSURE_TOGGLES,
    CURRENCIES,
    DATE_FORMATS,
    FINANCIAL_YEAR_STARTS,
    GENERAL_SETTINGS,
    NUMBER_FORMATS,
    TERM_STRUCTURES,
} from '../settingsData'
import {
    FormField,
    FormGrid,
    SettingRow,
    SettingsPanel,
    fieldClass,
} from './SettingsShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatDisplayDateTime } from '../../financeDomain/financeHelpers'

const RESET_CONFIRMATION = 'This will remove all locally saved Finance demo transactions, receipts, cheque updates and manual changes. Continue?'

const GeneralTab = () => {
    const [general, setGeneral] = useState(GENERAL_SETTINGS)
    const [booksClosure, setBooksClosure] = useState(BOOKS_CLOSURE_TOGGLES)
    const { resetFinanceDemoData, financePersistence } = useFinance()

    const updateGeneral = (key, value) => {
        setGeneral((prev) => ({ ...prev, [key]: value }))
    }

    const toggleBooksClosure = (id) => {
        setBooksClosure((prev) =>
            prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
        )
    }

    const handleResetDemoData = () => {
        if (!window.confirm(RESET_CONFIRMATION)) return
        resetFinanceDemoData()
        toast.success('Finance demo data has been restored to the original seed.')
    }

    return (
        <div className='space-y-6'>
            <SettingsPanel title='Institution & financial year'>
                <FormGrid>
                    <FormField label='School / Institution Name'>
                        <input
                            type='text'
                            value={general.institutionName}
                            onChange={(event) => updateGeneral('institutionName', event.target.value)}
                            className={fieldClass}
                        />
                    </FormField>
                    <FormField label='GSTIN'>
                        <input
                            type='text'
                            value={general.gstin}
                            onChange={(event) => updateGeneral('gstin', event.target.value)}
                            className={fieldClass}
                        />
                    </FormField>
                    <FormField label='Current Academic Year'>
                        <select
                            value={general.academicYear}
                            onChange={(event) => updateGeneral('academicYear', event.target.value)}
                            className={fieldClass}
                        >
                            {ACADEMIC_YEARS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Financial Year Start Month'>
                        <select
                            value={general.financialYearStart}
                            onChange={(event) => updateGeneral('financialYearStart', event.target.value)}
                            className={fieldClass}
                        >
                            {FINANCIAL_YEAR_STARTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                </FormGrid>
            </SettingsPanel>

            <SettingsPanel title='Currency & formatting'>
                <FormGrid>
                    <FormField label='Currency'>
                        <select
                            value={general.currency}
                            onChange={(event) => updateGeneral('currency', event.target.value)}
                            className={fieldClass}
                        >
                            {CURRENCIES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Number Format'>
                        <select
                            value={general.numberFormat}
                            onChange={(event) => updateGeneral('numberFormat', event.target.value)}
                            className={fieldClass}
                        >
                            {NUMBER_FORMATS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Date Format'>
                        <select
                            value={general.dateFormat}
                            onChange={(event) => updateGeneral('dateFormat', event.target.value)}
                            className={fieldClass}
                        >
                            {DATE_FORMATS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Default Term Structure'>
                        <select
                            value={general.termStructure}
                            onChange={(event) => updateGeneral('termStructure', event.target.value)}
                            className={fieldClass}
                        >
                            {TERM_STRUCTURES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                </FormGrid>
            </SettingsPanel>

            <SettingsPanel title='Books closure'>
                {booksClosure.map((item) => (
                    <SettingRow
                        key={item.id}
                        label={item.label}
                        sub={item.sub}
                        enabled={item.enabled}
                        onChange={() => toggleBooksClosure(item.id)}
                    />
                ))}
            </SettingsPanel>

            <SettingsPanel
                title='Demo data'
                sub='Frontend demo persistence — localStorage. Not suitable for production financial data.'
            >
                <div className='space-y-3 text-sm text-[#667085]'>
                    <p>Local demo persistence: <span className='font-medium text-[#1E1E1E]'>Enabled</span></p>
                    <p>Storage key: <span className='font-mono text-xs text-[#1E1E1E]'>{financePersistence?.storageKey}</span></p>
                    <p>
                        Last saved:{' '}
                        <span className='text-[#1E1E1E]'>
                            {financePersistence?.lastSavedAt
                                ? formatDisplayDateTime(financePersistence.lastSavedAt)
                                : 'Not saved yet'}
                        </span>
                    </p>
                    <p className='text-xs'>
                        Clearing site data, using another browser, or another device removes this demo state.
                        Real production data must live in a Finance API and database.
                    </p>
                    <button
                        type='button'
                        onClick={handleResetDemoData}
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#FF5722] border border-[#FF5722] px-4 py-2 rounded-md hover:bg-[#FF5722] hover:text-white transition-colors cursor-pointer'
                    >
                        <RotateCcw size={16} />
                        Reset Finance Demo Data
                    </button>
                </div>
            </SettingsPanel>
        </div>
    )
}

export default GeneralTab
