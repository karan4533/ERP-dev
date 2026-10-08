import React from 'react'
import { getSectionOptions } from '../studentAllocationData'

const readOnlyClass =
    'text-sm font-normal text-[#667085] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9FAFB] cursor-not-allowed'

const editableClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const ReadOnlyField = ({ label, value }) => (
    <div className='flex flex-col gap-y-2'>
        <label className='text-base font-medium text-[#1E1E1E]'>{label}</label>
        <input type='text' readOnly value={value ?? '—'} className={readOnlyClass} />
    </div>
)

const AdmissionDetailsForm = ({ record, section, onSectionChange, sectionEditable = false }) => {
    if (!record) return null

    const { admission, student, transport, parents, feesTimeline } = record

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
                <ReadOnlyField label='Admission Roll Number:' value={admission.admissionRollNumber} />
                <ReadOnlyField label='Admission Date:' value={admission.admissionDate} />
                <ReadOnlyField label='Class:' value={admission.className} />
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='class-section' className='text-base font-medium text-[#1E1E1E]'>
                        Class Section:
                    </label>
                    {sectionEditable ? (
                        <select
                            id='class-section'
                            value={section}
                            onChange={(e) => onSectionChange(e.target.value)}
                            className={editableClass}
                        >
                            <option value=''>Select Section</option>
                            {getSectionOptions().map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input type='text' readOnly value={section || '—'} className={readOnlyClass} />
                    )}
                </div>
                <ReadOnlyField label='Registration Fees:' value={admission.registrationFees} />
                <ReadOnlyField label='Batch Start Year:' value={admission.batchStartYear} />
                <ReadOnlyField label='Batch End Year:' value={admission.batchEndYear} />
            </div>

            {record.submittedBy ? (
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-[#515DEF08] border border-[#515DEF22] rounded-xl'>
                    <ReadOnlyField label='Submitted By:' value={record.submittedBy} />
                    <ReadOnlyField label='Role:' value={record.submittedByRole} />
                    <ReadOnlyField label='Submitted At:' value={record.submittedAt} />
                </div>
            ) : null}

            <div>
                <h3 className='text-lg font-semibold text-black mb-4'>Student Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <ReadOnlyField label='First Name:' value={student.firstName} />
                    <ReadOnlyField label='Middle Name:' value={student.middleName || '—'} />
                    <ReadOnlyField label='Last Name:' value={student.lastName} />
                    <ReadOnlyField label='Gender:' value={student.gender} />
                    <ReadOnlyField label='Religion:' value={student.religion} />
                    <ReadOnlyField label='Caste:' value={student.caste} />
                    <ReadOnlyField label='Address:' value={student.address} />
                    <ReadOnlyField label='Date Of Birth:' value={student.dateOfBirth} />
                    <ReadOnlyField label='Country:' value={student.country} />
                    <ReadOnlyField label='State:' value={student.state} />
                    <ReadOnlyField label='City:' value={student.city} />
                    <ReadOnlyField label='Zip Code:' value={student.zipCode} />
                    <ReadOnlyField label='Mobile Number:' value={student.mobileNumber} />
                    <ReadOnlyField label='Alternative Mobile Number:' value={student.alternativeMobileNumber} />
                    <ReadOnlyField label='Email:' value={student.email} />
                    <ReadOnlyField label='Previous School:' value={student.previousSchool} />
                    <ReadOnlyField label='Blood Group:' value={student.bloodGroup} />
                    <ReadOnlyField label='Height:' value={student.height} />
                    <ReadOnlyField label='Weight:' value={student.weight} />
                    <ReadOnlyField label='Medical History:' value={student.medicalHistory} />
                </div>
            </div>

            <div>
                <h3 className='text-lg font-semibold text-black mb-4'>Transport Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    <ReadOnlyField label='Route List:' value={transport.routeList} />
                    <ReadOnlyField label='Bus Stop:' value={transport.busStop} />
                </div>
            </div>

            <div>
                <h3 className='text-lg font-semibold text-black mb-4'>Parents Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <ReadOnlyField label="Father's Name:" value={parents.fatherName} />
                    <ReadOnlyField label="Mother's Name:" value={parents.motherName} />
                    <ReadOnlyField label="Father's Occupation:" value={parents.fatherOccupation} />
                    <ReadOnlyField label="Mother's Occupation:" value={parents.motherOccupation} />
                    <ReadOnlyField label="Father's Yearly Income:" value={parents.fatherYearlyIncome} />
                    <ReadOnlyField label="Mother's Yearly Income:" value={parents.motherYearlyIncome} />
                    <ReadOnlyField label='Siblings:' value={parents.siblings} />
                    <ReadOnlyField label='Address:' value={parents.address} />
                    <ReadOnlyField label='Country:' value={parents.country} />
                    <ReadOnlyField label='State:' value={parents.state} />
                    <ReadOnlyField label='City:' value={parents.city} />
                    <ReadOnlyField label='Zip Code:' value={parents.zipCode} />
                    <ReadOnlyField label='Mobile Number:' value={parents.mobileNumber} />
                    <ReadOnlyField label='Email:' value={parents.email} />
                </div>
            </div>

            <div>
                <h3 className='text-lg font-semibold text-black mb-4'>Fees Timeline</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    <ReadOnlyField label='Fees Group:' value={feesTimeline} />
                </div>
            </div>
        </div>
    )
}

export default AdmissionDetailsForm
