import React, { useMemo, useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    Download,
    EllipsisIcon,
    Eye,
    Pencil,
    Plus,
} from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import ScoringRuleFormModal from './ScoringRuleFormModal'
import {
    SCORING_RULES,
    SCORING_RULE_STATUS_OPTIONS,
    buildScoringRulePayload,
    createScoringRuleId,
    getResponseTypeOptions,
    getScoringRuleStatus,
    getTableNaValue,
    getTableNoValue,
    getTableYesValue,
    scoringRuleStatusBadgeColor,
    toScoringRuleForm,
} from './scoringRulesData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const ScoringRulesList = () => {
    const [rules, setRules] = useState(SCORING_RULES)
    const [search, setSearch] = useState('')
    const [responseTypeFilter, setResponseTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [formModal, setFormModal] = useState({ open: false, mode: 'create', rule: null, ruleId: null })

    const responseTypeOptions = useMemo(() => getResponseTypeOptions(), [])

    const filteredRules = useMemo(() => rules.filter((rule) => {
        const searchValue = search.trim().toLowerCase()
        const matchesSearch = !searchValue || rule.rule.toLowerCase().includes(searchValue)
        const matchesResponseType = !responseTypeFilter || rule.responseTypeId === responseTypeFilter
        const ruleStatus = getScoringRuleStatus(rule.active)
        const matchesStatus = !statusFilter || ruleStatus === statusFilter

        return matchesSearch && matchesResponseType && matchesStatus
    }), [rules, search, responseTypeFilter, statusFilter])

    const clearFilters = () => {
        setSearch('')
        setResponseTypeFilter('')
        setStatusFilter('')
    }

    const openCreateModal = () => {
        setFormModal({ open: true, mode: 'create', rule: null, ruleId: null })
    }

    const openEditModal = (rule) => {
        setFormModal({
            open: true,
            mode: 'edit',
            ruleId: rule.id,
            rule: toScoringRuleForm(rule),
        })
    }

    const openViewModal = (rule) => {
        setFormModal({
            open: true,
            mode: 'view',
            ruleId: rule.id,
            rule: toScoringRuleForm(rule),
        })
    }

    const closeFormModal = () => {
        setFormModal({ open: false, mode: 'create', rule: null, ruleId: null })
    }

    const handleSave = (formData) => {
        const payload = buildScoringRulePayload(formData)

        if (formModal.mode === 'edit' && formModal.ruleId) {
            setRules((prev) => prev.map((rule) => (
                rule.id === formModal.ruleId
                    ? { ...rule, ...payload }
                    : rule
            )))
        } else {
            setRules((prev) => [
                {
                    id: createScoringRuleId(prev),
                    ...payload,
                },
                ...prev,
            ])
        }

        closeFormModal()
    }

    const toggleActive = (ruleId) => {
        setRules((prev) => prev.map((rule) => (
            rule.id === ruleId
                ? { ...rule, active: !rule.active }
                : rule
        )))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Define how audit responses are scored, weighted, and evaluated against pass marks.
                </p>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='scoring-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='scoring-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Rule name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='scoring-response-filter' className='text-base font-medium text-[#808080]'>Response Type</label>
                        <select
                            id='scoring-response-filter'
                            value={responseTypeFilter}
                            onChange={(event) => setResponseTypeFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {responseTypeOptions.map((item) => (
                                <option key={item.id} value={item.id}>{item.type}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='scoring-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='scoring-status-filter'
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SCORING_RULE_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-3'>Example Scoring</h3>
                <div className='max-w-sm rounded-xl border border-[#EDEEF5] overflow-hidden'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='bg-[#EDEEF5]'>
                                <th className='px-4 py-2 text-left text-xs font-semibold uppercase text-[#0C1E5B]'>Rule</th>
                                <th className='px-4 py-2 text-left text-xs font-semibold uppercase text-[#0C1E5B]'>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className='border-b border-[#F2F4F7]'>
                                <td className='px-4 py-2 text-[#1E1E1E]'>Yes</td>
                                <td className='px-4 py-2 font-medium text-[#515DEF]'>10</td>
                            </tr>
                            <tr className='border-b border-[#F2F4F7]'>
                                <td className='px-4 py-2 text-[#1E1E1E]'>No</td>
                                <td className='px-4 py-2 font-medium text-[#515DEF]'>0</td>
                            </tr>
                            <tr>
                                <td className='px-4 py-2 text-[#1E1E1E]'>NA</td>
                                <td className='px-4 py-2 font-medium text-[#667085]'>Ignore</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Scoring Rules</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={openCreateModal}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Scoring Rule
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Rule</th>
                                <th className={thClass}>Yes</th>
                                <th className={thClass}>No</th>
                                <th className={thClass}>NA</th>
                                <th className={thClass}>Weightage</th>
                                <th className={thClass}>Pass Mark</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRules.map((rule) => {
                                const status = getScoringRuleStatus(rule.active)
                                return (
                                    <tr key={rule.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} rounded-s-lg`}>
                                            <p className='font-medium text-[#1E1E1E]'>{rule.rule}</p>
                                            <span className={`mt-1 inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold ${scoringRuleStatusBadgeColor[status]}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{getTableYesValue(rule)}</td>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{getTableNoValue(rule)}</td>
                                        <td className={tdClass}>
                                            <span className={getTableNaValue(rule) === 'Ignore' ? 'text-[#667085] italic' : 'font-medium text-[#1E1E1E]'}>
                                                {getTableNaValue(rule)}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} font-semibold text-[#515DEF]`}>{rule.weightage}</td>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{rule.passPercentage}%</td>
                                        <td className={`${tdClass} text-center rounded-e-lg`}>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => openViewModal(rule)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => openEditModal(rule)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => toggleActive(rule.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    {rule.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredRules.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No scoring rules match the selected filters.</p>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredRules.length} of {filteredRules.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <ScoringRuleFormModal
                isOpen={formModal.open}
                mode={formModal.mode}
                initialData={formModal.rule}
                onClose={closeFormModal}
                onSave={handleSave}
            />
        </section>
    )
}

export default ScoringRulesList
