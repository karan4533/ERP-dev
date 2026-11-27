import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { EllipsisIcon, Plus, Download } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ListPagination, { PageSizeSelect } from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import { filterListRows } from '../../../Common/listFiltering'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'
import { deleteRoute, getRoutes, hydrateRoutesFromApi } from './routeManagementData'

const RouteManagement = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const [routes, setRoutes] = useState(() => getRoutes())
    useEffect(() => {
        hydrateRoutesFromApi().finally(() => setRoutes(getRoutes()))
    }, [])

    const [search, setSearch] = useState('')
    const [vehicleNumber, setVehicleNumber] = useState('')
    const [exportModal, setExportModal] = useState(false)

    const filteredRoutes = useMemo(
        () => filterListRows(routes, {
            search,
            searchKeys: ['id', 'routeName', 'startLocation', 'endLocation', 'vehicleId', 'vehicleNumber', 'driverName', 'driverContact'],
            equals: { vehicleNumber },
        }),
        [routes, search, vehicleNumber],
    )
    const pagination = useListPagination(filteredRoutes, { resetKey: `${search}|${vehicleNumber}` })
    const [deleteModal, setDeleteModal] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const openDelete = (routeId) => {
        if (!showDelete) return
        setPendingDeleteId(routeId)
        setDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!showDelete || !pendingDeleteId || deleting) return
        setDeleting(true)
        const result = await deleteRoute(pendingDeleteId)
        setDeleting(false)
        setDeleteModal(false)
        setPendingDeleteId(null)
        if (result?.success === false) {
            toast.error(result.message || 'Could not delete route.')
            return
        }
        setRoutes(getRoutes())
        toast.success(result?.api ? 'Route deleted from campus API.' : 'Route deleted.')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setVehicleNumber('')
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input type='text' id='search' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Route ID, name, location...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='vehicle-filter' className='text-base font-medium text-[#808080]'>Vehicle</label>
                        <select id='vehicle-filter' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {[...new Set(routes.map((route) => route.vehicleNumber).filter(Boolean))].map((number) => (
                                <option key={number} value={number}>{number}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Route Details List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/transport-manager/route-management/add-route'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add New Route
                        </NavLink>
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
                <PageSizeSelect pagination={pagination} className='my-2' />
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Route ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Route Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Total Stops</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Distance</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Estimated Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Contact</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoutes.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className='px-2 py-8 text-center text-[#667085]'>{emptyListMessage(routes.length)}</td>
                                </tr>
                            ) : null}
                            {pagination.rows.map((route) => (
                                <tr key={route.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{route.id}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{route.routeName}</td>
                                    <td className='px-2 py-4'>{route.startLocation}</td>
                                    <td className='px-2 py-4'>{route.endLocation}</td>
                                    <td className='px-2 py-4'>{route.vehicleId}</td>
                                    <td className='px-2 py-4'>{route.vehicleNumber}</td>
                                    <td className='px-2 py-4 text-center'>{route.totalStops}</td>
                                    <td className='px-2 py-4'>{route.distance}</td>
                                    <td className='px-2 py-4'>{route.estimatedTime}</td>
                                    <td className='px-2 py-4'>{route.driverName}</td>
                                    <td className='px-2 py-4'>{route.driverContact}</td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`/transport-manager/route-management/view/${route.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                View
                                            </NavLink>
                                            <NavLink
                                                to={`/transport-manager/route-management/edit/${route.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                Edit
                                            </NavLink>
                                            {showDelete ? (
                                                <button
                                                    type='button'
                                                    onClick={() => openDelete(route.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Delete
                                                </button>
                                            ) : null}
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination pagination={pagination} />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='routemanagement'
                title='RouteManagement'
                rows={filteredRoutes}
                exportDescription={<>You are exporting {filteredRoutes.length} record(s).</>}
            />
            <DeleteRequestModal
                deleteRequestModal={deleteModal}
                setDeleteRequestModal={setDeleteModal}
                onConfirm={handleConfirmDelete}
                title='Delete Route?'
                message='This will permanently remove the route. This action cannot be undone.'
                confirmLabel={deleting ? 'Deleting…' : 'Delete'}
            />
        </section>
    )
}

export default RouteManagement
