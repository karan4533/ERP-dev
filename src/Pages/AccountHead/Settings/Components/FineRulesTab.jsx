import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Plus } from 'lucide-react'
import { DataTable, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { FINE_TYPE_OPTIONS } from '../../financeDomain/financeConstants'
import { useFinance } from '../../financeDomain/FinanceContext'
import { FormField, FormGrid, SettingsPanel, fieldClass } from './SettingsShared'

const FineRulesTab = () => {
    const { fineRules, setFineRules, feeCategories } = useFinance()
    const [form, setForm] = useState({
        name: '',
        feeCategoryId: feeCategories[0]?.id || '',
        gracePeriod: '5',
        fineType: 'DAILY',
        fineValue: '10',
        maximumFine: '500',
        effectiveFrom: '2026-04-01',
        effectiveTo: '2027-03-31',
        active: true,
    })

    const addRule = () => {
        if (!form.name.trim()) {
            toast.error('Rule name is required.')
            return
        }
        setFineRules((prev) => [{
            id: `FINE-${Date.now()}`,
            ...form,
            gracePeriod: Number(form.gracePeriod),
            fineValue: Number(form.fineValue),
            maximumFine: Number(form.maximumFine),
        }, ...prev])
        toast.success('Fine rule saved.')
    }

    return (
        <div className='space-y-6'>
            <IntegrationNotice state='demo' title='Browser-stored fine rules' description='Rules created here affect local fee demonstrations only. Production enforcement requires versioned server rules, approval, effective-date validation and audit history.' />
            <SettingsPanel title='Add fine rule' sub='Grace period is counted from the instalment due date.'>
                <FormGrid>
                    <FormField label='Rule Name'><input className={fieldClass} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></FormField>
                    <FormField label='Fee Category'>
                        <select className={fieldClass} value={form.feeCategoryId} onChange={(event) => setForm((prev) => ({ ...prev, feeCategoryId: event.target.value }))}>
                            {feeCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label='Grace Period (days)'><input className={fieldClass} value={form.gracePeriod} onChange={(event) => setForm((prev) => ({ ...prev, gracePeriod: event.target.value }))} /></FormField>
                    <FormField label='Fine Type'>
                        <select className={fieldClass} value={form.fineType} onChange={(event) => setForm((prev) => ({ ...prev, fineType: event.target.value }))}>
                            {FINE_TYPE_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                        </select>
                    </FormField>
                    <FormField label='Fine Value'><input className={fieldClass} value={form.fineValue} onChange={(event) => setForm((prev) => ({ ...prev, fineValue: event.target.value }))} /></FormField>
                    <FormField label='Maximum Fine'><input className={fieldClass} value={form.maximumFine} onChange={(event) => setForm((prev) => ({ ...prev, maximumFine: event.target.value }))} /></FormField>
                </FormGrid>
                <button type='button' onClick={addRule} className='mt-4 inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'>
                    <Plus size={16} /> Save Rule
                </button>
            </SettingsPanel>

            <SettingsPanel title='Configured rules'>
                <DataTable
                    caption='Configured fine rules'
                    rows={fineRules}
                    rowKey='id'
                    emptyTitle='No fine rules configured'
                    emptyDescription='Add a local rule above to validate the configuration UI.'
                    columns={[
                        { key: 'name', label: 'Name', required: true },
                        { key: 'fineType', label: 'Type' },
                        { key: 'gracePeriod', label: 'Grace', render: (rule) => `${rule.gracePeriod}d` },
                        { key: 'fineValue', label: 'Value' },
                        { key: 'maximumFine', label: 'Maximum' },
                        { key: 'active', label: 'Status', render: (rule) => <StatusBadge status={rule.active ? 'Active' : 'Inactive'} /> },
                    ]}
                    renderActions={() => <button type='button' disabled title='Editing persisted fine rules requires the finance configuration API.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Edit unavailable</button>}
                />
            </SettingsPanel>
        </div>
    )
}

export default FineRulesTab
