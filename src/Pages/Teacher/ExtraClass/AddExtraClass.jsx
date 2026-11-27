import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import ExtraClassForm from './Components/ExtraClassForm'
import { canUseAcademicsApi } from '../../../services/academicsApi'
import {
    addExtraClass,
    getExtraClassById,
    hydrateExtraClassesFromApi,
    updateExtraClass,
} from './extraClassData'

const AddExtraClass = ({ listPath = '/teacher/class/extra-class' }) => {
    const navigate = useNavigate()
    const { id: editId } = useParams()
    const isEdit = Boolean(editId)
    const [existing, setExisting] = useState(() => (isEdit ? getExtraClassById(editId) : null))
    const [loading, setLoading] = useState(() => canUseAcademicsApi())
    const [loadError, setLoadError] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const fetchRecord = async () => {
        const ok = canUseAcademicsApi() ? await hydrateExtraClassesFromApi({ force: true }) : true
        return {
            record: isEdit ? getExtraClassById(editId) : null,
            error: ok ? '' : 'Could not load extended classes from the campus API. Saving is blocked until this succeeds.',
        }
    }

    const load = async () => {
        setLoading(true)
        setLoadError('')
        const result = await fetchRecord()
        setExisting(result.record)
        setLoadError(result.error)
        setLoading(false)
    }

    useEffect(() => {
        let cancelled = false
        fetchRecord().then((result) => {
            if (cancelled) return
            setExisting(result.record)
            setLoadError(result.error)
            setLoading(false)
        })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    const handleSubmit = async (values) => {
        if (saving || loading || loadError) return
        if (!values.subject || !values.className || !values.section || !values.topic || !values.date) {
            setError('Subject, class, section, topic, and date are required.')
            return
        }
        if (!values.startTime || !values.endTime) {
            setError('Start time and end time are required.')
            return
        }
        if (!values.venue) {
            setError('Venue is required.')
            return
        }
        setError('')
        setSaving(true)
        try {
            if (isEdit) {
                const record = await updateExtraClass(editId, values)
                if (!record) throw new Error('Extended class not found.')
                toast.success(`Extended class ${record.extraClassId || editId} updated.`)
            } else {
                const record = await addExtraClass(values)
                toast.success(`Extended class ${record.extraClassId} saved.`)
            }
            navigate(listPath, { state: { refresh: Date.now() }, replace: true })
        } catch (err) {
            setError(err?.message || 'Could not save extended class.')
            toast.error(err?.message || 'Could not save extended class.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-sm text-[#667085]'>Loading extended class…</p>
            </section>
        )
    }

    if (loadError) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-sm text-[#B54708]'>{loadError}</p>
                <div className='flex gap-4 mt-4'>
                    <button type='button' onClick={() => void load()} className='text-sm text-[#515DEF] hover:underline cursor-pointer'>
                        Retry
                    </button>
                    <button type='button' onClick={() => navigate(listPath)} className='text-sm text-[#515DEF] hover:underline cursor-pointer'>
                        Back to list
                    </button>
                </div>
            </section>
        )
    }

    if (isEdit && !existing) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <h2 className='text-xl font-semibold text-black'>Extended class not found</h2>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='mt-4 text-sm text-[#515DEF] hover:underline cursor-pointer'
                >
                    Back to list
                </button>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>
                    {isEdit ? 'Edit Extended Class' : 'Extended Class Information'}
                </h2>
                <p className='text-sm text-[#667085] mt-1'>
                    {canUseAcademicsApi()
                        ? 'Saved sessions are stored in the campus academics database.'
                        : 'API mode is off — sessions are kept in this browser only.'}
                </p>
                {error ? <p className='text-sm text-[#B42318] mt-3'>{error}</p> : null}
                <ExtraClassForm formId='extra-class-form' record={existing} onSubmit={handleSubmit} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    disabled={saving}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50'
                >
                    Discard Changes
                </button>
                <button
                    type='submit'
                    form='extra-class-form'
                    disabled={saving}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddExtraClass
