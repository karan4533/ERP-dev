import React, { useMemo, useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    Download,
    EllipsisIcon,
    Eye,
    GitCompare,
    RotateCcw,
} from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import TemplateVersionCompareModal from './TemplateVersionCompareModal'
import TemplateVersionViewModal from './TemplateVersionViewModal'
import {
    TEMPLATE_FILTER_OPTIONS,
    TEMPLATE_VERSIONS,
    VERSION_STATUS_OPTIONS,
    formatPublishedDate,
    versionStatusBadgeColor,
} from './templateVersioningData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const formatToday = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}-${month}-${year}`
}

const TemplateVersioningList = () => {
    const [versions, setVersions] = useState(TEMPLATE_VERSIONS)
    const [search, setSearch] = useState('')
    const [templateFilter, setTemplateFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [viewModal, setViewModal] = useState({ open: false, version: null })
    const [compareModal, setCompareModal] = useState({ open: false, version: null })

    const filteredVersions = useMemo(() => versions
        .filter((item) => {
            const searchValue = search.trim().toLowerCase()
            const matchesSearch = !searchValue
                || item.version.toLowerCase().includes(searchValue)
                || item.templateName.toLowerCase().includes(searchValue)
                || item.createdBy.toLowerCase().includes(searchValue)
            const matchesTemplate = !templateFilter || item.templateId === templateFilter
            const matchesStatus = !statusFilter || item.status === statusFilter

            return matchesSearch && matchesTemplate && matchesStatus
        })
        .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate) || b.version.localeCompare(a.version)),
    [versions, search, templateFilter, statusFilter])

    const clearFilters = () => {
        setSearch('')
        setTemplateFilter('')
        setStatusFilter('')
    }

    const handleRestore = (versionId) => {
        const target = versions.find((item) => item.id === versionId)
        if (!target || target.isCurrent) return

        setVersions((prev) => prev.map((item) => {
            if (item.templateId !== target.templateId) return item

            if (item.id === versionId) {
                return {
                    ...item,
                    status: 'Restored',
                    isCurrent: true,
                    publishedDate: formatToday(),
                }
            }

            return {
                ...item,
                isCurrent: false,
                status: item.isCurrent ? 'Superseded' : item.status,
            }
        }))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Track audit template versions, compare changes over time, and restore previous published versions when needed.
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
                        <label htmlFor='version-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='version-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Version, template, author...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='version-template-filter' className='text-base font-medium text-[#808080]'>Template</label>
                        <select
                            id='version-template-filter'
                            value={templateFilter}
                            onChange={(event) => setTemplateFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Templates</option>
                            {TEMPLATE_FILTER_OPTIONS.map((template) => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='version-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='version-status-filter'
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {VERSION_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Template Versioning</h2>
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
                                <th className={`${thClass} rounded-s-lg`}>Version</th>
                                <th className={thClass}>Template</th>
                                <th className={thClass}>Created By</th>
                                <th className={thClass}>Published Date</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVersions.map((item) => (
                                <tr key={item.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <p className='font-semibold text-[#515DEF]'>{item.version}</p>
                                        {item.isCurrent && (
                                            <span className='text-[10px] font-semibold text-[#4CAF50]'>Current</span>
                                        )}
                                    </td>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] max-w-[220px] truncate`} title={item.templateName}>
                                        {item.templateName}
                                    </td>
                                    <td className={tdClass}>{item.createdBy}</td>
                                    <td className={`${tdClass} whitespace-nowrap`}>{formatPublishedDate(item.publishedDate)}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${versionStatusBadgeColor[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} text-center rounded-e-lg`}>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <button
                                                type='button'
                                                onClick={() => setViewModal({ open: true, version: item })}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setCompareModal({ open: true, version: item })}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                            >
                                                <GitCompare size={14} />
                                                Compare
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleRestore(item.id)}
                                                disabled={item.isCurrent}
                                                className={`w-full text-left p-2 rounded flex items-center gap-2 ${
                                                    item.isCurrent
                                                        ? 'text-[#B0B0B0] cursor-not-allowed'
                                                        : 'hover:bg-[#515DEF] hover:text-white cursor-pointer'
                                                }`}
                                            >
                                                <RotateCcw size={14} />
                                                Restore
                                            </button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredVersions.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No template versions match the selected filters.</p>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredVersions.length} of {filteredVersions.length} entries
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
            <TemplateVersionViewModal
                isOpen={viewModal.open}
                version={viewModal.version}
                onClose={() => setViewModal({ open: false, version: null })}
            />
            <TemplateVersionCompareModal
                isOpen={compareModal.open}
                baseVersion={compareModal.version}
                versions={versions}
                onClose={() => setCompareModal({ open: false, version: null })}
            />
        </section>
    )
}

export default TemplateVersioningList
