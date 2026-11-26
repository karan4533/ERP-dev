import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import ProfileUpload from '../../../Pages/Admin/FrontOffice/AdminssionList/Components/ProfileUpload'
import DocumentFileUpload from '../../../Pages/Admin/Documents/EmployeeDocuments/Components/DocumentFileUpload'
import CountrySelect from '../../CommonComponents/CountrySelect'
import StateCityFields from '../../CommonComponents/StateCityFields'
import { GENDER_OPTIONS } from '../../../Pages/Admin/FrontOffice/AdmissionEnquiry/admissionEnquiryData'
import {
    CREATABLE_ROLE_LABELS,
    CREATABLE_ROLES,
    USER_STATUSES,
} from '../createdUsersData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full focus:outline-none focus:border-[#515DEF]'

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const FormSection = ({ title, children }) => (
    <div className='mt-8 first:mt-0'>
        <h3 className='text-lg font-semibold text-black mb-4 pb-2 border-b border-[#EDEEF5]'>{title}</h3>
        {children}
    </div>
)

const Field = ({ label, htmlFor, children }) => (
    <div className='flex flex-col gap-y-2'>
        <label htmlFor={htmlFor} className='text-base font-medium text-[#1E1E1E]'>
            {label}
        </label>
        {children}
    </div>
)

