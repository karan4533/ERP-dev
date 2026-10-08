import React, { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import StudentReEnrollmentForm from './Components/StudentReEnrollmentForm'
import {
    ROUTE_BASE,
    formFromRecord,
    getReEnrollmentById,
    statusBadgeColor,
} from './studentReEnrollmentData'

const ViewStudentReEnrollment = () => {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const record = getReEnrollmentById(id)

    useEffect(() => {
        if (searchParams.get('print') === '1' && record) {
            window.print()
        }
    }, [searchParams, record])

    if (!record) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Re-enrollment record not found.</div>
            </section>
        )
    }

    const form = formFromRecord(record)

    return (
        <section className='space-y-6 print:space-y-4'>
            <div className='flex flex-wrap items-center gap-3 print:hidden'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <button
                    type='button'
                    onClick={() => navigate(`${ROUTE_BASE}/edit/${record.id}`)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    Edit
                </button>
                <button
                    type='button'
                    onClick={() => window.print()}
                    className='inline-flex items-center gap-2 text-sm text-white bg-[#515DEF] rounded-md px-4 py-2 hover:opacity-90 cursor-pointer'
                >
                    <Printer size={16} />
                    Print Acknowledgement
                </button>
            </div>

            <div id='student-re-enrollment-print' className='print:shadow-none'>
                <div className='bg-white rounded-2xl shadow-md p-4 mb-6 print:shadow-none print:rounded-none print:p-0'>
                    <div className='text-center space-y-1 mb-6 print:mb-4'>
                        <p className='text-xl font-bold tracking-wide text-[#0C1E5B] uppercase'>
                            Queen Mira International School
                        </p>
                        <p className='text-sm text-[#667085]'>
                            Melakkal Main Road, Kochadai, Madurai - 625016
                        </p>
                        <p className='text-base font-semibold text-[#0C1E5B] pt-1'>
                            Student Re-Enrollment Acknowledgement
                        </p>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
                        <div className='rounded-lg border border-[#D9D9D9] p-3'>
                            <p className='text-xs font-medium text-[#808080]'>Re-Enrollment ID</p>
                            <p className='text-lg font-bold text-[#0C1E5B] mt-1'>{record.id}</p>
                        </div>
                        <div className='rounded-lg border border-[#D9D9D9] p-3'>
                            <p className='text-xs font-medium text-[#808080]'>Submitted Date</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.submittedDate}</p>
                        </div>
                        <div className='rounded-lg border border-[#D9D9D9] p-3'>
                            <p className='text-xs font-medium text-[#808080]'>Status</p>
                            <p className='mt-1'>
                                <span className={`text-sm font-medium border rounded-md px-2 py-1 ${statusBadgeColor[record.status]}`}>
                                    {record.status}
                                </span>
                            </p>
                        </div>
                    </div>

                    <p className='text-sm text-[#667085] mb-4 print:text-black'>
                        This acknowledges that the original Transfer Certificate has been returned and the student re-enrollment request has been recorded by Front Office.
                        {record.status === 'Re-Enrolled' || record.admissionStatus === 'Active'
                            ? ' The student has been reactivated in the ERP with Active admission status.'
                            : ' Admission status will be updated to Active upon approval.'}
                    </p>
                </div>

                <StudentReEnrollmentForm form={form} onChange={() => {}} readOnly />

                <div className='bg-white rounded-2xl shadow-md p-4 mt-6 print:shadow-none print:rounded-none print:mt-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4'>
                        <div>
                            <p className='text-sm text-[#808080]'>Front Office Signature</p>
                            <div className='border-b border-[#D9D9D9] mt-8 h-8' />
                        </div>
                        <div>
                            <p className='text-sm text-[#808080]'>Parent / Guardian Signature</p>
                            <div className='border-b border-[#D9D9D9] mt-8 h-8' />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #student-re-enrollment-print, #student-re-enrollment-print * { visibility: visible; }
                    #student-re-enrollment-print { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </section>
    )
}

export default ViewStudentReEnrollment
