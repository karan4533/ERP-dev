import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import AdmissionDetailsForm from './Components/AdmissionDetailsForm'
import {
    approveStudentAllocation,
    completeStudentAllocation,
    getClassOptions,
    getStudentAllocationById,
    getStudentAllocationContext,
    getSubmitterIdentity,
    rejectStudentAllocation,
    submitStudentAllocation,
} from './studentAllocationData'

const StudentAllocationDetail = () => {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { routePrefix, listPath, isApprover } = getStudentAllocationContext(location.pathname)
    const isPrincipal = routePrefix === '/principal'

    const record = getStudentAllocationById(id)
    const initialSection =
        record?.allocationStatus === 'Pending Approval'
            ? record.proposedSection || record.classSection || ''
            : record?.allocationStatus === 'Allocated'
              ? record.classSection || ''
              : ''
    const [section, setSection] = useState(initialSection)
    const [className, setClassName] = useState(record?.className || record?.sourceClassName || '')

    if (!record) {
        return <Navigate to={listPath} replace />
    }

    const readOnly =
        (!isPrincipal && isApprover) ||
        record.allocationStatus === 'Pending Approval' ||
        record.allocationStatus === 'Allocated'

    const handleComplete = () => {
        if (!className || !section) return
        completeStudentAllocation(record.id, className, section)
        navigate(listPath)
    }

    const handleSubmit = () => {
        if (!section) return
        const { name, role } = getSubmitterIdentity(routePrefix)
        submitStudentAllocation(record.id, section, name, role)
        navigate(listPath)
    }

    const handleApprove = () => {
        approveStudentAllocation(record.id)
        navigate(listPath)
    }

    const handleReject = () => {
        rejectStudentAllocation(record.id)
        navigate(listPath)
    }

    const pageTitle = isPrincipal
        ? 'Allocate Student'
        : isApprover
          ? 'Review Student Allocation'
          : readOnly
            ? 'View Student Allocation'
            : 'Allocate Student Section'

    const showApproveReject = isApprover && record.allocationStatus === 'Pending Approval'

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>{pageTitle}</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    {isPrincipal && record.allocationStatus !== 'Allocated' ? (
                        <>
                            Assign class and section for{' '}
                            <span className='font-medium text-[#1E1E1E]'>{record.studentName}</span>.
                        </>
                    ) : isApprover ? (
                        <>
                            Review the proposed section for{' '}
                            <span className='font-medium text-[#1E1E1E]'>{record.studentName}</span> and approve or reject.
                        </>
                    ) : readOnly ? (
                        <>
                            Allocation details for{' '}
                            <span className='font-medium text-[#1E1E1E]'>{record.studentName}</span>.
                            {record.allocationStatus === 'Pending Approval'
                                ? ' Awaiting Principal approval.'
                                : record.allocationStatus === 'Allocated'
                                  ? ' Section allocation is complete.'
                                  : null}
                        </>
                    ) : (
                        <>
                            Review admission details for{' '}
                            <span className='font-medium text-[#1E1E1E]'>{record.studentName}</span> and assign a section.
                        </>
                    )}
                </p>
                <div className='lg:mt-8 mt-4'>
                    <h3 className='text-lg font-semibold text-black mb-4'>Admission Information</h3>
                    {isPrincipal && record.allocationStatus !== 'Allocated' && (
                        <div className='mb-4 max-w-sm'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Class</label>
                            <select value={className} onChange={(event) => setClassName(event.target.value)} className='mt-2 text-sm border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                                <option value=''>Select class</option>
                                {getClassOptions().map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                    )}
                    <AdmissionDetailsForm
                        record={record}
                        section={section}
                        onSectionChange={setSection}
                        sectionEditable={isPrincipal ? record.allocationStatus !== 'Allocated' : !readOnly && !isApprover}
                    />
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6 flex-wrap'>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    {readOnly && !showApproveReject ? 'Back' : 'Discard Changes'}
                </button>
                {showApproveReject ? (
                    <>
                        <button
                            type='button'
                            onClick={handleReject}
                            className='bg-white text-[#FF0000] text-sm text-center px-12 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                        >
                            Reject
                        </button>
                        <button
                            type='button'
                            onClick={handleApprove}
                            className='bg-[#4CAF50] text-white text-sm text-center px-12 py-2 rounded-md border border-[#4CAF50] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                        >
                            Approve
                        </button>
                    </>
                ) : null}
                {isPrincipal && record.allocationStatus !== 'Allocated' ? (
                    <button
                        type='button'
                        onClick={handleComplete}
                        disabled={!className || !section}
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Complete allocation
                    </button>
                ) : null}
                {!isPrincipal && !isApprover && !readOnly ? (
                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={!section}
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Submit for Approval
                    </button>
                ) : null}
            </div>
        </section>
    )
}

export default StudentAllocationDetail