const UserCreationForm = ({ form, onChange, fixedRole, fixedRoleLabel }) => {
    const updateField = (key, value) => onChange?.(key, value)
    const roleLabel = fixedRoleLabel || CREATABLE_ROLE_LABELS[fixedRole || form.role] || form.role

    return (
        <div>
            <FormSection title='Account Details'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Role' htmlFor='role'>
                        {fixedRole ? (
                            <input
                                id='role'
                                type='text'
                                value={roleLabel}
                                readOnly
                                className={`${inputClass} bg-[#FAFBFF] text-[#515DEF] font-semibold cursor-not-allowed`}
                            />
                        ) : (
                            <select
                                id='role'
                                value={form.role}
                                onChange={(e) => updateField('role', e.target.value)}
                                className={inputClass}
                            >
                                {CREATABLE_ROLES.map((role) => (
                                    <option key={role} value={role}>
                                        {CREATABLE_ROLE_LABELS[role]}
                                    </option>
                                ))}
                            </select>
                        )}
                    </Field>
                    <Field label='Status' htmlFor='status'>
                        <select
                            id='status'
                            value={form.status}
                            onChange={(e) => updateField('status', e.target.value)}
                            className={inputClass}
                        >
                            {USER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>
            </FormSection>

            <FormSection title='Basic Information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='First Name' htmlFor='firstName'>
                        <input
                            id='firstName'
                            value={form.firstName}
                            onChange={(e) => updateField('firstName', e.target.value)}
                            className={inputClass}
                            placeholder='Enter first name'
                        />
                    </Field>
                    <Field label='Middle Name' htmlFor='middleName'>
                        <input
                            id='middleName'
                            value={form.middleName}
                            onChange={(e) => updateField('middleName', e.target.value)}
                            className={inputClass}
                            placeholder='Optional'
                        />
                    </Field>
                    <Field label='Last Name' htmlFor='lastName'>
                        <input
                            id='lastName'
                            value={form.lastName}
                            onChange={(e) => updateField('lastName', e.target.value)}
                            className={inputClass}
                            placeholder='Enter last name'
                        />
                    </Field>
                    <Field label='Email ID' htmlFor='email'>
                        <input
                            id='email'
                            type='email'
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className={inputClass}
                            placeholder='user@school.com'
                        />
                    </Field>
                    <Field label='Gender' htmlFor='gender'>
                        <select
                            id='gender'
                            value={form.gender}
                            onChange={(e) => updateField('gender', e.target.value)}
                            className={inputClass}
                        >
                            <option value=''>Select gender</option>
                            {GENDER_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <div className='sm:col-span-2 lg:col-span-3'>
                        <Field label='Profile Picture' htmlFor='profileImage'>
                            <ProfileUpload
                                value={form.profileImage}
                                onChange={(value) => updateField('profileImage', value)}
                            />
                        </Field>
                    </div>
                </div>
            </FormSection>

            <FormSection title='Address'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Street' htmlFor='street'>
                        <input
                            id='street'
                            value={form.street}
                            onChange={(e) => updateField('street', e.target.value)}
                            className={inputClass}
                            placeholder='Street address'
                        />
                    </Field>
                    <CountrySelect
                        id='country'
                        label='Country:'
                        value={form.country}
                        onChange={(value) => updateField('country', value)}
                        selectClassName={inputClass}
                    />
                    <StateCityFields
                        state={form.state}
                        city={form.city}
                        onStateChange={(value) => updateField('state', value)}
                        onCityChange={(value) => updateField('city', value)}
                        stateId='userState'
                        cityId='userCity'
                    />
                    <Field label='Pincode' htmlFor='pincode'>
                        <input
                            id='pincode'
                            value={form.pincode}
                            onChange={(e) => updateField('pincode', e.target.value)}
                            className={inputClass}
                            placeholder='Pincode'
                        />
                    </Field>
                </div>
            </FormSection>

            <FormSection title='Contact Details'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Mobile Number' htmlFor='mobileNumber'>
                        <input
                            id='mobileNumber'
                            value={form.mobileNumber}
                            onChange={(e) => updateField('mobileNumber', e.target.value)}
                            className={inputClass}
                            placeholder='Primary mobile number'
                        />
                    </Field>
                    <Field label='Alternative Mobile Number' htmlFor='alternativeMobileNumber'>
                        <input
                            id='alternativeMobileNumber'
                            value={form.alternativeMobileNumber}
                            onChange={(e) => updateField('alternativeMobileNumber', e.target.value)}
                            className={inputClass}
                            placeholder='Optional'
                        />
                    </Field>
                </div>
            </FormSection>

            <FormSection title='Personal Information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Religion' htmlFor='religion'>
                        <input
                            id='religion'
                            value={form.religion}
                            onChange={(e) => updateField('religion', e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label='Caste' htmlFor='caste'>
                        <input
                            id='caste'
                            value={form.caste}
                            onChange={(e) => updateField('caste', e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label='Date of Birth' htmlFor='dateOfBirth'>
                        <div className='relative'>
                            <DatePicker
                                selected={form.dateOfBirth}
                                onChange={(date) => updateField('dateOfBirth', date)}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </Field>
                    <Field label='Blood Group' htmlFor='bloodGroup'>
                        <select
                            id='bloodGroup'
                            value={form.bloodGroup}
                            onChange={(e) => updateField('bloodGroup', e.target.value)}
                            className={inputClass}
                        >
                            <option value=''>Select blood group</option>
                            {BLOOD_GROUP_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label='Height' htmlFor='height'>
                        <input
                            id='height'
                            value={form.height}
                            onChange={(e) => updateField('height', e.target.value)}
                            className={inputClass}
                            placeholder='e.g. 165 cm'
                        />
                    </Field>
                    <Field label='Weight' htmlFor='weight'>
                        <input
                            id='weight'
                            value={form.weight}
                            onChange={(e) => updateField('weight', e.target.value)}
                            className={inputClass}
                            placeholder='e.g. 55 kg'
                        />
                    </Field>
                    <div className='sm:col-span-2 lg:col-span-3'>
                        <Field label='Medical History' htmlFor='medicalHistory'>
                            <input
                                id='medicalHistory'
                                value={form.medicalHistory}
                                onChange={(e) => updateField('medicalHistory', e.target.value)}
                                className={inputClass}
                                placeholder='Any known medical conditions'
                            />
                        </Field>
                    </div>
                </div>
            </FormSection>

            <FormSection title='Family Information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Father Name' htmlFor='fatherName'>
                        <input
                            id='fatherName'
                            value={form.fatherName}
                            onChange={(e) => updateField('fatherName', e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label='Mother Name' htmlFor='motherName'>
                        <input
                            id='motherName'
                            value={form.motherName}
                            onChange={(e) => updateField('motherName', e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label='Family Contact / Mobile Number' htmlFor='familyContactNumber'>
                        <input
                            id='familyContactNumber'
                            value={form.familyContactNumber}
                            onChange={(e) => updateField('familyContactNumber', e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                </div>
            </FormSection>

            <FormSection title='Professional Information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Qualification' htmlFor='qualification'>
                        <input
                            id='qualification'
                            value={form.qualification}
                            onChange={(e) => updateField('qualification', e.target.value)}
                            className={inputClass}
                            placeholder='e.g. B.Ed, M.Sc'
                        />
                    </Field>
                    <Field label='Years of Experience' htmlFor='yearsOfExperience'>
                        <input
                            id='yearsOfExperience'
                            value={form.yearsOfExperience}
                            onChange={(e) => updateField('yearsOfExperience', e.target.value)}
                            className={inputClass}
                            placeholder='e.g. 5 Years'
                        />
                    </Field>
                    <Field label='Previous School' htmlFor='previousSchool'>
                        <input
                            id='previousSchool'
                            value={form.previousSchool}
                            onChange={(e) => updateField('previousSchool', e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label='Joining Date' htmlFor='joiningDate'>
                        <div className='relative'>
                            <DatePicker
                                selected={form.joiningDate}
                                onChange={(date) => updateField('joiningDate', date)}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </Field>
                </div>
            </FormSection>

            <FormSection title='Account Information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Username' htmlFor='username'>
                        <input
                            id='username'
                            value={form.username}
                            onChange={(e) => updateField('username', e.target.value)}
                            className={inputClass}
                            placeholder='Defaults to email prefix if blank'
                        />
                    </Field>
                    <Field label='Password' htmlFor='password'>
                        <input
                            id='password'
                            type='password'
                            value={form.password}
                            onChange={(e) => updateField('password', e.target.value)}
                            className={inputClass}
                            placeholder='Set login password'
                        />
                    </Field>
                </div>
            </FormSection>

            <FormSection title='Documents'>
                <p className='text-sm text-[#667085] mb-4'>
                    Upload PDF, JPG, or PNG (max 5 MB) for each document.
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>ID Proof</label>
                        <DocumentFileUpload
                            fileName={form.idProofFile}
                            onChange={(value) => updateField('idProofFile', value)}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Qualification Certificate</label>
                        <DocumentFileUpload
                            fileName={form.qualificationCertificateFile}
                            onChange={(value) => updateField('qualificationCertificateFile', value)}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Experience Certificate</label>
                        <DocumentFileUpload
                            fileName={form.experienceCertificateFile}
                            onChange={(value) => updateField('experienceCertificateFile', value)}
                        />
                    </div>
                </div>
            </FormSection>
        </div>
    )
}

export default UserCreationForm
