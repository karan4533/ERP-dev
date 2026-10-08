import React, { useMemo, useState } from 'react'
import {
    Archive,
    ChevronLeft,
    ChevronRight,
    Download,
    EllipsisIcon,
    Rocket,
    RotateCcw,
} from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import {
    PUBLISH_STATUS_OPTIONS,
    PUBLISH_TEMPLATES,
    bumpVersion,
    formatToday,
    publishStatusBadgeColor,
} from './publishTemplatesData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const PublishTemplatesList = () => {
    const [templates, setTemplates] = useState(PUBLISH_TEMPLATES)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)

    const filteredTemplates = useMemo(() => templates.filter((item) => {
        const searchValue = search.trim().toLowerCase()
        const matchesSearch = !searchValue
            || item.templateName.toLowerCase().includes(searchValue)
            || item.department.toLowerCase().includes(searchValue)
        const matchesStatus = !statusFilter || item.status === statusFilter

        return matchesSearch && matchesStatus
    }), [templates, search, statusFilter])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
    }

    const handlePublish = (templateId) => {
        setTemplates((prev) => prev.map((item) => {
            if (item.id !== templateId) return item
            const nextVersion = item.status === 'Draft' ? item.currentVersion : bumpVersion(item.currentVersion)
            return {
                ...item,
                previousVersion: item.currentVersion,
                currentVersion: nextVersion,
                status: 'Published',
                lastPublished: formatToday(),
            }
        }))
    }

    const handleRollback = (templateId) => {
        setTemplates((prev) => prev.map((item) => {
            if (item.id !== templateId || !item.previousVersion) return item
            return {
                ...item,
                currentVersion: item.previousVersion,
                previousVersion: null,
                status: 'Published',
                lastPublished: formatToday(),
            }
        }))
    }

    const handleArchive = (templateId) => {
        setTemplates((prev) => prev.map((item) => (
            item.id === templateId
                ? { ...item, status: 'Archived' }
                : item
        )))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Publish approved audit templates, roll back to previous versions, or archive outdated templates.
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
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='publish-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='publish-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Template name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='publish-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='publish-status-filter'
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {PUBLISH_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Publish Templates</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Template</th>
                                <th className={thClass}>Current Version</th>
                                <th className={thClass}>Status</th>
                                <th className={thClass}>Last Published</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTemplates.map((item) => (
                                <tr key={item.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <p className='font-medium text-[#1E1E1E]'>{item.templateName}</p>
                                        <p className='text-xs text-[#808080] mt-0.5'>{item.department}</p>
                                    </td>
                                    <td className={`${tdClass} font-semibold text-[#515DEF]`}>{item.currentVersion}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${publishStatusBadgeColor[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} whitespace-nowrap`}>{item.lastPublished}</td>
                                    <td className={`${tdClass} text-center rounded-e-lg`}>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <button
                                                type='button'
                                                onClick={() => handlePublish(item.id)}
                                                disabled={item.status === 'Archived'}
                                                className={`w-full text-left p-2 rounded flex items-center gap-2 ${
                                                    item.status === 'Archived'
                                                        ? 'text-[#B0B0B0] cursor-not-allowed'
                                                        : 'hover:bg-[#515DEF] hover:text-white cursor-pointer'
                                                }`}
                                            >
                                                <Rocket size={14} />
                                                Publish
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleRollback(item.id)}
                                                disabled={!item.previousVersion || item.status === 'Archived'}
                                                className={`w-full text-left p-2 rounded flex items-center gap-2 ${
                                                    !item.previousVersion || item.status === 'Archived'
                                                        ? 'text-[#B0B0B0] cursor-not-allowed'
                                                        : 'hover:bg-[#515DEF] hover:text-white cursor-pointer'
                                                }`}
                                            >
                                                <RotateCcw size={14} />
                                                Rollback
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleArchive(item.id)}
                                                disabled={item.status === 'Archived'}
                                                className={`w-full text-left p-2 rounded flex items-center gap-2 ${
                                                    item.status === 'Archived'
                                                        ? 'text-[#B0B0B0] cursor-not-allowed'
                                                        : 'hover:bg-[#515DEF] hover:text-white cursor-pointer'
                                                }`}
                                            >
                                                <Archive size={14} />
                                                Archive
                                            </button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredTemplates.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No templates match the selected filters.</p>
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
        </section>
    )
}

export default PublishTemplatesList
