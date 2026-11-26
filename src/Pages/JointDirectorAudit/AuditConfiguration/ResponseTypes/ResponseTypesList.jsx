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
import ResponseTypeFormModal from './ResponseTypeFormModal'
import {
    RESPONSE_TYPES_LIST,
    RESPONSE_TYPE_STATUS_OPTIONS,
    createResponseTypeId,
    getResponseTypeStatus,
    responseTypeStatusBadgeColor,
} from './responseTypesData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const ResponseTypesList = () => {
    const [responseTypes, setResponseTypes] = useState(RESPONSE_TYPES_LIST)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [formModal, setFormModal] = useState({ open: false, mode: 'create', item: null, itemId: null })

    const filteredTypes = useMemo(() => responseTypes.filter((item) => {
        const searchValue = search.trim().toLowerCase()
        const matchesSearch = !searchValue
            || item.type.toLowerCase().includes(searchValue)
            || item.description.toLowerCase().includes(searchValue)
        const itemStatus = getResponseTypeStatus(item.active)
        const matchesStatus = !statusFilter || itemStatus === statusFilter

        return matchesSearch && matchesStatus
    }), [responseTypes, search, statusFilter])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
    }

    const toFormData = (item) => ({
        type: item.type,
        description: item.description,
        active: item.active,
    })

    const openCreateModal = () => {
        setFormModal({ open: true, mode: 'create', item: null, itemId: null })
    }

    const openEditModal = (item) => {
        setFormModal({
            open: true,
            mode: 'edit',
            itemId: item.id,
            item: toFormData(item),
        })
    }

    const openViewModal = (item) => {
        setFormModal({
            open: true,
            mode: 'view',
            itemId: item.id,
            item: toFormData(item),
        })
    }

    const closeFormModal = () => {
        setFormModal({ open: false, mode: 'create', item: null, itemId: null })
    }

    const handleSave = (formData) => {
        const payload = {
            type: formData.type,
            description: formData.description,
            active: formData.active,
        }

        if (formModal.mode === 'edit' && formModal.itemId) {
            setResponseTypes((prev) => prev.map((item) => (
                item.id === formModal.itemId
                    ? { ...item, ...payload }
                    : item
            )))
        } else {
            setResponseTypes((prev) => [
                {
                    id: createResponseTypeId(prev),
                    ...payload,
                },
                ...prev,
            ])
        }

        closeFormModal()
    }

    const toggleActive = (itemId) => {
        setResponseTypes((prev) => prev.map((item) => (
            item.id === itemId
                ? { ...item, active: !item.active }
                : item
        )))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Configure supported question response formats used across audit templates and the question bank.
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
                        <label htmlFor='response-type-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='response-type-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Type, description...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='response-type-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='response-type-status-filter'
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {RESPONSE_TYPE_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Response Types</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={openCreateModal}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Response Type
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
                                <th className={`${thClass} rounded-s-lg`}>Type</th>
                                <th className={thClass}>Description</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTypes.map((item) => {
                                const status = getResponseTypeStatus(item.active)
                                return (
                                    <tr key={item.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg whitespace-nowrap`}>
                                            {item.type}
                                        </td>
                                        <td className={`${tdClass} max-w-[420px]`} title={item.description}>
                                            {item.description}
                                        </td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${responseTypeStatusBadgeColor[status]}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} text-center rounded-e-lg`}>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => openViewModal(item)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => openEditModal(item)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => toggleActive(item.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    {item.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredTypes.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No response types match the selected filters.</p>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredTypes.length} of {filteredTypes.length} entries
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
            <ResponseTypeFormModal
                isOpen={formModal.open}
                mode={formModal.mode}
                initialData={formModal.item}
                onClose={closeFormModal}
                onSave={handleSave}
            />
        </section>
    )
}

export default ResponseTypesList
