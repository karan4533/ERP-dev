import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StarRatingInput from './Components/StarRatingInput'
import { useStarRatingsRouteBase } from './useStarRatingsRouteBase'
import {
    ACADEMIC_YEAR_MONTHS,
    ACADEMIC_YEARS,
    RATING_CATEGORY,
    addSomRating,
    getClassSectionOptions,
    getStudents,
} from './studentStarRatingsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const AddRatings = () => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const routeBase = useStarRatingsRouteBase()
    const ratedByRole = pathname.startsWith('/coordinator') ? 'Coordinator' : 'Teacher'

    const [classSection, setClassSection] = useState('')
    const [selectedStudentId, setSelectedStudentId] = useState('')
    const [month, setMonth] = useState(ACADEMIC_YEAR_MONTHS[0])
    const [rating, setRating] = useState(0)
    const [description, setDescription] = useState('')

    const classSectionOptions = useMemo(() => getClassSectionOptions(), [])
    const studentOptions = useMemo(() => {
        const students = getStudents()
        if (!classSection) return students
        return students.filter((student) => student.classSection === classSection)
    }, [classSection])

    const selectedStudent = studentOptions.find((student) => student.id === selectedStudentId)
        ?? getStudents().find((student) => student.id === selectedStudentId)

    const handleClassSectionChange = (value) => {
        setClassSection(value)
        setSelectedStudentId('')
    }

    const handleSave = () => {
        if (!selectedStudent || rating < 1) return

        addSomRating({
            month,
            academicYear: ACADEMIC_YEARS[0],
            studentId: selectedStudent.id,
            studentName: selectedStudent.name,
            rollNumber: selectedStudent.rollNumber,
            className: selectedStudent.className,
            section: selectedStudent.section,
            rating,
            description,
            ratedByRole,
        })

        navigate(`${routeBase}/star-of-month`)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Star of the Month Rating</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Rate students monthly using a 1–3 star scale ({RATING_CATEGORY}).
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-section' className='text-base font-medium text-[#1E1E1E]'>Class & Section:</label>
                        <select
                            id='class-section'
                            value={classSection}
                            onChange={(e) => handleClassSectionChange(e.target.value)}
                            className={selectClass}
                        >
                            <option value=''>All Classes</option>
                            {classSectionOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='rating-id' className='text-base font-medium text-[#1E1E1E]'>Rating ID:</label>
                        <input type='text' id='rating-id' placeholder='Auto-generated' className={inputClass} readOnly />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='month' className='text-base font-medium text-[#1E1E1E]'>Month:</label>
                        <select
                            id='month'
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className={selectClass}
                        >
                            {ACADEMIC_YEAR_MONTHS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='student-select' className='text-base font-medium text-[#1E1E1E]'>Student Name:</label>
                        <select
                            id='student-select'
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className={selectClass}
                        >
                            <option value=''>Select Student</option>
                            {studentOptions.map((student) => (
                                <option key={student.id} value={student.id}>{student.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='roll-number' className='text-base font-medium text-[#1E1E1E]'>Roll Number:</label>
                        <input
                            type='text'
                            id='roll-number'
                            value={selectedStudent?.rollNumber ?? ''}
                            className={inputClass}
                            readOnly
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='student-id' className='text-base font-medium text-[#1E1E1E]'>Student ID:</label>
                        <input
                            type='text'
                            id='student-id'
                            value={selectedStudent?.id ?? ''}
                            className={inputClass}
                            readOnly
                        />
                    </div>
                    <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-1'>
                        <label className='text-base font-medium text-[#1E1E1E]'>{RATING_CATEGORY} (1–3 Stars):</label>
                        <div className='border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <StarRatingInput value={rating} onChange={setRating} />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-2'>
                        <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                        <input
                            type='text'
                            id='description'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder='Brief remarks for this monthly rating'
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(`${routeBase}/star-of-month`)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    disabled={!selectedStudent || rating < 1}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddRatings
