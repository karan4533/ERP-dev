import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import { getDriverById, getDriverDisplayName } from './driverManagementData'

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

const ViewDriver = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const driver = getDriverById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/driver-management')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!driver ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Driver not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{getDriverDisplayName(driver)}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>
                                Driver ID: {driver.id}
                            </span>
                            {' · '}
                            <span>{driver.routeAssigned}</span>
                        </p>
                    </div>

                    <Section title='Personal Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Driver ID' value={driver.id} />
                            <Field label='First Name' value={driver.firstName} />
                            <Field label='Middle Name' value={driver.middleName} />
                            <Field label='Last Name' value={driver.lastName} />
                            <Field label='Gender' value={driver.gender} />
                            <Field label='Date of Birth' value={driver.dateOfBirth} />
                            <Field label='Medical History' value={driver.medicalHistory} />
                            <div className='lg:col-span-3'>
                                <Field label='Address' value={driver.address} />
                            </div>
                            <Field label='Country' value={driver.country} />
                            <Field label='State' value={driver.state} />
                            <Field label='City' value={driver.city} />
                            <Field label='Zip Code' value={driver.zipCode} />
                            <Field label='Mobile Number' value={driver.mobileNumber} />
                            <Field label='Alternative Number' value={driver.alternativeNumber} />
                            <Field label='Email' value={driver.email} />
                            <Field label='Blood Group' value={driver.bloodGroup} />
                            <Field label='Height' value={driver.height} />
                            <Field label='Weight' value={driver.weight} />
                            <div className='lg:col-span-3'>
                                <div className='flex flex-col gap-y-1'>
                                    <span className='text-base font-medium text-[#808080]'>
                                        Profile Image
                                    </span>
                                    <img
                                        src={driver.profileImage || mo_user}
                                        alt={getDriverDisplayName(driver)}
                                        className='w-24 h-24 rounded-xl object-cover border border-[#D9D9D9]'
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title='Driving Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Driving License Number' value={driver.licenseNumber} />
                            <Field label='License Expiry Date' value={driver.licenseExpiry} />
                            <Field label='Driving Experience' value={driver.experience} />
                        </div>
                    </Section>

                    <Section title='Vehicle Assignment'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Vehicle Number' value={driver.vehicleNumber} />
                            <Field label='Vehicle Type' value={driver.vehicleType} />
                            <Field label='Route Assigned' value={driver.routeAssigned} />
                        </div>
                    </Section>

                    <Section title='Employment Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Employee Type' value={driver.employeeType} />
                            <Field label='Salary' value={driver.salary} />
                            <Field label='Work Shift' value={driver.workShift} />
                        </div>
                    </Section>

                    <Section title='Account Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='User Name' value={driver.username} />
                            <Field label='Password' value={driver.password} />
                            <Field label='Role' value={driver.role} />
                        </div>
                    </Section>

                    <Section title='Documents Upload'>
                        <p className='text-sm text-[#808080] mb-6 -mt-2'>
                            Uploaded document files
                        </p>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='ID Proof' value={driver.documents?.idProof} />
                            <Field label='Driving License Copy' value={driver.documents?.licenseCopy} />
                            <Field label='Address Proof' value={driver.addressProof} />
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewDriver
