import React, { useState } from 'react'
import { getParentByEmail } from '../../../../../Common/ParentAccounts/parentAccountsData'
import { STUDENT_LOGIN_MIN_GRADE, studentLoginAllowedForClass } from '../../../../../services/admissionsApi'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AccountInformation = ({ form, onChange, isEnrolled = false }) => {
    const update = (key, value) => onChange?.(key, value)
    const studentLoginAllowed = studentLoginAllowedForClass(form.className)
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
        <div className='flex flex-col gap-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#0C1E5B] mb-4'>Parent portal login</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2 lg:col-span-2'>
                        <label htmlFor='parentAccountEmail' className='text-base font-medium text-[#1E1E1E]'>
                            Parent Username / Email ID:
                        </label>
                        <input
                            id='parentAccountEmail'
                            name='parent-portal-email'
                            type='email'
                            autoComplete='off'
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
                            Parent Password:
                        </label>
                        <input
                            id='parentAccountPassword'
                            name='parent-portal-new-password'
                            type='password'
                            value={form.parentAccountPassword}
                            onChange={(e) => update('parentAccountPassword', e.target.value)}
                            className={inputClass}
                            placeholder={
                                existingParentHint
                                    ? 'Optional for existing parent'
                                    : form.hasParentAccountPassword
                                        ? 'Saved — leave blank to keep'
                                        : 'Enter password (used on enroll)'
                            }
                            autoComplete='new-password'
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#0C1E5B] mb-1'>Student portal login</h3>
                {!studentLoginAllowed ? (
                    <p className='text-sm text-[#6B7280]'>
                        Not available for {form.className}: children below Grade {STUDENT_LOGIN_MIN_GRADE} use the parent login only.
                    </p>
                ) : (
                <>
                <p className='text-sm text-[#6B7280] mb-4'>
                    Optional for Grade {STUDENT_LOGIN_MIN_GRADE} and above. Save email and password here — enroll uses them (no second password prompt).
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2 lg:col-span-2'>
                        <label htmlFor='studentAccountEmail' className='text-base font-medium text-[#1E1E1E]'>
                            Student Username / Email ID:
                        </label>
                        <input
                            id='studentAccountEmail'
                            name='student-portal-email'
                            type='email'
                            autoComplete='off'
                            value={form.studentAccountEmail || ''}
                            onChange={(e) => update('studentAccountEmail', e.target.value)}
                            readOnly={isEnrolled}
                            className={`${inputClass} ${isEnrolled ? 'bg-[#F5F5F5]' : ''}`}
                            placeholder='student@example.com'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='studentAccountPassword' className='text-base font-medium text-[#1E1E1E]'>
                            Student Password:
                        </label>
                        <input
                            id='studentAccountPassword'
                            name='student-portal-new-password'
                            type='password'
                            value={form.studentAccountPassword || ''}
                            onChange={(e) => update('studentAccountPassword', e.target.value)}
                            className={inputClass}
                            placeholder={
                                form.hasStudentAccountPassword
                                    ? 'Saved — leave blank to keep'
                                    : 'Enter password (used on enroll)'
                            }
                            autoComplete='new-password'
                        />
                    </div>
                </div>
                </>
                )}
            </div>
        </div>
    )
}

export default AccountInformation
