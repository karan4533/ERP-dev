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
import WorkflowBuilder from './WorkflowBuilder'
import WorkflowRuleFormModal from './WorkflowRuleFormModal'
import {
    WORKFLOW_DEPARTMENTS,
    WORKFLOW_RULES,
    WORKFLOW_STATUS_OPTIONS,
    buildWorkflowPayload,
    createWorkflowId,
    formatStepsSummary,
    getActiveSteps,
    getWorkflowStatus,
    toWorkflowForm,
    workflowStatusBadgeColor,
} from './workflowRulesData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const WorkflowRulesList = () => {
    const [workflows, setWorkflows] = useState(WORKFLOW_RULES)
    const [search, setSearch] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [selectedWorkflowId, setSelectedWorkflowId] = useState(WORKFLOW_RULES[0]?.id ?? '')
    const [exportModal, setExportModal] = useState(false)
    const [formModal, setFormModal] = useState({ open: false, mode: 'create', workflow: null, workflowId: null })

    const filteredWorkflows = useMemo(() => workflows.filter((workflow) => {
        const searchValue = search.trim().toLowerCase()
        const matchesSearch = !searchValue
            || workflow.workflowName.toLowerCase().includes(searchValue)
            || workflow.department.toLowerCase().includes(searchValue)
        const matchesDepartment = !departmentFilter || workflow.department === departmentFilter
        const workflowStatus = getWorkflowStatus(workflow.active)
        const matchesStatus = !statusFilter || workflowStatus === statusFilter

        return matchesSearch && matchesDepartment && matchesStatus
    }), [workflows, search, departmentFilter, statusFilter])

    const selectedWorkflow = useMemo(
        () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? filteredWorkflows[0] ?? null,
        [workflows, selectedWorkflowId, filteredWorkflows]
    )

    const clearFilters = () => {
        setSearch('')
        setDepartmentFilter('')
        setStatusFilter('')
    }

    const openCreateModal = () => {
        setFormModal({ open: true, mode: 'create', workflow: null, workflowId: null })
    }

    const openEditModal = (workflow) => {
        setFormModal({
            open: true,
            mode: 'edit',
            workflowId: workflow.id,
            workflow: toWorkflowForm(workflow),
        })
    }

    const openViewModal = (workflow) => {
        setFormModal({
            open: true,
            mode: 'view',
            workflowId: workflow.id,
            workflow: toWorkflowForm(workflow),
        })
    }

    const closeFormModal = () => {
        setFormModal({ open: false, mode: 'create', workflow: null, workflowId: null })
    }

    const handleSave = (formData) => {
        const payload = buildWorkflowPayload(formData)

        if (formModal.mode === 'edit' && formModal.workflowId) {
            setWorkflows((prev) => prev.map((workflow) => (
                workflow.id === formModal.workflowId
                    ? { ...workflow, ...payload }
                    : workflow
            )))
        } else {
            const newId = createWorkflowId(workflows)
            setWorkflows((prev) => [
                {
                    id: newId,
                    ...payload,
                },
                ...prev,
            ])
            setSelectedWorkflowId(newId)
        }

        closeFormModal()
    }

    const toggleActive = (workflowId) => {
        setWorkflows((prev) => prev.map((workflow) => (
            workflow.id === workflowId
                ? { ...workflow, active: !workflow.active }
                : workflow
        )))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Configure audit approval workflows from Process Auditor through to JD Audit visibility.
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
                        <label htmlFor='workflow-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='workflow-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Workflow name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='workflow-department-filter' className='text-base font-medium text-[#808080]'>Department</label>
                        <select
                            id='workflow-department-filter'
                            value={departmentFilter}
                            onChange={(event) => setDepartmentFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {WORKFLOW_DEPARTMENTS.map((department) => (
                                <option key={department} value={department}>{department}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='workflow-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='workflow-status-filter'
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {WORKFLOW_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Workflow Builder</h3>
                    <select
                        value={selectedWorkflow?.id ?? ''}
                        onChange={(event) => setSelectedWorkflowId(event.target.value)}
                        className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[220px] bg-white'
                    >
                        {filteredWorkflows.map((workflow) => (
                            <option key={workflow.id} value={workflow.id}>{workflow.workflowName}</option>
                        ))}
                    </select>
                </div>
                {selectedWorkflow ? (
                    <WorkflowBuilder
                        title={selectedWorkflow.workflowName}
                        steps={selectedWorkflow.steps}
                    />
                ) : (
                    <p className='text-sm text-[#667085]'>Select a workflow to preview its approval chain.</p>
                )}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Workflow Rules</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={openCreateModal}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Workflow
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
                                <th className={`${thClass} rounded-s-lg`}>Workflow</th>
                                <th className={thClass}>Department</th>
                                <th className={thClass}>Steps</th>
                                <th className={thClass}>Active</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWorkflows.map((workflow) => {
                                const status = getWorkflowStatus(workflow.active)
                                const activeSteps = getActiveSteps(workflow.steps)
                                return (
                                    <tr
                                        key={workflow.id}
                                        className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] cursor-pointer'
                                        onClick={() => setSelectedWorkflowId(workflow.id)}
                                    >
                                        <td className={`${tdClass} rounded-s-lg`}>
                                            <p className='font-medium text-[#1E1E1E]'>{workflow.workflowName}</p>
                                            <p className='text-xs text-[#808080] mt-0.5 truncate max-w-[240px]' title={activeSteps.join(' → ')}>
                                                {activeSteps.join(' → ')}
                                            </p>
                                        </td>
                                        <td className={tdClass}>{workflow.department}</td>
                                        <td className={tdClass}>
                                            <span className='text-xs font-semibold px-2 py-1 rounded bg-[#515DEF1A] text-[#515DEF]'>
                                                {formatStepsSummary(workflow.steps)}
                                            </span>
                                        </td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${workflowStatusBadgeColor[status]}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} text-center rounded-e-lg`} onClick={(event) => event.stopPropagation()}>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => openViewModal(workflow)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => openEditModal(workflow)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => toggleActive(workflow.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    {workflow.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredWorkflows.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No workflow rules match the selected filters.</p>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredWorkflows.length} of {filteredWorkflows.length} entries
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
            <WorkflowRuleFormModal
                isOpen={formModal.open}
                mode={formModal.mode}
                initialData={formModal.workflow}
                onClose={closeFormModal}
                onSave={handleSave}
            />
        </section>
    )
}

export default WorkflowRulesList
