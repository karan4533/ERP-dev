import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus, UserPlus } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    ADMIN_USER_STATUSES,
    filterAdminUsers,
    getAdminUserSummary,
    getAllAdminUsers,
    getPermissionCount,
    ROUTE_BASE,
    statusBadgeColor,
} from './adminUsersData'

const AdminUsersList = () => {
    const [records, setRecords] = useState(() => getAllAdminUsers())
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)

    const summary = useMemo(() => getAdminUserSummary(records), [records])
    const filteredRecords = useMemo(
        () => filterAdminUsers(records, { search, status }),
        [records, search, status],
    )

    const refreshUsers = () => setRecords(getAllAdminUsers())

    const clearFilters = () => {
        setSearch('')
        setStatus('')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-start gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <UserPlus size={22} />
                    </div>
                    <div>
                        <h1 className='text-xl font-semibold text-black'>User Creation</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            Create and manage Administrator portal accounts with module-level permissions.
                        </p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Total Admin Users</p>
                    <p className='text-2xl font-semibold text-[#515DEF] mt-2'>{summary.total}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Active</p>
                    <p className='text-2xl font-semibold text-[#4CAF50] mt-2'>{summary.active}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Inactive</p>
                    <p className='text-2xl font-semibold text-[#667085] mt-2'>{summary.inactive}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Custom Created</p>
                    <p className='text-2xl font-semibold text-[#0C1E5B] mt-2'>{summary.custom}</p>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Search by name, email, ID...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {ADMIN_USER_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Administrator Accounts</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={`${ROUTE_BASE}/add`}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Admin User
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
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Admin ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Email</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Role</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Permissions</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                        No admin users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((user) => (
                                    <tr key={user.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{user.id}</td>
                                        <td className='px-2 py-4'>{user.name}</td>
                                        <td className='px-2 py-4'>{user.email}</td>
                                        <td className='px-2 py-4'>
                                            <span className='inline-flex px-2 py-1 rounded-lg text-xs font-semibold bg-[#515DEF33] text-[#515DEF]'>
                                                Administrator
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>{getPermissionCount(user.permissions)} modules</td>
                                        <td className='px-2 py-4'>
                                            <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[user.status]}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`${ROUTE_BASE}/view/${user.id}`}
                                                    onClick={refreshUsers}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
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
                    Showing {filteredRecords.length} of {records.length} entries
                </p>
                <div className='flex gap-x-2'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
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

export default AdminUsersList
