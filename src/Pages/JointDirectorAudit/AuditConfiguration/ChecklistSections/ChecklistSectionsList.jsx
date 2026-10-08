import React, { useMemo, useState } from 'react'
import {
    ChevronDown,
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
import ChecklistSectionFormModal from './ChecklistSectionFormModal'
import {
    CHECKLIST_SECTIONS,
    SECTION_STATUS_OPTIONS,
    TEMPLATE_OPTIONS,
    createSectionId,
    getSectionStatus,
    getTemplateName,
    sectionStatusBadgeColor,
} from './checklistSectionsData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const ChecklistSectionsList = () => {
    const [sections, setSections] = useState(CHECKLIST_SECTIONS)
    const [search, setSearch] = useState('')
    const [templateFilter, setTemplateFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [formModal, setFormModal] = useState({ open: false, mode: 'create', section: null, sectionId: null })

    const filteredSections = useMemo(() => sections
        .filter((section) => {
            const searchValue = search.trim().toLowerCase()
            const matchesSearch = !searchValue
                || section.id.toLowerCase().includes(searchValue)
                || section.sectionName.toLowerCase().includes(searchValue)
            const matchesTemplate = !templateFilter || section.templateId === templateFilter
            const sectionStatus = getSectionStatus(section.active)
            const matchesStatus = !statusFilter || sectionStatus === statusFilter

            return matchesSearch && matchesTemplate && matchesStatus
        })
        .sort((a, b) => {
            if (a.templateName !== b.templateName) {
                return a.templateName.localeCompare(b.templateName)
            }
            return a.displayOrder - b.displayOrder
        }), [sections, search, templateFilter, statusFilter])

    const hierarchySections = useMemo(() => {
        if (!templateFilter) return []
        return sections
            .filter((section) => section.templateId === templateFilter)
            .sort((a, b) => a.displayOrder - b.displayOrder)
    }, [sections, templateFilter])

    const selectedTemplateName = templateFilter ? getTemplateName(templateFilter) : ''

    const clearFilters = () => {
        setSearch('')
        setTemplateFilter('')
        setStatusFilter('')
    }

    const openCreateModal = () => {
        setFormModal({
            open: true,
            mode: 'create',
            section: {
                templateId: templateFilter || '',
                sectionName: '',
                description: '',
                displayOrder: String(hierarchySections.length + 1 || 1),
                active: true,
            },
            sectionId: null,
        })
    }

    const openEditModal = (section) => {
        setFormModal({
            open: true,
            mode: 'edit',
            sectionId: section.id,
            section: {
                templateId: section.templateId,
                sectionName: section.sectionName,
                description: section.description,
                displayOrder: String(section.displayOrder),
                active: section.active,
            },
        })
    }

    const openViewModal = (section) => {
        setFormModal({
            open: true,
            mode: 'view',
            sectionId: section.id,
            section: {
                templateId: section.templateId,
                sectionName: section.sectionName,
                description: section.description,
                displayOrder: String(section.displayOrder),
                active: section.active,
            },
        })
    }

    const closeFormModal = () => {
        setFormModal({ open: false, mode: 'create', section: null, sectionId: null })
    }

    const handleSave = (formData) => {
        const payload = {
            templateId: formData.templateId,
            templateName: getTemplateName(formData.templateId),
            sectionName: formData.sectionName,
            description: formData.description,
            displayOrder: Number(formData.displayOrder) || 1,
            active: formData.active,
        }

        if (formModal.mode === 'edit' && formModal.sectionId) {
            setSections((prev) => prev.map((section) => (
                section.id === formModal.sectionId
                    ? { ...section, ...payload }
                    : section
            )))
        } else {
            setSections((prev) => [
                {
                    id: createSectionId(prev),
                    questions: 0,
                    ...payload,
                },
                ...prev,
            ])
        }

        closeFormModal()
    }

    const toggleActive = (sectionId) => {
        setSections((prev) => prev.map((section) => (
            section.id === sectionId
                ? { ...section, active: !section.active }
                : section
        )))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Organize audit templates into checklist sections such as Classroom, Laboratory, Safety, and Documentation.
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
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='section-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Section ID, name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-template-filter' className='text-base font-medium text-[#808080]'>Template</label>
                        <select
                            id='section-template-filter'
                            value={templateFilter}
                            onChange={(event) => setTemplateFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Templates</option>
                            {TEMPLATE_OPTIONS.map((template) => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='section-status-filter'
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SECTION_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {templateFilter && hierarchySections.length > 0 && (
                <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                    <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Section Hierarchy</h3>
                    <div className='flex flex-col items-start gap-2'>
                        <div className='inline-flex items-center gap-2 rounded-lg bg-[#515DEF1A] text-[#515DEF] px-3 py-2 text-sm font-semibold'>
                            {selectedTemplateName}
                        </div>
                        <ChevronDown size={16} className='text-[#808080] ml-4' />
                        <div className='flex flex-col gap-2 ml-4 border-l-2 border-[#EDEEF5] pl-4'>
                            {hierarchySections.map((section) => (
                                <div
                                    key={section.id}
                                    className='inline-flex items-center gap-2 rounded-md border border-[#EDEEF5] bg-[#FAFAFA] px-3 py-2 text-sm text-[#1E1E1E]'
                                >
                                    <span className='text-xs font-semibold text-[#515DEF]'>{section.displayOrder}.</span>
                                    {section.sectionName}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Checklist Sections</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={openCreateModal}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Section
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
                                <th className={`${thClass} rounded-s-lg`}>Section ID</th>
                                <th className={thClass}>Template</th>
                                <th className={thClass}>Section Name</th>
                                <th className={thClass}>Display Order</th>
                                <th className={thClass}>Questions</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSections.map((section) => {
                                const status = getSectionStatus(section.active)
                                return (
                                    <tr key={section.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{section.id}</td>
                                        <td className={`${tdClass} max-w-[180px] truncate`} title={section.templateName}>{section.templateName}</td>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{section.sectionName}</td>
                                        <td className={tdClass}>{section.displayOrder}</td>
                                        <td className={tdClass}>{section.questions}</td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${sectionStatusBadgeColor[status]}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} text-center rounded-e-lg`}>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => openViewModal(section)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => openEditModal(section)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => toggleActive(section.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    {section.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredSections.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No checklist sections match the selected filters.</p>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredSections.length} of {filteredSections.length} entries
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
            <ChecklistSectionFormModal
                isOpen={formModal.open}
                mode={formModal.mode}
                initialData={formModal.section}
                onClose={closeFormModal}
                onSave={handleSave}
            />
        </section>
    )
}

export default ChecklistSectionsList
