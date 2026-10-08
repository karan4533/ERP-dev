import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Plus } from 'lucide-react'
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
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='text-xs bg-[#EDEEF5]'>
                            <tr>
                                <th className='px-2 py-3 text-left'>Name</th>
                                <th className='px-2 py-3 text-left'>Type</th>
                                <th className='px-2 py-3 text-left'>Grace</th>
                                <th className='px-2 py-3 text-left'>Value</th>
                                <th className='px-2 py-3 text-left'>Max</th>
                                <th className='px-2 py-3 text-left'>Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fineRules.map((rule) => (
                                <tr key={rule.id} className='border-b border-[#F2F4F7]'>
                                    <td className='px-2 py-3'>{rule.name}</td>
                                    <td className='px-2 py-3'>{rule.fineType}</td>
                                    <td className='px-2 py-3'>{rule.gracePeriod}d</td>
                                    <td className='px-2 py-3'>{rule.fineValue}</td>
                                    <td className='px-2 py-3'>{rule.maximumFine}</td>
                                    <td className='px-2 py-3'>{rule.active ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SettingsPanel>
        </div>
    )
}

export default FineRulesTab
