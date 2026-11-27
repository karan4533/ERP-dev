import React, { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import TeacherAllocationForm from './Components/TeacherAllocationForm'
import {
    ROUTE_BASE,
    canSaveTeacherAllocations,
    createEmptyMappingRow,
    getAllocationByEmployeeId,
    getAllocationHydrateError,
    getAllocationHydrateStatus,
    getTeacherById,
    hydrateTeacherAllocationsFromApi,
    hydrateTeachersFromDirectory,
    isAllocationSaveInFlight,
    saveTeacherAllocation,
} from './teacherAllocationData'

const buildInitialValues = (allocation) => ({
    status: allocation.status === 'Not Allocated' ? 'Active' : allocation.status,
    classTeacher: allocation.classTeacher ?? { academicYear: '', className: '', section: '' },
    teachingClasses: [...allocation.teachingClasses],
    subjects: [...allocation.subjects],
    mappings: allocation.mappings.length ? allocation.mappings : [createEmptyMappingRow()],
})

const EditTeacherAllocation = () => {
    const { employeeId } = useParams()
    const navigate = useNavigate()
    const [ready, setReady] = useState(false)
    const [hydrateError, setHydrateError] = useState('')
    const [teacher, setTeacher] = useState(() => getTeacherById(employeeId))
    const [allocation, setAllocation] = useState(() => getAllocationByEmployeeId(employeeId))
    const [validationErrors, setValidationErrors] = useState([])
    const [saving, setSaving] = useState(false)
    const initialValues = useMemo(
        () => (allocation ? buildInitialValues(allocation) : null),
        [allocation],
    )

    const load = async () => {
        setReady(false)
        await Promise.all([
            hydrateTeacherAllocationsFromApi({ force: true }),
            hydrateTeachersFromDirectory(),
        ])
        setTeacher(getTeacherById(employeeId))
        setAllocation(getAllocationByEmployeeId(employeeId))
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
                <p className='text-sm text-[#667085]'>Loading allocation…</p>
            </section>
        )
    }

    if (getAllocationHydrateStatus() === 'error') {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6 space-y-3'>
                <p className='text-sm text-[#B54708]'>{hydrateError || 'Could not load allocations.'}</p>
                <button
                    type='button'
                    onClick={() => void load()}
                    className='text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 cursor-pointer'
                >
                    Retry
                </button>
            </section>
        )
    }

    if (!teacher || !allocation || allocation.status === 'Not Allocated') {
        return <Navigate to={ROUTE_BASE} replace />
    }

    const handleSubmit = async (values) => {
        if (!canSaveTeacherAllocations()) {
            const message = getAllocationHydrateError() || 'Allocations are not ready to save yet.'
            setValidationErrors([message])
            toast.error(message)
            return
        }
        if (isAllocationSaveInFlight() || saving) return
        setSaving(true)
        try {
            const result = await saveTeacherAllocation(employeeId, values)
            if (!result.success) {
                setValidationErrors(result.errors || ['Save failed.'])
                toast.error((result.errors && result.errors[0]) || 'Could not save allocation.')
                return
            }
            toast.success('Teacher allocation updated.')
            navigate(ROUTE_BASE)
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Edit Teacher Allocation</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Update allocation details for <span className='font-medium text-[#1E1E1E]'>{teacher.name}</span>.
                </p>
                <div className='lg:mt-8 mt-4'>
                    <TeacherAllocationForm
                        teacher={teacher}
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        validationErrors={validationErrors}
                    />
                </div>
            </div>

            <div className='flex flex-wrap sm:justify-end justify-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'
                >
                    Cancel
                </button>
                <button
                    type='button'
                    onClick={() => navigate(0)}
                    className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer'
                >
                    Reset
                </button>
                <button
                    type='submit'
                    form='teacher-allocation-form'
                    disabled={saving}
                    className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-50'
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </section>
    )
}

export default EditTeacherAllocation
