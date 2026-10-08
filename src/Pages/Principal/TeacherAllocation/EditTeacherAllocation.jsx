import React, { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TeacherAllocationForm from './Components/TeacherAllocationForm'
import {
    ROUTE_BASE,
    createEmptyMappingRow,
    getAllocationByEmployeeId,
    getTeacherById,
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
    const teacher = getTeacherById(employeeId)
    const allocation = getAllocationByEmployeeId(employeeId)
    const [validationErrors, setValidationErrors] = useState([])
    const initialValues = useMemo(
        () => (allocation ? buildInitialValues(allocation) : null),
        [allocation],
    )

    if (!teacher || !allocation || allocation.status === 'Not Allocated') {
        return <Navigate to={ROUTE_BASE} replace />
    }

    const handleSubmit = (values) => {
        const result = saveTeacherAllocation(employeeId, values)
        if (!result.success) {
            setValidationErrors(result.errors)
            return
        }
        navigate(ROUTE_BASE)
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
                    className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer'
                >
                    Save
                </button>
            </div>
        </section>
    )
}

export default EditTeacherAllocation
