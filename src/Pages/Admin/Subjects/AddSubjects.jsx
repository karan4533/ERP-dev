import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { canUseClassDetailsApi, createSubject } from '../../../services/classDetailsApi'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AddSubjects = () => {
    const navigate = useNavigate()
    const apiMode = canUseClassDetailsApi()
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setError('')
        if (!apiMode) {
            setError('Sign in with API auth enabled to create campus subjects.')
            return
        }
        if (!code.trim() || !name.trim()) {
            setError('Subject code and name are required.')
            return
        }
        setSaving(true)
        try {
            const saved = await createSubject({ code, name })
            toast.success(`Subject ${saved.code} created.`)
            navigate('/admin/class/subjects')
        } catch (saveError) {
            setError(saveError?.message || 'Could not create subject.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Subject Information</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Creates a campus subject master via POST /masters/subjects (used by timetables and exams).
                </p>

                {error && (
                    <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                        {error}
                    </div>
                )}

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='subject-code' className='text-base font-medium text-[#1E1E1E]'>Subject Code:</label>
                        <input
                            id='subject-code'
                            type='text'
                            value={code}
                            onChange={(event) => setCode(event.target.value.toUpperCase())}
                            placeholder='ENG'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2 md:col-span-2'>
                        <label htmlFor='subject-name' className='text-base font-medium text-[#1E1E1E]'>Subject Name:</label>
                        <input
                            id='subject-name'
                            type='text'
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder='English'
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/admin/class/subjects')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddSubjects
