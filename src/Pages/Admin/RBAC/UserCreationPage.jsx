import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    CREATABLE_ROLE_LABELS,
    getAllCreatedUsers,
    updateUserStatus,
    deleteCreatedUser,
} from '../../../Common/RBAC/createdUsersData'

const ROUTE_BASE = '/admin/rbac/user-creation'

const statusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Inactive: 'bg-[#66708533] text-[#667085]',
}

const UserCreationPage = () => {
    const [users, setUsers] = useState(() => getAllCreatedUsers())

    const refreshUsers = () => setUsers(getAllCreatedUsers())

    const handleToggleStatus = (user) => {
        const next = user.status === 'Active' ? 'Inactive' : 'Active'
        updateUserStatus(user.id, next)
        refreshUsers()
        toast.success(`User marked as ${next}.`)
    }

    const handleDeleteUser = (user) => {
        deleteCreatedUser(user.id)
        refreshUsers()
        toast.success('User removed.')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-start gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <UserPlus size={22} />
                    </div>
                    <div>
                        <h1 className='text-xl font-semibold text-black'>User Creation</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            Create staff users for Principal, PRM, Teacher, Coordinator, Librarian, and Gate Keeper roles. Student accounts are created through Admission enrollment.
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center gap-3 mb-4 flex-wrap'>
                    <h2 className='text-lg font-semibold text-black'>Created Users</h2>
                    <NavLink
                        to={`${ROUTE_BASE}/add`}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90'
                    >
                        <Plus size={16} />
                        Create User
                    </NavLink>
                </div>

                {users.length === 0 ? (
                    <div className='py-12 text-center'>
                        <p className='text-[#0C1E5B] font-semibold'>No users created yet</p>
                        <p className='text-sm text-[#667085] mt-2'>Create staff accounts for ERP login and role-based access.</p>
                    </div>
                ) : (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5]'>
                                <tr>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>ID</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Email</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Role</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className='border-b border-[#f2f4f7]'>
                                        <td className='px-3 py-3'>{user.id}</td>
                                        <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{user.name}</td>
                                        <td className='px-3 py-3'>{user.email}</td>
                                        <td className='px-3 py-3'>{CREATABLE_ROLE_LABELS[user.role] || user.role}</td>
                                        <td className='px-3 py-3'>
                                            {user.className && user.section ? `${user.className}-${user.section}` : '—'}
                                        </td>
                                        <td className='px-3 py-3'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[user.status]}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className='px-3 py-3'>
                                            <div className='flex items-center gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => handleToggleStatus(user)}
                                                    className='text-xs text-[#515DEF] hover:underline cursor-pointer'
                                                >
                                                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => handleDeleteUser(user)}
                                                    className='text-[#F44336] cursor-pointer'
                                                    aria-label='Delete user'
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    )
}

export default UserCreationPage
