import React, { useMemo } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    getAdmissionById,
    getAdmissionListBase,
    getAdmissionProfileImage,
    getStudentDisplayName,
} from './admissionListData'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-sm font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
    </div>
)

const ViewAdmission = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const listPath = getAdmissionListBase(pathname)
    const record = useMemo(() => getAdmissionById(id), [id])

    if (!record) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Admission not found</h2>
                <NavLink to={listPath} className='inline-block mt-4 text-[#515DEF] hover:underline'>
                    Back to Admission List
                </NavLink>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(listPath)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start gap-4 mb-6'>
                    <img
                        src={getAdmissionProfileImage(record)}
                        alt={getStudentDisplayName(record)}
                        className='w-16 h-16 rounded-full object-cover'
                    />
                    <div>
                        <h2 className='text-xl font-semibold text-black'>{getStudentDisplayName(record)}</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            {record.admissionNumber} · Class {record.className || '—'} · Roll {record.rollNumber || '—'}
                        </p>
                        <p className='text-sm text-[#667085] mt-1'>Status: {record.status || 'Active'}</p>
                    </div>
                </div>

                <h3 className='text-lg font-semibold text-black mb-4'>Admission Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                    <Field label='Admission Date' value={record.admissionDate} />
                    <Field label='Class' value={record.className} />
                    <Field label='Registration Fees' value={record.registrationFees} />
                    <Field label='Batch Start Year' value={record.batchStartYear} />
                    <Field label='Batch End Year' value={record.batchEndYear} />
                    <Field label='Created Date' value={record.createdDate} />
                    {record.fromEnquiryId && <Field label='From Enquiry ID' value={record.fromEnquiryId} />}
                    {record.enrolledStudentId && <Field label='Enrolled Student ID' value={record.enrolledStudentId} />}
                </div>

                <h3 className='text-lg font-semibold text-black mb-4'>Student Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                    <Field label='First Name' value={record.firstName} />
                    <Field label='Middle Name' value={record.middleName} />
                    <Field label='Last Name' value={record.lastName} />
                    <Field label='Gender' value={record.gender} />
                    <Field label='Religion' value={record.religion} />
                    <Field label='Caste' value={record.caste} />
                    <Field label='Date of Birth' value={record.dateOfBirth} />
                    <Field label='Blood Group' value={record.bloodGroup} />
                    <Field label='Height' value={record.height} />
                    <Field label='Weight' value={record.weight} />
                    <Field label='Mobile Number' value={record.mobileNumber} />
                    <Field label='Alternative Mobile Number' value={record.altMobileNumber} />
                    <Field label='Email' value={record.email} />
                    <Field label='Previous School' value={record.previousSchool} />
                    <div className='lg:col-span-3'><Field label='Address' value={record.address} /></div>
                    <Field label='Country' value={record.country} />
                    <Field label='State' value={record.state} />
                    <Field label='City' value={record.city} />
                    <Field label='Zip Code' value={record.zipCode} />
                    <div className='lg:col-span-3'><Field label='Medical History' value={record.medicalHistory} /></div>
                </div>

                <h3 className='text-lg font-semibold text-black mb-4'>Transport Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                    <Field label='Mode of Transport' value={record.modeOfTransport} />
                    <Field label='Route' value={record.route} />
                    <Field label='Bus Stop' value={record.busStop} />
                </div>

                <h3 className='text-lg font-semibold text-black mb-4'>Parents Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                    <Field label="Father's Name" value={record.fatherName} />
                    <Field label="Mother's Name" value={record.motherName} />
                    <Field label="Father's Occupation" value={record.fatherOccupation} />
                    <Field label="Mother's Occupation" value={record.motherOccupation} />
                    <Field label="Father's Yearly Income" value={record.fatherIncome} />
                    <Field label="Mother's Yearly Income" value={record.motherIncome} />
                    <Field label='Siblings' value={record.siblings} />
                    <div className='lg:col-span-3'><Field label='Parent Address' value={record.parentAddress} /></div>
                    <Field label='Parent Country' value={record.parentCountry} />
                    <Field label='Parent State' value={record.parentState} />
                    <Field label='Parent City' value={record.parentCity} />
                    <Field label='Parent Zip Code' value={record.parentZipCode} />
                    <Field label='Parent Mobile Number' value={record.parentMobileNumber} />
                    <Field label='Parent Alternative Mobile Number' value={record.parentAltMobileNumber} />
                    <Field label='Parent Email' value={record.parentEmail} />
                </div>

                <h3 className='text-lg font-semibold text-black mb-4'>Account Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                    <Field label='Parent Username / Email ID' value={record.parentAccountEmail} />
                    <Field
                        label='Password'
                        value={record.parentAccountPassword ? '••••••••' : '—'}
                    />
                </div>

                <h3 className='text-lg font-semibold text-black mb-4'>Fees</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <Field label='Fees Group' value={record.feesGroup} />
                </div>
            </div>
        </section>
    )
}

export default ViewAdmission
