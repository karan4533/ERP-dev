import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getStudentTransportById } from './studentTransportData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const ViewStudentTransport = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getStudentTransportById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/student-transport')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Student transport record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{record.studentName}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>Student ID: {record.studentId}</span>
                            {' · '}
                            <span>{record.classSection}</span>
                        </p>
                    </div>

                    <Section title='Student Transport Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Student ID' value={record.studentId} />
                            <Field label='Student Name' value={record.studentName} />
                            <Field label='Class & Section' value={record.classSection} />
                            <Field label='Admission Number' value={record.admissionNumber} />
                            <Field label='Route Name' value={record.routeName} />
                            <Field label='Vehicle Number' value={record.vehicleNumber} />
                            <Field label='Start Location' value={record.startLocation} />
                            <Field label='End Location' value={record.endLocation} />
                            <Field label='Pick Up Time' value={record.pickUpTime} />
                            <Field label='Drop Time' value={record.dropTime} />
                            <Field label='Fees Structure' value={record.feesStructure} />
                            <Field label='Support Staff' value={record.supportStaff} />
                            <Field label='Driver Name' value={record.driverName} />
                            <Field label='Driver Contact' value={record.driverContact} />
                            <Field label='Created Date' value={record.createdDate} />
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewStudentTransport
