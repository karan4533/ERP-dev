import React, { useEffect, useState } from 'react'
import { UsersRound } from 'lucide-react'
import { getAllRolesForManagement } from '../../../Common/RBAC/rolePermissionsData'
import {
    canUseAdminUsersApi,
    getAdminRolePermissionsApi,
    listAdminRolesApi,
} from '../../../services/adminUsersApi'

const th = 'px-3 py-3 text-[#0C1E5B] font-medium uppercase'

const PermissionList = ({ state }) => {
    if (state.status === 'loading') return <p className='text-sm text-[#667085]'>Loading permissions…</p>
    if (state.status === 'error') return <p className='text-sm text-[#F44336]'>{state.message}</p>
    const granted = state.data.permissions.filter((permission) => permission.granted)
    if (granted.length === 0) return <p className='text-sm text-[#667085]'>This role holds no permissions.</p>
    return (
        <ul className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm'>
            {granted.map((permission) => (
                <li key={permission.code}>
                    <code className='text-xs bg-[#EDEEF5] rounded px-1.5 py-0.5'>{permission.code}</code>{' '}
                    <span className='text-[#667085]'>{permission.description}</span>
                </li>
            ))}
        </ul>
    )
}

const RolesPage = () => {
    const apiMode = canUseAdminUsersApi()
    const [roles, setRoles] = useState(null)
    const [error, setError] = useState('')
    const [open, setOpen] = useState('')
    const [permissions, setPermissions] = useState({})

    useEffect(() => {
        if (!apiMode) return undefined
        let cancelled = false
        listAdminRolesApi()
            .then((rows) => { if (!cancelled) setRoles(rows) })
            .catch((err) => { if (!cancelled) setError(err?.message || 'Could not load roles.') })
        return () => { cancelled = true }
    }, [apiMode])

    const togglePermissions = async (roleId) => {
        if (open === roleId) {
            setOpen('')
            return
        }
        setOpen(roleId)
        if (permissions[roleId]?.status === 'ready') return
        setPermissions((prev) => ({ ...prev, [roleId]: { status: 'loading' } }))
        try {
            const data = await getAdminRolePermissionsApi(roleId)
            setPermissions((prev) => ({ ...prev, [roleId]: { status: 'ready', data } }))
        } catch (err) {
            setPermissions((prev) => ({
                ...prev,
                [roleId]: { status: 'error', message: err?.message || 'Could not load permissions.' },
            }))
        }
    }

    const localRoles = getAllRolesForManagement()

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-start gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <UsersRound size={22} />
                    </div>
                    <div>
                        <h1 className='text-xl font-semibold text-black'>Roles</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            {apiMode
                                ? 'System roles and the permissions each role holds. This view is read-only; role permissions are managed by the system.'
                                : 'System roles available in the ERP demo.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                {error ? <p className='text-sm text-[#F44336] mb-3'>{error}</p> : null}
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5]'>
                            <tr>
                                <th className={th}>Role ID</th>
                                <th className={th}>Label</th>
                                {apiMode ? (
                                    <>
                                        <th className={th}>Users</th>
                                        <th className={th}>Permissions</th>
                                        <th className={th}>Created here</th>
                                        <th className={th}>Details</th>
                                    </>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {apiMode && roles === null && !error ? (
                                <tr>
                                    <td colSpan={6} className='px-3 py-8 text-center text-[#667085]'>Loading roles…</td>
                                </tr>
                            ) : null}
                            {(apiMode ? roles ?? [] : localRoles).map((role) => (
                                <React.Fragment key={role.id}>
                                    <tr className='border-b border-[#f2f4f7]'>
                                        <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{role.id}</td>
                                        <td className='px-3 py-3'>{role.label}</td>
                                        {apiMode ? (
                                            <>
                                                <td className='px-3 py-3'>{role.userCount}</td>
                                                <td className='px-3 py-3'>{role.permissionCount}</td>
                                                <td className='px-3 py-3'>{role.creatable ? 'Yes' : 'No'}</td>
                                                <td className='px-3 py-3'>
                                                    <button
                                                        type='button'
                                                        onClick={() => togglePermissions(role.id)}
                                                        className='text-xs text-[#515DEF] hover:underline cursor-pointer'
                                                    >
                                                        {open === role.id ? 'Hide permissions' : 'View permissions'}
                                                    </button>
                                                </td>
                                            </>
                                        ) : null}
                                    </tr>
                                    {apiMode && open === role.id ? (
                                        <tr className='border-b border-[#f2f4f7] bg-[#FAFBFF]'>
                                            <td colSpan={6} className='px-3 py-3'>
                                                <PermissionList state={permissions[role.id] ?? { status: 'loading' }} />
                                            </td>
                                        </tr>
                                    ) : null}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default RolesPage
