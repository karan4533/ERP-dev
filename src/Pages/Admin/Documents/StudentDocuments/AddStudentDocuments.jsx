import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { toast } from 'react-toastify'
import { Calendar } from 'lucide-react'
import StudentDocumentFields from './Components/StudentDocumentFields'
import {
    addStudentDocumentRecord,
    finalizeDocumentSlotsForSubmit,
    formatPlanDate,
    getAdmissionNumberSelectOptions,
    getStudentDocumentProfileById,
    getStudentNameSelectOptions,
    STUDENT_DOCUMENT_TYPES,
} from './studentDocumentsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9FAFB] cursor-not-allowed'

const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '46px',
        borderColor: state.isFocused ? '#515DEF' : '#D9D9D9',
        boxShadow: state.isFocused ? '0 0 0 1px #515DEF' : 'none',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        '&:hover': {
            borderColor: '#515DEF',
        },
    }),
    menu: (base) => ({
        ...base,
        zIndex: 30,
        fontSize: '0.875rem',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#515DEF' : state.isFocused ? '#EDEEF5' : '#fff',
        color: state.isSelected ? '#fff' : '#1E1E1E',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#808080',
    }),
}

const buildInitialSlots = () =>
    STUDENT_DOCUMENT_TYPES.map((type) => ({
        typeId: type.id,
        label: type.label,
        fileName: '',
        status: 'Pending',
    }))

const AddStudentDocuments = () => {
    const navigate = useNavigate()
    const [studentId, setStudentId] = useState('')
    const [admissionNumber, setAdmissionNumber] = useState('')
    const [studentName, setStudentName] = useState('')
    const [className, setClassName] = useState('')
    const [section, setSection] = useState('')
    const [submittedDate, setSubmittedDate] = useState(new Date())
    const [documentSlots, setDocumentSlots] = useState(buildInitialSlots)

    const admissionOptions = useMemo(() => getAdmissionNumberSelectOptions(), [])
    const nameOptions = useMemo(() => getStudentNameSelectOptions(), [])

    const selectedAdmission = useMemo(
        () => admissionOptions.find((option) => option.value === studentId) ?? null,
        [admissionOptions, studentId],
    )

    const selectedName = useMemo(
        () => nameOptions.find((option) => option.value === studentId) ?? null,
        [nameOptions, studentId],
    )

    const applyStudent = (profile) => {
        if (!profile) {
            setStudentId('')
            setAdmissionNumber('')
            setStudentName('')
            setClassName('')
            setSection('')
            return
        }

        setStudentId(profile.studentId)
        setAdmissionNumber(profile.admissionNumber)
        setStudentName(profile.studentName)
        setClassName(profile.className)
        setSection(profile.section)
    }

    const handleAdmissionChange = (option) => {
        if (!option) {
            applyStudent(null)
            return
        }
        applyStudent(option.student || getStudentDocumentProfileById(option.value))
    }

    const handleNameChange = (option) => {
        if (!option) {
            applyStudent(null)
            return
        }
        applyStudent(option.student || getStudentDocumentProfileById(option.value))
    }

    const allDocumentsUploaded = documentSlots.every((slot) => slot.fileName.trim())

    const isValid = () =>
        studentId &&
        admissionNumber.trim() &&
        studentName.trim() &&
        className &&
        allDocumentsUploaded

    const handleSave = () => {
        if (!studentId) {
            toast.error('Select a student by admission number or name.')
            return
        }
        if (!allDocumentsUploaded) {
            toast.error('Upload all four documents before submitting.')
            return
        }

        const finalizedSlots = finalizeDocumentSlotsForSubmit(documentSlots)

        addStudentDocumentRecord({
            studentId,
            admissionNumber,
            studentName,
            className,
            section,
            submittedDate: formatPlanDate(submittedDate),
            status: 'Completed',
            documentSlots: finalizedSlots,
        })

        toast.success('Student documents submitted successfully.')
        navigate('/admin/documents/student-documents')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Student Documents Information</h2>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='admissionNumber' className='text-base font-medium text-[#1E1E1E]'>
                            Admission Number:
                        </label>
                        <Select
                            inputId='admissionNumber'
                            options={admissionOptions}
                            value={selectedAdmission}
                            onChange={handleAdmissionChange}
                            isClearable
                            isSearchable
                            placeholder={
                                admissionOptions.length
                                    ? 'Search admission number...'
                                    : 'No enrolled students found'
                            }
                            noOptionsMessage={() => 'No matching admission numbers'}
                            styles={selectStyles}
                            classNamePrefix='student-doc-admission-select'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='studentName' className='text-base font-medium text-[#1E1E1E]'>
                            Student Name:
                        </label>
                        <Select
                            inputId='studentName'
                            options={nameOptions}
                            value={selectedName}
                            onChange={handleNameChange}
                            isClearable
                            isSearchable
                            placeholder={
                                nameOptions.length ? 'Search student name...' : 'No enrolled students found'
                            }
                            noOptionsMessage={() => 'No matching students'}
                            styles={selectStyles}
                            classNamePrefix='student-doc-name-select'
                        />
                        {admissionOptions.length === 0 && (
                            <p className='text-xs text-[#667085]'>
                                Enroll students from the Admission List before adding documents.
                            </p>
                        )}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='className' className='text-base font-medium text-[#1E1E1E]'>
                            Class:
                        </label>
                        <input
                            id='className'
                            type='text'
                            value={className}
                            readOnly
                            className={readOnlyClass}
                            placeholder='Auto-filled from student'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>
                            Section:
                        </label>
                        <input
                            id='section'
                            type='text'
                            value={section}
                            readOnly
                            className={readOnlyClass}
                            placeholder='Auto-filled from student'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2 w-full max-w-md'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Submitted Date:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={submittedDate}
                                onChange={(date) => setSubmittedDate(date)}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                    <div className='col-span-3 flex flex-col gap-y-2'>
                        <h2 className='text-xl font-semibold text-black'>
                            Documents Upload —{' '}
                            <span className='text-base text-[#808080] font-normal'>
                                Upload PDF, JPG, or PNG (max 5 MB)
                            </span>
                        </h2>
                        <p className='text-sm text-[#667085]'>
                            Document status is system-controlled. Each document stays Pending until you submit the form; uploaded documents are marked Submitted after a successful save.
                        </p>
                        <StudentDocumentFields
                            slots={documentSlots}
                            onChange={setDocumentSlots}
                            statusReadOnly
                        />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/admin/documents/student-documents')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    disabled={!isValid()}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddStudentDocuments
