import React from 'react'
import {
    SIGNATORY_ROLE_PERSONS,
    SIGNATORY_ROLES,
    getPersonNameByRole,
} from '../goodsReceivedPassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

const SignatorySection = ({ signatories, onChange, readOnly = false }) => {
    const updateSignatory = (key, field, value) => {
        if (field === 'role') {
            onChange({
                ...signatories,
                [key]: {
                    ...signatories[key],
                    role: value,
                    name: getPersonNameByRole(value),
                },
            })
            return
        }

        onChange({
            ...signatories,
            [key]: {
                ...signatories[key],
                [field]: value,
            },
        })
    }

    return (
        <div className='space-y-4'>
            <h3 className='text-base font-semibold text-[#0C1E5B]'>Signatory Section</h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                {SIGNATORY_ROLES.map(({ key, label, useRoleSelect }) => {
                    const signatory = signatories[key] ?? (useRoleSelect ? { role: '', name: '' } : { name: '' })

                    return (
                        <div
                            key={key}
                            className='rounded-xl border border-[#D9D9D9] bg-[#FAFBFC] p-4 flex flex-col gap-3 min-h-[140px]'
                        >
                            <p className='text-sm font-semibold text-[#0C1E5B] border-b border-[#E4E7EC] pb-2'>
                                {label}
                            </p>

                            {useRoleSelect ? (
                                readOnly ? (
                                    <>
                                        <div>
                                            <span className='text-xs font-medium text-[#808080]'>Role</span>
                                            <p className='text-sm text-[#1E1E1E] mt-1'>{signatory.role || '—'}</p>
                                        </div>
                                        <div>
                                            <span className='text-xs font-medium text-[#808080]'>Name</span>
                                            <p className='text-sm text-[#1E1E1E] mt-1'>{signatory.name || '—'}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className='text-xs font-medium text-[#808080]'>Role</label>
                                            <select
                                                value={signatory.role ?? ''}
                                                onChange={(e) => updateSignatory(key, 'role', e.target.value)}
                                                className={`${inputClass} mt-1 bg-white`}
                                            >
                                                <option value=''>Select role</option>
                                                {SIGNATORY_ROLE_PERSONS.map(({ role }) => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className='text-xs font-medium text-[#808080]'>Name</label>
                                            <input
                                                type='text'
                                                readOnly
                                                value={signatory.name ?? ''}
                                                placeholder='Auto-filled from role'
                                                className={`${inputClass} mt-1 bg-[#F9FAFB]`}
                                            />
                                        </div>
                                    </>
                                )
                            ) : readOnly ? (
                                <div>
                                    <span className='text-xs font-medium text-[#808080]'>Name</span>
                                    <p className='text-sm text-[#1E1E1E] mt-1'>{signatory.name || '—'}</p>
                                </div>
                            ) : (
                                <div>
                                    <label className='text-xs font-medium text-[#808080]'>Name</label>
                                    <input
                                        type='text'
                                        value={signatory.name ?? ''}
                                        onChange={(e) => updateSignatory(key, 'name', e.target.value)}
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

export default SignatorySection
