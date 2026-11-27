import React, { useEffect } from 'react'
import { getUsersByRole } from '../taskManagementConfig'

/**
 * `users` / `loading` / `error` come from useAssignableUsers (API mode). When `users` is not passed the
 * component falls back to the built-in demo list for the role, exactly as before.
 */
const UserMultiSelect = ({ roleKey, selectedUserIds, onChange, disabled = false, users: usersProp, loading = false, error = '' }) => {
    const users = usersProp ?? getUsersByRole(roleKey)
    const allSelected = users.length > 0 && users.every((user) => selectedUserIds.includes(user.id))

    useEffect(() => {
        if (!roleKey && selectedUserIds.length) {
            onChange([])
        }
    }, [roleKey, selectedUserIds.length, onChange])

    const toggleUser = (userId) => {
        if (disabled) return
        if (selectedUserIds.includes(userId)) {
            onChange(selectedUserIds.filter((id) => id !== userId))
            return
        }
        onChange([...selectedUserIds, userId])
    }

    const toggleAll = () => {
        if (disabled || !users.length) return
        onChange(allSelected ? [] : users.map((user) => user.id))
    }

    const emptyBox = 'text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-3 bg-[#F9FAFB]'

    if (!roleKey) {
        return <div className={emptyBox}>Select a role to choose users</div>
    }

    if (loading) {
        return <div className={emptyBox}>Loading users…</div>
    }

    if (error) {
        return <div className='text-sm text-[#B42318] border border-[#FDA29B] rounded-md px-3 py-3 bg-[#FEF3F2]' role='alert'>{error}</div>
    }

    if (!users.length) {
        return <div className={emptyBox}>No users available for this role</div>
    }

    return (
        <div className={`border border-[#D9D9D9] rounded-md ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
            <label className='flex items-center gap-3 px-3 py-2.5 border-b border-[#EDEEF5] bg-[#F8F9FF] cursor-pointer hover:bg-[#EDEEF5]'>
                <input
                    type='checkbox'
                    checked={allSelected}
                    onChange={toggleAll}
                    className='size-4 accent-[#515DEF] cursor-pointer'
                />
                <span className='text-sm font-medium text-[#515DEF]'>All</span>
                <span className='text-xs text-[#808080]'>({users.length} users)</span>
            </label>
            <div className='max-h-44 overflow-y-auto p-2 space-y-1'>
                {users.map((user) => (
                    <label
                        key={user.id}
                        className='flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#F2F4F7] cursor-pointer'
                    >
                        <input
                            type='checkbox'
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => toggleUser(user.id)}
                            className='size-4 accent-[#515DEF] cursor-pointer'
                        />
                        <span className='text-sm text-[#1E1E1E]'>{user.name}</span>
                        <span className='text-xs text-[#808080]'>({user.hint ?? user.id})</span>
                    </label>
                ))}
            </div>
            {selectedUserIds.length > 0 && (
                <p className='text-xs text-[#515DEF] px-3 py-2 border-t border-[#EDEEF5]'>
                    {allSelected ? 'All users selected' : `${selectedUserIds.length} user(s) selected`}
                </p>
            )}
        </div>
    )
}

export default UserMultiSelect
