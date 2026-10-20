import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, EllipsisIcon, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import {
    deleteServiceCenter,
    getServiceCenterRows,
    hydrateServiceCentersFromApi,
    SERVICE_CENTER_STATUSES,
} from '../VehicleMaintenance/serviceCentersData'

const statusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Inactive: 'bg-[#F4433633] text-[#F44336]',
}

const ServiceCenters = () => {
    const [rows, setRows] = useState(() => getServiceCenterRows())
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [deleteModal, setDeleteModal] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const refresh = () => setRows(getServiceCenterRows())

    useEffect(() => {
        hydrateServiceCentersFromApi().finally(refresh)
    }, [])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return rows.filter((row) => {
            if (statusFilter && row.status !== statusFilter) return false
            if (!q) return true
            const haystack = [row.id, row.name, row.location, row.contactPerson, row.phone]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
            return haystack.includes(q)
        })
    }, [rows, search, statusFilter])

    const openDelete = (id) => {
        setPendingDeleteId(id)
        setDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!pendingDeleteId || deleting) return
        setDeleting(true)
        const result = await deleteServiceCenter(pendingDeleteId)
        setDeleting(false)
        setDeleteModal(false)
        setPendingDeleteId(null)
        if (result?.success === false) {
            toast.error(result.message || 'Could not delete service center.')
            return
        }
        refresh()
        toast.success(result?.api ? 'Service center deleted from campus API.' : 'Service center deleted.')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center flex-col md:flex-row gap-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('')
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <p className='text-sm text-[#667085] md:text-right'>
                        Centers listed here appear in Vehicle Maintenance and Service Expense dropdowns.
                    </p>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sc-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='sc-search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Name, location, contact…'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sc-status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='sc-status'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SERVICE_CENTER_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center flex-col sm:flex-row gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Service Centers</h2>
                    <NavLink
                        to='/transport-manager/service-centers/add'
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer flex items-center gap-x-2'
                    >
                        <Plus size={16} />
                        Add Service Center
                    </NavLink>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Center ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Contact Person</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Phone</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#808080]'>
                                        No service centers yet. Add one to use it on Vehicle Maintenance.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((center) => (
                                    <tr key={center.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{center.id}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{center.name}</td>
                                        <td className='px-2 py-4 text-[#667085]'>{center.location || '—'}</td>
                                        <td className='px-2 py-4 text-[#667085]'>{center.contactPerson || '—'}</td>
                                        <td className='px-2 py-4 text-[#667085]'>{center.phone || '—'}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[center.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {center.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/transport-manager/service-centers/edit/${center.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </NavLink>
                                                <button
                                                    type='button'
                                                    onClick={() => openDelete(center.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Delete
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filtered.length} of {filtered.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <DeleteRequestModal
                deleteRequestModal={deleteModal}
                setDeleteRequestModal={setDeleteModal}
                onConfirm={handleConfirmDelete}
                title='Delete Service Center?'
                message='This removes the center from the master list. Existing maintenance records keep the old name.'
                confirmLabel={deleting ? 'Deleting…' : 'Delete'}
            />
        </section>
    )
}

export default ServiceCenters
