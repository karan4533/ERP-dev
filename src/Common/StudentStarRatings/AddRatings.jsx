import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ScrollableSelect from '../CommonComponents/ScrollableSelect'
import { hydrateEnrolledStudentsFromApi } from '../StudentDatabase/enrolledStudentsData'
import { getStudentsList } from '../StudentDatabase/studentDatabaseData'
import { useTeacherAssignments } from '../Teacher/useTeacherAssignments'
import { isApiStudentsEnabled } from '../../services/apiClient'
import StarRatingInput from './Components/StarRatingInput'
import { useStarRatingsRouteBase } from './useStarRatingsRouteBase'
import { uploadProfileImage } from '../../services/filesApi'
import {
    RATING_CATEGORY,
    academicYearFromMonthLabel,
    addSomRating,
    getDefaultSomMonth,
    getSomMonthOptions,
    getStudents,
    hydrateSomRatingsFromApi,
    normalizeAcademicYearLabel,
} from './studentStarRatingsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const AddRatings = () => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const routeBase = useStarRatingsRouteBase()
    const assignments = useTeacherAssignments()
    const ratedByRole = pathname.startsWith('/coordinator') ? 'Coordinator' : 'Teacher'

    const [scopedRows, setScopedRows] = useState([])
    const [classSection, setClassSection] = useState('')
    const [selectedStudentId, setSelectedStudentId] = useState('')
    const monthOptions = useMemo(() => getSomMonthOptions(), [])
    const [month, setMonth] = useState(() => getDefaultSomMonth())
    const [rating, setRating] = useState(0)
    const [description, setDescription] = useState('')
    const [attachment, setAttachment] = useState(null)
    const [loadingStudents, setLoadingStudents] = useState(isApiStudentsEnabled())
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        hydrateSomRatingsFromApi().catch(() => {})
    }, [])

    useEffect(() => {
        if (!monthOptions.length) return
        if (!monthOptions.includes(month)) setMonth(monthOptions[monthOptions.length - 1])
    }, [month, monthOptions])

    const classSectionOptions = useMemo(() => {
        if (assignments.classSections?.length) return assignments.classSections
        // Fallback: derive from scoped enrolled students only if allocations are empty
        return [
            ...new Set(
                getStudents(scopedRows)
                    .map((student) => student.classSection)
                    .filter(Boolean),
            ),
        ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    }, [assignments.classSections, scopedRows])

    useEffect(() => {
        let cancelled = false
        const apply = () => {
            const all = getStudentsList()
            if (!assignments.ready) return
            const scoped = assignments.assignments.length
                ? all.filter((student) => assignments.studentInScope(student))
                : []
            if (!cancelled) {
                setScopedRows(scoped)
                setLoadingStudents(false)
            }
        }
        if (!isApiStudentsEnabled()) {
            queueMicrotask(() => {
                if (!cancelled) apply()
            })
            return () => {
                cancelled = true
            }
        }
        setLoadingStudents(true)
        hydrateEnrolledStudentsFromApi().finally(() => {
            if (!cancelled) apply()
        })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when assignment hydrate settles
    }, [assignments.ready, assignments.assignments.length, assignments.classSections?.join('|')])

    // Default to the teacher's first assigned class/section once allocations load.
    useEffect(() => {
        if (!assignments.ready) return
        if (classSection) return
        if (classSectionOptions[0]) setClassSection(classSectionOptions[0])
    }, [assignments.ready, classSection, classSectionOptions])

    const studentOptions = useMemo(() => {
        const students = getStudents(scopedRows)
        if (!classSection) return students
        return students.filter((student) => assignments.matchesClassSection(student, classSection))
    }, [assignments, classSection, scopedRows])

    const selectedStudent = studentOptions.find((student) => student.id === selectedStudentId)
        ?? getStudents(scopedRows).find((student) => student.id === selectedStudentId)

    const handleClassSectionChange = (value) => {
        setClassSection(value)
        setSelectedStudentId('')
    }

    const handleSave = async () => {
        if (!selectedStudent || rating < 1 || rating > 3 || saving) return
        setSaving(true)
        try {
            let attachmentFileId = null
            let attachmentName = ''
            if (attachment) {
                const asset = await uploadProfileImage(attachment, 'som-rating-doc', selectedStudent.id)
                attachmentFileId = asset.id
                attachmentName = asset.originalName || attachment.name
            }
            await addSomRating({
                month,
                academicYear: normalizeAcademicYearLabel(academicYearFromMonthLabel(month)),
                studentId: selectedStudent.id,
                studentName: selectedStudent.name,
                rollNumber: selectedStudent.rollNumber,
                className: selectedStudent.className,
                section: selectedStudent.section,
                rating,
                description,
                ratedByRole,
                attachmentFileId,
                attachmentName,
                allowOverwrite: true,
            })
            toast.success(`Saved Star of the Month rating for ${month}.`)
            navigate(`${routeBase}/star-of-month`, { state: { month, refresh: Date.now() } })
        } catch (error) {
            toast.error(error?.message || 'Could not save star rating.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Star of the Month Rating</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Rate students monthly using a 1–3 star scale ({RATING_CATEGORY}).
                </p>
                {assignments.emptyReason ? (
                    <p className='text-sm text-[#E65100] mt-2'>{assignments.emptyReason}</p>
                ) : (
                    <p className='text-sm text-[#667085] mt-2'>
                        Showing your assigned class/section options
                        {classSectionOptions.length ? ` (${classSectionOptions.length})` : ''}.
                        {loadingStudents ? ' Loading students…' : null}
                    </p>
                )}
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-section' className='text-base font-medium text-[#1E1E1E]'>Class & Section:</label>
                        <select
                            id='class-section'
                            value={classSection}
                            onChange={(e) => handleClassSectionChange(e.target.value)}
                            className={selectClass}
                            disabled={!classSectionOptions.length}
                        >
                            {!classSectionOptions.length ? (
                                <option value=''>No assigned classes</option>
                            ) : null}
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
                        <ScrollableSelect
                            id='month'
                            value={month}
                            onChange={setMonth}
                            options={monthOptions}
                            placeholder='Select month'
                            listClassName='max-h-48'
                        />
                        <p className='text-xs text-[#667085]'>Academic year months up to the current month only.</p>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='student-select' className='text-base font-medium text-[#1E1E1E]'>Student Name:</label>
                        <select
                            id='student-select'
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className={selectClass}
                            disabled={!studentOptions.length}
                        >
                            <option value=''>
                                {loadingStudents
                                    ? 'Loading students…'
                                    : studentOptions.length
                                        ? 'Select Student'
                                        : classSection
                                            ? 'No students in this class/section'
                                            : 'Select class first'}
                            </option>
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
                    <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                        <label htmlFor='som-attachment' className='text-base font-medium text-[#1E1E1E]'>Supporting document:</label>
                        <input
                            id='som-attachment'
                            type='file'
                            accept='.pdf,.png,.jpg,.jpeg,.doc,.docx,image/png,image/*,application/pdf'
                            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                            className={inputClass}
                        />
                        <p className='text-xs text-[#667085]'>
                            Optional. Stored securely; only staff with Star of the Month access can download.
                            {attachment ? ` Selected: ${attachment.name}` : ''}
                        </p>
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
                    disabled={!selectedStudent || rating < 1 || saving}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddRatings
