import React, { useEffect, useState } from 'react'
import { Bed } from 'lucide-react'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { findHostelAssignment, loadHostelBundle } from './hostelData'

const DetailItem = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

const EmptyState = ({ title = 'Hostel Details' }) => (
    <div className='bg-white rounded-2xl shadow-md p-8 text-center space-y-2'>
        <h2 className='text-xl font-semibold text-black'>{title}</h2>
        <p className='text-sm text-[#667085]'>No hostel assignment yet</p>
        <p className='text-xs text-[#667085]'>
            When a hostel block and room are published for this student, they will appear here.
        </p>
    </div>
)

const HostelDetails = () => {
    const { activeStudent } = useActiveStudent()
    const [assignment, setAssignment] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        if (!activeStudent?.id && !activeStudent?.admissionNumber && !activeStudent?.admissionNo) {
            setAssignment(null)
            setLoading(false)
            return undefined
        }
        setLoading(true)
        loadHostelBundle(activeStudent)
            .then((bundle) => {
                if (!cancelled) setAssignment(findHostelAssignment(activeStudent, bundle.assignments))
            })
            .catch(() => {
                if (!cancelled) setAssignment(null)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [activeStudent])

    if (loading) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Loading hostel assignment…
                </div>
            </section>
        )
    }

    if (!assignment) {
        return (
            <section>
                <EmptyState />
            </section>
        )
    }

    const hostelName = assignment.hostelName || assignment.hostel || 'Assigned hostel'
    const block = assignment.block || assignment.hostelBlock || assignment.blockName || '—'
    const room = assignment.room || assignment.roomNumber || assignment.roomNo || '—'

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <Bed size={22} />
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Hostel Details</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>
                            Assigned block and room for {assignment.studentName || activeStudent?.name || 'this student'}.
                        </p>
                    </div>
                </div>

                <div className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
                        <div>
                            <p className='text-sm font-medium text-[#515DEF] uppercase tracking-wide'>Assigned Hostel</p>
                            <h3 className='text-xl font-semibold text-[#0C1E5B] mt-1'>{hostelName}</h3>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            <span className='inline-flex items-center bg-[#EBF4FE] px-4 py-1.5 rounded-md text-sm font-medium text-[#0751E0]'>
                                Block {block}
                            </span>
                            <span className='inline-flex items-center bg-[#F0F8FE] px-4 py-1.5 rounded-md text-sm font-medium text-[#515DEF]'>
                                Room {room}
                            </span>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <DetailItem label='Student' value={assignment.studentName || activeStudent?.name} />
                        <DetailItem label='Admission No.' value={assignment.admissionNumber || assignment.admissionNo || activeStudent?.admissionNumber} />
                        <DetailItem label='Class' value={assignment.classSection || activeStudent?.classSection} />
                        <DetailItem label='Block' value={block} />
                        <DetailItem label='Room' value={room} />
                        <DetailItem label='Bed' value={assignment.bed || assignment.bedNumber || assignment.bedNo} />
                        <DetailItem label='Floor' value={assignment.floor} />
                        <DetailItem label='Warden' value={assignment.wardenName || assignment.warden} />
                        <DetailItem label='Warden Contact' value={assignment.wardenContact || assignment.wardenPhone} />
                        <DetailItem label='Check-in' value={assignment.checkInDate || assignment.allocatedOn} />
                        <DetailItem label='Academic Year' value={assignment.academicYear} />
                        <DetailItem label='Status' value={assignment.status || 'Active'} />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HostelDetails
