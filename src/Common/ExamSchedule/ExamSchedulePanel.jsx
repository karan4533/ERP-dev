import React, { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { toast } from 'react-toastify'
import TimeTableModal from '../../Pages/Principal/ExaminationTimetable/Components/TimeTableModal'
import { mapExamApiToTimetableRecord } from '../../Pages/Principal/ExaminationTimetable/examinationTimetableData'
import { canUseExamsApi, getExamApi } from '../../services/examsApi'
import { examTypeLabel, forwardExamTimetable } from './examScheduleData'

/**
 * Shared exam schedule table for Teacher / Student / Coordinator.
 * @param {'view'|'forward'} mode — forward shows Approve-inbox actions for coordinator
 */
const ExamSchedulePanel = ({
    title = 'Exam Schedule',
    description = '',
    rows = [],
    loading = false,
    error = '',
    mode = 'view',
    onForwarded,
    emptyMessage = 'No exam timetables to show yet.',
}) => {
    const [selected, setSelected] = useState(null)
    const [viewLoadingId, setViewLoadingId] = useState(null)
    const displayRows = useMemo(() => rows, [rows])

    const openTimetable = async (exam) => {
        const fallback = exam.record
            ? { ...exam.record, examName: exam.record.examName || exam.name }
            : { ...exam, examName: exam.name }
        const hasTimelines = Array.isArray(fallback.timelines) && fallback.timelines.length > 0
        if (hasTimelines || !canUseExamsApi()) {
            setSelected(fallback)
            return
        }
        setViewLoadingId(exam.id)
        try {
            const detail = await getExamApi(exam.id)
            setSelected(mapExamApiToTimetableRecord(detail))
        } catch (err) {
            setSelected(fallback)
            if (!fallback.timelines?.length) {
                toast.error(err?.message || 'Could not load exam timetable details.')
            }
        } finally {
            setViewLoadingId(null)
        }
    }

    const handleForward = (row) => {
        forwardExamTimetable(row.id, 'Coordinator')
        toast.success('Timetable forwarded to teachers and students of this grade.')
        onForwarded?.(row.id)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-8 space-y-4'>
                <div>
                    <h2 className='text-xl font-semibold text-black'>{title}</h2>
                    {description ? (
                        <p className='text-sm text-[#667085] mt-2'>{description}</p>
                    ) : null}
                </div>

                {loading && <p className='text-sm text-[#667085]'>Loading exams…</p>}
                {error && <p className='text-sm text-[#B42318]'>{error}</p>}
                {!loading && !error && displayRows.length === 0 && (
                    <p className='text-sm text-[#667085]'>{emptyMessage}</p>
                )}

                {!loading && displayRows.length > 0 && (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5]'>
                                <tr>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Type</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Academic Year</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Start</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>End</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>
                                        {mode === 'forward' ? 'Actions' : 'View Timetable'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayRows.map((exam) => (
                                    <tr key={exam.id} className='border-b border-[#f2f4f7] text-[#667085]'>
                                        <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{exam.name}</td>
                                        <td className='px-3 py-3'>
                                            {exam.examTypeLabel || examTypeLabel(exam.examType) || exam.examType || '—'}
                                        </td>
                                        <td className='px-3 py-3'>{exam.academicYear || '—'}</td>
                                        <td className='px-3 py-3'>
                                            {[exam.className, exam.section].filter(Boolean).join(' · ') || '—'}
                                        </td>
                                        <td className='px-3 py-3'>{exam.startDate || '—'}</td>
                                        <td className='px-3 py-3'>{exam.endDate || '—'}</td>
                                        <td className='px-3 py-3'>
                                            <div className='flex flex-wrap gap-2'>
                                                <button
                                                    type='button'
                                                    disabled={viewLoadingId === exam.id}
                                                    onClick={() => openTimetable(exam)}
                                                    className='inline-flex items-center gap-1 bg-[#515DEF] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 cursor-pointer disabled:opacity-60'
                                                >
                                                    <Eye size={14} />
                                                    {viewLoadingId === exam.id ? 'Loading…' : 'View Timetable'}
                                                </button>
                                                {mode === 'forward' && (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleForward(exam)}
                                                        className='inline-flex items-center bg-[#4CAF50] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 cursor-pointer'
                                                    >
                                                        Forward to Class
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <TimeTableModal
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                record={selected}
            />
        </section>
    )
}

export default ExamSchedulePanel
