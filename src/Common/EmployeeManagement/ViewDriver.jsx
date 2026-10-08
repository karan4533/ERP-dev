import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, Car, Briefcase, FileText, Bus } from 'lucide-react'
import mo_user from '../../assets/images/no-profile.png'
import { getDriverById, getDriverDisplayName, statusBadgeColor } from './driversData'

const Section = ({ title, icon: Icon, children }) => (
    <div className='bg-white rounded-2xl shadow-sm border border-[#EEF0F6] overflow-hidden'>
        <div className='flex items-center gap-3 px-6 py-4 border-b border-[#EEF0F6] bg-linear-to-r from-[#F8F9FF] to-white'>
            <div className='p-2.5 rounded-xl bg-[#515DEF]/10'>
                <Icon className='w-5 h-5 text-[#515DEF]' />
            </div>
            <h2 className='text-lg font-semibold text-[#0C1E5B]'>{title}</h2>
        </div>
        <div className='p-6'>{children}</div>
    </div>
)

const InfoCard = ({ label, value }) => (
    <div className='rounded-xl border border-[#E8ECF4] bg-[#FAFBFD] px-4 py-3.5 hover:border-[#515DEF]/25 transition-colors'>
        <span className='text-xs font-medium uppercase tracking-wide text-[#808080]'>{label}</span>
        <p className='text-sm font-medium text-[#1E1E1E] mt-1 whitespace-pre-wrap wrap-break-word'>{value}</p>
    </div>
)

const ViewDriver = ({ basePath }) => {
    const navigate = useNavigate()
    const { id } = useParams()
    const driver = getDriverById(id)

    if (!driver) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(basePath)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Driver not found or could not be loaded.
                </div>
            </section>
        )
    }

    const displayName = getDriverDisplayName(driver)

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(basePath)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='relative overflow-hidden rounded-2xl shadow-md bg-linear-to-br from-[#515DEF] via-[#6366F1] to-[#7C3AED] p-6 sm:p-8'>
                <div className='absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3' />
                <div className='relative flex flex-col sm:flex-row sm:items-center gap-6'>
                    <div className='relative shrink-0'>
                        <img
                            src={driver.profileImage || mo_user}
                            alt=''
                            className='w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg'
                        />
                        <div className='absolute -bottom-2 -right-2 p-2 rounded-xl bg-white shadow-md'>
                            <Bus className='w-5 h-5 text-[#515DEF]' />
                        </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                        <p className='text-white/70 text-sm font-medium uppercase tracking-wider'>Driver Profile</p>
                        <h1 className='text-2xl sm:text-3xl font-bold text-white mt-1'>{displayName}</h1>
                        <p className='text-white/80 text-sm mt-2'>
                            Driver ID: <span className='font-semibold text-white'>{driver.id}</span>
                            {' · '}
                            {driver.routeAssigned}
                        </p>
                        <div className='flex flex-wrap gap-2 mt-4'>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeColor[driver.status]}`}>
                                {driver.status}
                            </span>
                            <span className='px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm'>
                                {driver.experience} Experience
                            </span>
                            <span className='px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm'>
                                {driver.vehicleNumber}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <Section title='Personal information' icon={User}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <InfoCard label='First name' value={driver.firstName} />
                    <InfoCard label='Middle name' value={driver.middleName || '—'} />
                    <InfoCard label='Last name' value={driver.lastName} />
                    <InfoCard label='Gender' value={driver.gender} />
                    <InfoCard label='Date of birth' value={driver.dateOfBirth} />
                    <InfoCard label='Blood group' value={driver.bloodGroup} />
                    <InfoCard label='Height' value={driver.height} />
                    <InfoCard label='Weight' value={driver.weight} />
                    <InfoCard label='Medical history' value={driver.medicalHistory} />
                    <div className='sm:col-span-2 lg:col-span-3'>
                        <InfoCard label='Address' value={driver.address} />
                    </div>
                    <InfoCard label='City' value={driver.city} />
                    <InfoCard label='State' value={driver.state} />
                    <InfoCard label='Country' value={driver.country} />
                    <InfoCard label='Zip code' value={driver.zipCode} />
                    <InfoCard label='Mobile number' value={driver.mobileNumber} />
                    <InfoCard label='Alternative number' value={driver.alternativeNumber} />
                    <InfoCard label='Email' value={driver.email} />
                </div>
            </Section>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Section title='Driving information' icon={Car}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <InfoCard label='License number' value={driver.licenseNumber} />
                        <InfoCard label='License expiry date' value={driver.licenseExpiry} />
                        <InfoCard label='Driving experience' value={driver.experience} />
                    </div>
                </Section>

                <Section title='Vehicle assignment' icon={Bus}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <InfoCard label='Vehicle number' value={driver.vehicleNumber} />
                        <InfoCard label='Vehicle type' value={driver.vehicleType} />
                        <div className='sm:col-span-2'>
                            <InfoCard label='Route assigned' value={driver.routeAssigned} />
                        </div>
                    </div>
                </Section>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Section title='Employment information' icon={Briefcase}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <InfoCard label='Employee type' value={driver.employeeType} />
                        <InfoCard label='Joining date' value={driver.joiningDate} />
                        <InfoCard label='Reporting to' value={driver.reportingTo} />
                        <InfoCard label='Status' value={driver.status} />
                    </div>
                </Section>

                <Section title='Documents' icon={FileText}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <InfoCard label='ID proof' value={driver.documents.idProof} />
                        <InfoCard label='License copy' value={driver.documents.licenseCopy} />
                        <InfoCard label='Experience certificate' value={driver.documents.experienceCertificate} />
                    </div>
                </Section>
            </div>
        </section>
    )
}

export default ViewDriver
