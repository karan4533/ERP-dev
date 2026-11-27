import React, { useEffect, useState } from 'react'
import { canUseExamsApi, listExamsApi, mapExamFromApi } from '../../../../services/examsApi'

const ExamSchedule = () => {
    const api = canUseExamsApi()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(api)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!api) {
            setLoading(false)
            return undefined
        }
        let cancelled = false
        setLoading(true)
        listExamsApi()
            .then((data) => {
                if (!cancelled) {
                    setRows(data.map(mapExamFromApi))
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setRows([])
                    setError(err?.message || 'Could not load exams.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [api])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-8 space-y-4'>
                <div>
                    <h2 className='text-xl font-semibold text-black'>Exam Schedule</h2>
                    <p className='text-sm text-[#667085] mt-2'>
                        Campus exams from GET /exams (exams.read). Teachers can view schedules; create stays with coordinator/principal where exams.write applies.
                    </p>
                </div>
                {!api && (
                    <p className='text-sm text-[#667085]'>Sign in with API auth to load live exam schedules.</p>
                )}
                {api && loading && <p className='text-sm text-[#667085]'>Loading exams…</p>}
                {api && error && <p className='text-sm text-[#B42318]'>{error}</p>}
                {api && !loading && !error && rows.length === 0 && (
                    <p className='text-sm text-[#667085]'>No exams published yet.</p>
                )}
                {api && !loading && rows.length > 0 && (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5]'>
                                <tr>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Type</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Start</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>End</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((exam) => (
                                    <tr key={exam.id} className='border-b border-[#f2f4f7] text-[#667085]'>
                                        <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{exam.name}</td>
                                        <td className='px-3 py-3'>{exam.examType}</td>
                                        <td className='px-3 py-3'>{exam.className}</td>
                                        <td className='px-3 py-3'>{exam.startDate}</td>
                                        <td className='px-3 py-3'>{exam.endDate}</td>
                                        <td className='px-3 py-3'>{exam.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    )
}

export default ExamSchedule
