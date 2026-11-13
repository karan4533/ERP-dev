import React, { useState } from 'react'
import { getParentByEmail } from '../../../../../Common/ParentAccounts/parentAccountsData'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AccountInformation = ({ form, onChange, isEnrolled = false }) => {
    const update = (key, value) => onChange?.(key, value)
    const [existingParentHint, setExistingParentHint] = useState(null)

    const handleEmailBlur = () => {
        const email = String(form.parentAccountEmail || '').trim().toLowerCase()
        if (!email) {
            setExistingParentHint(null)
            return
        }
        const existing = getParentByEmail(email)
        setExistingParentHint(
            existing
                ? 'Existing parent account found — student will be linked on enrollment. Password not required.'
                : null,
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2 lg:col-span-2'>
                <label htmlFor='parentAccountEmail' className='text-base font-medium text-[#1E1E1E]'>
                    Username / Email ID:
                </label>
                <input
                    id='parentAccountEmail'
                    type='email'
                    value={form.parentAccountEmail}
                    onChange={(e) => {
                        update('parentAccountEmail', e.target.value)
                        setExistingParentHint(null)
                    }}
                    onBlur={handleEmailBlur}
                    readOnly={isEnrolled}
                    className={`${inputClass} ${isEnrolled ? 'bg-[#F5F5F5]' : ''}`}
                    placeholder='parent@example.com'
                />
                {existingParentHint && (
                    <p className='text-sm text-[#515DEF]'>{existingParentHint}</p>
                )}
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='parentAccountPassword' className='text-base font-medium text-[#1E1E1E]'>
                    Password:
                </label>
                <input
                    id='parentAccountPassword'
                    type='password'
                    value={form.parentAccountPassword}
                    onChange={(e) => update('parentAccountPassword', e.target.value)}
                    className={inputClass}
                    placeholder={existingParentHint ? 'Optional for existing parent' : 'Enter password'}
                    autoComplete='new-password'
                />
            </div>
        </div>
    )
}

export default AccountInformation
