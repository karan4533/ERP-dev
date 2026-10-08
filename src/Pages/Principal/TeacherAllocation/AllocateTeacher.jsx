import React, { useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import TeacherAllocationForm from './Components/TeacherAllocationForm'
import {
    ROUTE_BASE,
    createEmptyMappingRow,
    defaultAllocationForm,
    getAllocationByEmployeeId,
    getTeacherById,
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
    const teacher = getTeacherById(employeeId)
    const [validationErrors, setValidationErrors] = useState([])
    const continueAfterSave = useRef(false)
    const initialValues = useMemo(() => buildInitialValues(employeeId), [employeeId])

    if (!teacher) {
        return <Navigate to={ROUTE_BASE} replace />
    }

    const persist = (values, redirectToList = true) => {
        const result = saveTeacherAllocation(employeeId, values)
        if (!result.success) {
            setValidationErrors(result.errors)
            return false
        }
        setValidationErrors([])
        if (redirectToList) navigate(ROUTE_BASE)
        return true
    }

    const handleSubmit = (values) => {
        persist({ ...values, status: values.status || 'Active' }, !continueAfterSave.current)
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

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Allocate Teacher</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Assign class teacher role, teaching classes, and subjects for{' '}
                    <span className='font-medium text-[#1E1E1E]'>{teacher.name}</span>.
                </p>
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
                    className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer'
                >
                    Save
                </button>
                <button
                    type='button'
                    onClick={handleSaveContinue}
                    className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer'
                >
                    Save &amp; Continue
                </button>
            </div>
        </section>
    )
}

export default AllocateTeacher
