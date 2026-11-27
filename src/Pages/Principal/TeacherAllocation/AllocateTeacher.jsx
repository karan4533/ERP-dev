import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import TeacherAllocationForm from './Components/TeacherAllocationForm'
import {
    ROUTE_BASE,
    canSaveTeacherAllocations,
    createEmptyMappingRow,
    defaultAllocationForm,
    getAllocationByEmployeeId,
    getAllocationHydrateError,
    getAllocationHydrateStatus,
    getTeacherById,
    hydrateTeacherAllocationsFromApi,
    hydrateTeachersFromDirectory,
    isAllocationSaveInFlight,
    saveTeacherAllocation,
} from './teacherAllocationData'

const buildInitialValues = (employeeId) => {
    const existing = getAllocationByEmployeeId(employeeId)
    if (!existing || existing.status === 'Not Allocated') {
        return defaultAllocationForm()
    }

    return {
        status: existing.status === 'Not Allocated' ? 'Active' : existing.status,
        classTeacher: existing.classTeacher ?? defaultAllocationForm().classTeacher,
        teachingClasses: [...existing.teachingClasses],
        subjects: [...existing.subjects],
        mappings: existing.mappings.length ? existing.mappings : [createEmptyMappingRow()],
    }
}

const AllocateTeacher = () => {
    const { employeeId } = useParams()
    const navigate = useNavigate()
    const [ready, setReady] = useState(false)
    const [hydrateOk, setHydrateOk] = useState(false)
    const [hydrateError, setHydrateError] = useState('')
    const [teacher, setTeacher] = useState(() => getTeacherById(employeeId))
    const [validationErrors, setValidationErrors] = useState([])
    const [saving, setSaving] = useState(false)
    const continueAfterSave = useRef(false)
    const initialValues = useMemo(() => buildInitialValues(employeeId), [employeeId, ready, hydrateOk])

    const load = async () => {
        setReady(false)
        const [allocOk] = await Promise.all([
            hydrateTeacherAllocationsFromApi({ force: true }),
            hydrateTeachersFromDirectory(),
        ])
        setTeacher(getTeacherById(employeeId))
        setHydrateOk(allocOk || getAllocationHydrateStatus() === 'ready' || getAllocationHydrateStatus() === 'idle')
        setHydrateError(getAllocationHydrateError())
        setReady(true)
    }

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            await load()
            if (cancelled) return
        })()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId])

    if (!ready) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-sm text-[#667085]'>Loading teacher allocation…</p>
            </section>
        )
    }

    if (!teacher) {
        return <Navigate to={ROUTE_BASE} replace />
    }

    const persist = async (values, redirectToList = true) => {
        if (!canSaveTeacherAllocations() && getAllocationHydrateStatus() !== 'idle') {
            const message = getAllocationHydrateError() || 'Allocations are not ready to save yet. Retry loading first.'
            setValidationErrors([message])
            toast.error(message)
            return false
        }
        if (isAllocationSaveInFlight() || saving) return false
        setSaving(true)
        try {
            const result = await saveTeacherAllocation(employeeId, values)
            if (!result.success) {
                setValidationErrors(result.errors || ['Save failed.'])
                toast.error((result.errors && result.errors[0]) || 'Could not save allocation.')
                return false
            }
            setValidationErrors([])
            toast.success('Teacher allocation saved.')
            if (redirectToList) navigate(ROUTE_BASE)
            return true
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = (values) => {
        void persist({ ...values, status: values.status || 'Active' }, !continueAfterSave.current)
        continueAfterSave.current = false
    }

    const handleSaveContinue = () => {
        continueAfterSave.current = true
        document.getElementById('teacher-allocation-form')?.requestSubmit()
    }

    const handleReset = () => {
        setValidationErrors([])
        navigate(0)
    }

    const saveDisabled = saving || (getAllocationHydrateStatus() === 'error')

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Allocate Teacher</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Assign class teacher role, teaching classes, and subjects for{' '}
                    <span className='font-medium text-[#1E1E1E]'>{teacher.name}</span>.
                </p>
                {!hydrateOk && hydrateError ? (
                    <div className='mt-3 text-sm text-[#B54708] bg-[#FFFAEB] border border-[#FEDF89] rounded-lg px-3 py-2 flex flex-wrap items-center gap-3'>
                        <span>{hydrateError}</span>
                        <button
                            type='button'
                            onClick={() => void load()}
                            className='text-[#515DEF] underline cursor-pointer'
                        >
                            Retry
                        </button>
                    </div>
                ) : null}
                <div className='lg:mt-8 mt-4'>
                    <TeacherAllocationForm
                        teacher={teacher}
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        validationErrors={validationErrors}
                        showDepartmentDesignation={false}
                        showStatus={false}
                    />
                </div>
            </div>

            <div className='flex flex-wrap sm:justify-end justify-center gap-3 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'
                >
                    Cancel
                </button>
                <button
                    type='button'
                    onClick={handleReset}
                    className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'
                >
                    Reset
                </button>
                <button
                    type='submit'
                    form='teacher-allocation-form'
                    disabled={saveDisabled}
                    className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-50'
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                    type='button'
                    onClick={handleSaveContinue}
                    disabled={saveDisabled}
                    className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-50'
                >
                    Save &amp; Continue
                </button>
            </div>
        </section>
    )
}

export default AllocateTeacher
