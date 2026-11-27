import React from 'react'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const REFERRAL_TYPES = ['Parent', 'Staff', 'Other']

/** Optional: who referred this admission. Recorded only; any bonus is applied by the Account Head. */
const ReferralInfo = ({ form, onChange }) => {
    const update = (key, value) => onChange?.(key, value)
    const isParent = (form.referralType || 'Parent') === 'Parent'

    return (
        <div className='lg:mt-6 mt-2'>
            <p className='text-sm text-[#6B7280] mb-4'>
                Optional. Leave the name blank if nobody referred this admission. The Account Head sees referrals and applies any bonus manually.
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='referralType' className='text-base font-medium text-[#1E1E1E]'>Referred by:</label>
                    <select
                        id='referralType'
                        value={form.referralType || 'Parent'}
                        onChange={(event) => update('referralType', event.target.value)}
                        className={inputClass}
                    >
                        {REFERRAL_TYPES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='referralName' className='text-base font-medium text-[#1E1E1E]'>Referrer name:</label>
                    <input
                        id='referralName'
                        type='text'
                        maxLength={160}
                        autoComplete='off'
                        value={form.referralName || ''}
                        onChange={(event) => update('referralName', event.target.value)}
                        placeholder='e.g. Meena Iyer'
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='referralContact' className='text-base font-medium text-[#1E1E1E]'>Referrer contact:</label>
                    <input
                        id='referralContact'
                        type='text'
                        maxLength={80}
                        autoComplete='off'
                        value={form.referralContact || ''}
                        onChange={(event) => update('referralContact', event.target.value)}
                        placeholder='Mobile or email'
                        className={inputClass}
                    />
                </div>
                {isParent && (
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='referralStudentAdmissionNo' className='text-base font-medium text-[#1E1E1E]'>
                            Referrer&apos;s child admission no.:
                        </label>
                        <input
                            id='referralStudentAdmissionNo'
                            type='text'
                            maxLength={40}
                            autoComplete='off'
                            value={form.referralStudentAdmissionNo || ''}
                            onChange={(event) => update('referralStudentAdmissionNo', event.target.value)}
                            placeholder='e.g. ADM-0012'
                            className={inputClass}
                        />
                    </div>
                )}
                <div className='flex flex-col gap-y-2 md:col-span-2'>
                    <label htmlFor='referralNotes' className='text-base font-medium text-[#1E1E1E]'>Notes:</label>
                    <input
                        id='referralNotes'
                        type='text'
                        maxLength={1000}
                        value={form.referralNotes || ''}
                        onChange={(event) => update('referralNotes', event.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>
        </div>
    )
}

export default ReferralInfo
