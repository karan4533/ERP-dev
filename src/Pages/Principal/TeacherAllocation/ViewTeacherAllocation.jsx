import React, { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TeacherAllocationForm from './Components/TeacherAllocationForm'
import {
    ROUTE_BASE,
    createEmptyMappingRow,
    getAllocationByEmployeeId,
    getTeacherById,
    hydrateTeacherAllocationsFromApi,
    hydrateTeachersFromDirectory,
} from './teacherAllocationData'

const ViewTeacherAllocation = () => {
    const { employeeId } = useParams()
    const navigate = useNavigate()
    const [ready, setReady] = useState(false)
    const [teacher, setTeacher] = useState(() => getTeacherById(employeeId))
    const [allocation, setAllocation] = useState(() => getAllocationByEmployeeId(employeeId))

    useEffect(() => {
        let cancelled = false
        Promise.all([hydrateTeacherAllocationsFromApi(), hydrateTeachersFromDirectory()]).finally(() => {
            if (cancelled) return
            setTeacher(getTeacherById(employeeId))
            setAllocation(getAllocationByEmployeeId(employeeId))
            setReady(true)
        })
        return () => {
            cancelled = true
        }
    }, [employeeId])

    const initialValues = useMemo(() => {
        if (!allocation) return null
        return {
            status: allocation.status,
            classTeacher: allocation.classTeacher ?? { academicYear: '', className: '', section: '' },
            teachingClasses: allocation.teachingClasses,
            subjects: allocation.subjects,
            mappings: allocation.mappings.length ? allocation.mappings : [createEmptyMappingRow()],
        }
    }, [allocation])

    if (!ready) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-sm text-[#667085]'>Loading allocation…</p>
            </section>
        )
    }

    if (!teacher || !allocation || allocation.status === 'Not Allocated') {
        return <Navigate to={ROUTE_BASE} replace />
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
                <h2 className='text-xl font-semibold text-black'>View Teacher Allocation</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Complete allocation details for <span className='font-medium text-[#1E1E1E]'>{teacher.name}</span>.
                </p>
                <div className='lg:mt-8 mt-4'>
                    <TeacherAllocationForm
                        teacher={teacher}
                        initialValues={initialValues}
                        readOnly
                        onSubmit={() => {}}
                    />
                </div>
            </div>
        </section>
    )
}

export default ViewTeacherAllocation
