import React, { useMemo, useState } from 'react'
import {
    Archive,
    ChevronLeft,
    ChevronRight,
    Copy,
    Download,
    EllipsisIcon,
    Eye,
    Pencil,
    Plus,
    Rocket,
} from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import AuditTemplateFormModal from './AuditTemplateFormModal'
import {
    AUDIT_TEMPLATES,
    TEMPLATE_AUDIT_CATEGORIES,
    TEMPLATE_DEPARTMENTS,
    TEMPLATE_STATUS_OPTIONS,
    TEMPLATE_VERSION_OPTIONS,
    createTemplateId,
    formatToday,
    templateStatusBadgeColor,
} from './auditTemplatesData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const AuditTemplatesList = () => {
    const [templates, setTemplates] = useState(AUDIT_TEMPLATES)
    const [search, setSearch] = useState('')
    const [department, setDepartment] = useState('')
    const [auditType, setAuditType] = useState('')
    const [status, setStatus] = useState('')
    const [version, setVersion] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [formModal, setFormModal] = useState({ open: false, mode: 'create', template: null, templateId: null })

    const filteredTemplates = useMemo(() => templates.filter((template) => {
        const searchValue = search.trim().toLowerCase()
        const matchesSearch = !searchValue
            || template.id.toLowerCase().includes(searchValue)
            || template.templateName.toLowerCase().includes(searchValue)
        const matchesDepartment = !department || template.department === department
        const matchesAuditType = !auditType || template.auditCategory === auditType
        const matchesStatus = !status || template.status === status
        const matchesVersion = !version || version === 'All Versions' || template.version === version

        return matchesSearch && matchesDepartment && matchesAuditType && matchesStatus && matchesVersion
    }), [templates, search, department, auditType, status, version])

    const clearFilters = () => {
        setSearch('')
        setDepartment('')
        setAuditType('')
        setStatus('')
        setVersion('')
    }

    const openCreateModal = () => {
        setFormModal({ open: true, mode: 'create', template: null, templateId: null })
    }

    const openEditModal = (template) => {
        setFormModal({
            open: true,
            mode: 'edit',
            templateId: template.id,
            template: {
                templateName: template.templateName,
                department: template.department,
                auditCategory: template.auditCategory,
                description: template.description,
                version: template.version,
                status: template.status === 'Archived' ? 'Draft' : template.status,
            },
        })
    }

    const openViewModal = (template) => {
        setFormModal({
            open: true,
            mode: 'view',
            templateId: template.id,
            template: {
                templateName: template.templateName,
                department: template.department,
                auditCategory: template.auditCategory,
                description: template.description,
                version: template.version,
                status: template.status,
            },
        })
    }

    const closeFormModal = () => {
        setFormModal({ open: false, mode: 'create', template: null, templateId: null })
    }

    const upsertTemplate = (formData, existingId = null) => {
        const today = formatToday()

        if (existingId) {
            setTemplates((prev) => prev.map((template) => (
                template.id === existingId
                    ? {
                        ...template,
                        templateName: formData.templateName,
                        department: formData.department,
                        auditCategory: formData.auditCategory,
                        description: formData.description,
                        status: formData.status,
                        updatedOn: today,
                    }
                    : template
            )))
            return
        }

        setTemplates((prev) => [
            {
                id: createTemplateId(prev),
                templateName: formData.templateName,
                department: formData.department,
                auditCategory: formData.auditCategory,
                description: formData.description,
                version: formData.version,
                sections: 0,
                questions: 0,
                status: formData.status,
                createdBy: 'J. Audit',
                updatedOn: today,
            },
            ...prev,
        ])
    }

    const handleSaveTemplate = (formData) => {
        if (formModal.mode === 'edit' && formModal.templateId) {
            upsertTemplate(formData, formModal.templateId)
        } else {
            upsertTemplate(formData)
        }
        closeFormModal()
    }

    const handlePublish = (formData) => {
        handleSaveTemplate({ ...formData, status: 'Published' })
    }

    const handleDuplicate = (template) => {
        setTemplates((prev) => [
            {
                ...template,
                id: createTemplateId(prev),
                templateName: `${template.templateName} (Copy)`,
                version: 'v1.0',
                status: 'Draft',
                sections: template.sections,
                questions: template.questions,
                createdBy: 'J. Audit',
                updatedOn: formatToday(),
            },
            ...prev,
        ])
    }

    const handlePublishRow = (templateId) => {
        setTemplates((prev) => prev.map((template) => (
            template.id === templateId
                ? { ...template, status: 'Published', updatedOn: formatToday() }
                : template
        )))
    }

    const handleArchive = (templateId) => {
        setTemplates((prev) => prev.map((template) => (
            template.id === templateId
                ? { ...template, status: 'Archived', updatedOn: formatToday() }
                : template
        )))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Create and manage reusable audit templates with sections, questions, and publishing controls.
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
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='template-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='template-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Template ID, name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='template-department-filter' className='text-base font-medium text-[#808080]'>Department</label>
                        <select
                            id='template-department-filter'
                            value={department}
                            onChange={(event) => setDepartment(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {TEMPLATE_DEPARTMENTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='template-audit-type-filter' className='text-base font-medium text-[#808080]'>Audit Type</label>
                        <select
                            id='template-audit-type-filter'
                            value={auditType}
                            onChange={(event) => setAuditType(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {TEMPLATE_AUDIT_CATEGORIES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='template-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='template-status-filter'
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {TEMPLATE_STATUS_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='template-version-filter' className='text-base font-medium text-[#808080]'>Version</label>
                        <select
                            id='template-version-filter'
                            value={version}
                            onChange={(event) => setVersion(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            {TEMPLATE_VERSION_OPTIONS.map((item) => (
                                <option key={item} value={item === 'All Versions' ? '' : item}>{item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Audit Templates</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={openCreateModal}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Template
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
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Template ID</th>
                                <th className={thClass}>Template Name</th>
                                <th className={thClass}>Department</th>
                                <th className={thClass}>Version</th>
                                <th className={thClass}>Sections</th>
                                <th className={thClass}>Questions</th>
                                <th className={thClass}>Status</th>
                                <th className={thClass}>Created By</th>
                                <th className={thClass}>Updated On</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTemplates.map((template) => (
                                <tr key={template.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{template.id}</td>
                                    <td className={`${tdClass} max-w-[200px] truncate font-medium text-[#1E1E1E]`} title={template.templateName}>
                                        {template.templateName}
                                    </td>
                                    <td className={tdClass}>{template.department}</td>
                                    <td className={tdClass}>{template.version}</td>
                                    <td className={tdClass}>{template.sections}</td>
                                    <td className={tdClass}>{template.questions}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${templateStatusBadgeColor[template.status]}`}>
                                            {template.status}
                                        </span>
                                    </td>
                                    <td className={tdClass}>{template.createdBy}</td>
                                    <td className={`${tdClass} whitespace-nowrap`}>{template.updatedOn}</td>
                                    <td className={`${tdClass} text-center rounded-e-lg`}>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <button
                                                type='button'
                                                onClick={() => openViewModal(template)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => openEditModal(template)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleDuplicate(template)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                            >
                                                <Copy size={14} />
                                                Duplicate
                                            </button>
                                            {template.status !== 'Published' && (
                                                <button
                                                    type='button'
                                                    onClick={() => handlePublishRow(template.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Rocket size={14} />
                                                    Publish
                                                </button>
                                            )}
                                            {template.status !== 'Archived' && (
                                                <button
                                                    type='button'
                                                    onClick={() => handleArchive(template.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Archive size={14} />
                                                    Archive
                                                </button>
                                            )}
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredTemplates.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No audit templates match the selected filters.</p>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredTemplates.length} of {filteredTemplates.length} entries
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
            <AuditTemplateFormModal
                isOpen={formModal.open}
                mode={formModal.mode}
                initialData={formModal.template}
                onClose={closeFormModal}
                onSaveDraft={handleSaveTemplate}
                onPublish={handlePublish}
            />
        </section>
    )
}

export default AuditTemplatesList
