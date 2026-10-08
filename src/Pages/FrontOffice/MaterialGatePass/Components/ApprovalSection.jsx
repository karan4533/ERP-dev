import React from 'react'
import {
    APPROVAL_ROLE_PERSONS,
    APPROVAL_ROLES,
    getPersonNameByRole,
} from '../materialGatePassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

const ApprovalSection = ({ approvals, onChange, readOnly = false }) => {
    const updateApproval = (key, field, value) => {
        if (field === 'role') {
            onChange({
                ...approvals,
                [key]: {
                    ...approvals[key],
                    role: value,
                    name: getPersonNameByRole(value),
                },
            })
            return
        }

        onChange({
            ...approvals,
            [key]: {
                ...approvals[key],
                [field]: value,
            },
        })
    }

    return (
        <div className='space-y-4'>
            <h3 className='text-base font-semibold text-[#0C1E5B]'>Approval Section</h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
                {APPROVAL_ROLES.map(({ key, label, useRoleSelect }) => {
                    const approval = approvals[key] ?? (useRoleSelect ? { role: '', name: '' } : { name: '' })

                    return (
                        <div
                            key={key}
                            className='rounded-xl border border-[#D9D9D9] bg-[#FAFBFC] p-4 flex flex-col gap-3'
                        >
                            <p className='text-sm font-semibold text-[#0C1E5B] border-b border-[#E4E7EC] pb-2'>
                                {label}
                            </p>

                            {useRoleSelect ? (
                                readOnly ? (
                                    <>
                                        <div>
                                            <span className='text-xs font-medium text-[#808080]'>Role</span>
                                            <p className='text-sm text-[#1E1E1E] mt-1'>{approval.role || '—'}</p>
                                        </div>
                                        <div>
                                            <span className='text-xs font-medium text-[#808080]'>Name</span>
                                            <p className='text-sm text-[#1E1E1E] mt-1'>{approval.name || '—'}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className='text-xs font-medium text-[#808080]'>Role</label>
                                            <select
                                                value={approval.role ?? ''}
                                                onChange={(e) => updateApproval(key, 'role', e.target.value)}
                                                className={`${inputClass} mt-1 bg-white`}
                                            >
                                                <option value=''>Select role</option>
                                                {APPROVAL_ROLE_PERSONS.map(({ role }) => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className='text-xs font-medium text-[#808080]'>Name</label>
                                            <input
                                                type='text'
                                                readOnly
                                                value={approval.name ?? ''}
                                                placeholder='Auto-filled from role'
                                                className={`${inputClass} mt-1 bg-[#F9FAFB]`}
                                            />
                                        </div>
                                    </>
                                )
                            ) : readOnly ? (
                                <div>
                                    <span className='text-xs font-medium text-[#808080]'>Name</span>
                                    <p className='text-sm text-[#1E1E1E] mt-1'>{approval.name || '—'}</p>
                                </div>
                            ) : (
                                <div>
                                    <label className='text-xs font-medium text-[#808080]'>Name</label>
                                    <input
                                        type='text'
                                        value={approval.name ?? ''}
                                        onChange={(e) => updateApproval(key, 'name', e.target.value)}
                                        placeholder='Enter name'
                                        className={`${inputClass} mt-1`}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ApprovalSection
