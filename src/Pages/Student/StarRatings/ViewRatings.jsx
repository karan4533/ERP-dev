import React from 'react'
import { Star } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { formatGradeSection } from '../studentPortalConfig'

const MAX_STARS = 3

const MOCK_RATING = {
    month: 'June 2025',
    academicYear: '2025-2026',
    ratedBy: 'Mrs. Priya Nair',
    rating: 2,
    remarks: 'Good attendance and consistent participation in class activities.',
}

const StarRatingDisplay = ({ rating, size = 24 }) => {
    const clampedRating = Math.min(Math.max(rating, 0), MAX_STARS)

    return (
        <div className='flex items-center gap-1'>
            {Array.from({ length: MAX_STARS }, (_, index) => {
                const isFilled = index < clampedRating
                return (
                    <Star
                        key={index}
                        size={size}
                        className={
                            isFilled
                                ? 'fill-[#FFC107] text-[#FFC107]'
                                : 'fill-none text-[#D9D9D9]'
                        }
                    />
                )
            })}
            <span className='text-sm text-[#667085] ml-2'>
                ({clampedRating}/{MAX_STARS})
            </span>
        </div>
    )
}

const InfoField = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value}</span>
    </div>
)

const ViewRatings = () => {
    const { activeStudent } = useActiveStudent()
    const rating = MOCK_RATING
    const student = {
        name: activeStudent.name,
        classSection: formatGradeSection(activeStudent),
        classTeacher: 'Mrs. Priya Nair',
        rollNumber: activeStudent.rollNumber,
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black mb-6'>Student Information</h2>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-6'>
                    <img
                        src={mo_user}
                        alt=''
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{student.name}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            Roll No: {student.rollNumber}
                        </p>
                    </div>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    <InfoField label='Student Name' value={student.name} />
                    <InfoField
                        label='Class & Section'
                        value={student.classSection}
                    />
                    <InfoField label='Class Teacher' value={student.classTeacher} />
                    <InfoField label='Roll Number' value={student.rollNumber} />
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black mb-2'>Star Rating</h2>
                <p className='text-sm text-[#667085] mb-6'>
                    Your monthly star rating on a 1–3 scale.
                </p>

                <div className='border border-[#EDEEF5] rounded-xl p-6 max-w-2xl'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6'>
                        <InfoField label='Month' value={rating.month} />
                        <InfoField label='Academic Year' value={rating.academicYear} />
                        <InfoField label='Rated By' value={rating.ratedBy} />
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-t border-[#f2f4f7]'>
                        <span className='text-base font-medium text-[#808080]'>Rating (1–3)</span>
                        <StarRatingDisplay rating={rating.rating} />
                    </div>

                    <div className='pt-4 border-t border-[#f2f4f7]'>
                        <InfoField label='Remarks' value={rating.remarks} />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ViewRatings
