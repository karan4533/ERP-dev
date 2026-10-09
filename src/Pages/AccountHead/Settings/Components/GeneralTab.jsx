import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Percent, RefreshCw } from 'lucide-react'
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

const GeneralTab = () => {
    const [general, setGeneral] = useState(GENERAL_SETTINGS)
    const [booksClosure, setBooksClosure] = useState(BOOKS_CLOSURE_TOGGLES)
    const { financePersistence, applyHrConcessions, reloadFinanceFromApi, financeStatus, financeError } = useFinance()
    const [applyingConcessions, setApplyingConcessions] = useState(false)
    const [reloading, setReloading] = useState(false)

    const updateGeneral = (key, value) => {
        setGeneral((prev) => ({ ...prev, [key]: value }))
    }

    const toggleBooksClosure = (id) => {
        setBooksClosure((prev) =>
            prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
        )
    }

    const handleApplyHrConcessions = async () => {
        setApplyingConcessions(true)
        try {
            const result = await applyHrConcessions()
            if (!result?.success) {
                toast.error(result?.message || 'Could not apply HR concessions.')
                return
            }
            toast.success(`Applied ${result.applied ?? 0} staff-child concession(s) to fee installments.`)
        } finally {
            setApplyingConcessions(false)
        }
    }

    const handleReloadFromApi = async () => {
        setReloading(true)
        try {
            await reloadFinanceFromApi()
            toast.success('Finance snapshot reloaded from API.')
        } catch (error) {
            toast.error(error?.message || 'Finance API reload failed.')
        } finally {
            setReloading(false)
        }
    }

    return (
        <div className='space-y-6'>
            <SettingsPanel title='Institution & financial year'>
                <FormGrid>
                    <FormField label='Institution name'>
                        <input
                            className={fieldClass}
                            value={general.institutionName}
                            onChange={(event) => updateGeneral('institutionName', event.target.value)}
                        />
                    </FormField>
                    <FormField label='Academic year'>
                        <select
                            className={fieldClass}
                            value={general.academicYear}
                            onChange={(event) => updateGeneral('academicYear', event.target.value)}
                        >
                            {ACADEMIC_YEARS.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Financial year starts'>
                        <select
                            className={fieldClass}
                            value={general.financialYearStart}
                            onChange={(event) => updateGeneral('financialYearStart', event.target.value)}
                        >
                            {FINANCIAL_YEAR_STARTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Term structure'>
                        <select
                            className={fieldClass}
                            value={general.termStructure}
                            onChange={(event) => updateGeneral('termStructure', event.target.value)}
                        >
                            {TERM_STRUCTURES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Currency'>
                        <select
                            className={fieldClass}
                            value={general.currency}
                            onChange={(event) => updateGeneral('currency', event.target.value)}
                        >
                            {CURRENCIES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Date format'>
                        <select
                            className={fieldClass}
                            value={general.dateFormat}
                            onChange={(event) => updateGeneral('dateFormat', event.target.value)}
                        >
                            {DATE_FORMATS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label='Number format'>
                        <select
                            className={fieldClass}
                            value={general.numberFormat}
                            onChange={(event) => updateGeneral('numberFormat', event.target.value)}
                        >
                            {NUMBER_FORMATS.map((item) => (
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
                title='HR staff-child concessions'
                sub='Pull approved HR concessions onto matching finance fee installments (API).'
            >
                <button
                    type='button'
                    disabled={applyingConcessions}
                    onClick={handleApplyHrConcessions}
                    className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer disabled:opacity-60'
                >
                    <Percent size={16} />
                    {applyingConcessions ? 'Applying…' : 'Apply HR concessions to fees'}
                </button>
            </SettingsPanel>

            <SettingsPanel
                title='Finance API source of truth'
                sub='Collections, receipts, and books live on the server. Browser storage is cache only and is ignored on load when the API flag is on.'
            >
                <div className='space-y-3 text-sm text-[#667085]'>
                    <p>
                        Status:{' '}
                        <span className='font-medium text-[#1E1E1E]'>{financeStatus}</span>
                        {financeError ? ` — ${financeError}` : ''}
                    </p>
                    <p>
                        Mode:{' '}
                        <span className='font-medium text-[#1E1E1E]'>
                            {financePersistence?.mode || (financePersistence?.apiEnabled ? 'api' : 'offline')}
                        </span>
                    </p>
                    <p>
                        Last API save:{' '}
                        <span className='text-[#1E1E1E]'>
                            {financePersistence?.lastSavedAt
                                ? formatDisplayDateTime(financePersistence.lastSavedAt)
                                : 'Not saved yet'}
                        </span>
                    </p>
                    <p className='text-xs'>
                        Gateway / WhatsApp / email receipt send remain <code>queued_stub</code> until real provider keys are configured — the UI must not treat stubs as delivered.
                    </p>
                    <button
                        type='button'
                        disabled={reloading}
                        onClick={handleReloadFromApi}
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer disabled:opacity-60'
                    >
                        <RefreshCw size={16} />
                        {reloading ? 'Reloading…' : 'Reload snapshot from API'}
                    </button>
                </div>
            </SettingsPanel>
        </div>
    )
}

export default GeneralTab
