import React, { useMemo } from 'react'
import { X } from 'lucide-react'
import ContentAreaOverlay from '../../../../Common/CommonComponents/ContentAreaOverlay'
import ClassTimeTableGrid from './ClassTimeTableGrid'
import { buildClassGridFromTimelines, getClassSectionLabel } from '../classTimetableData'

const ClassTimeTableModal = ({ open, onClose, record }) => {
    const gridProps = useMemo(
        () => (record ? buildClassGridFromTimelines(record.timelines) : null),
        [record],
    )

    if (!record) return null

    const timelines = Array.isArray(record.timelines) ? record.timelines : []
    const hasRows = timelines.some((row) => row.day || row.subject)
    const hasGridData = Boolean(
        gridProps
        && Object.keys(gridProps.schedule || {}).some((key) =>
            Object.keys(gridProps.schedule[key] || {}).length > 0,
        ),
    )

    return (
        <ContentAreaOverlay open={open} onClose={onClose} panelClassName='max-w-6xl'>
            <div className='flex justify-between items-center mb-4'>
                <div>
                    <h3 className='text-xl font-medium text-[#1E1E1E]'>
                        {getClassSectionLabel(record)} Timetable
                    </h3>
                    {record.ownerTeacherName && (
                        <p className='text-sm text-[#667085] mt-1'>{record.ownerTeacherName}</p>
                    )}
                </div>
                <button type='button' onClick={onClose} className='hover:text-red-500 cursor-pointer'>
                    <X />
                </button>
            </div>

            {!hasRows && (
                <p className='text-sm text-[#667085] py-8 text-center'>
                    No periods saved for this timetable yet.
                </p>
            )}

            {hasRows && hasGridData && gridProps && (
                <ClassTimeTableGrid
                    days={gridProps.days}
                    timeSlots={gridProps.timeSlots}
                    schedule={gridProps.schedule}
                />
            )}

            {hasRows && (
                <div className={hasGridData ? 'mt-6' : ''}>
                    <h4 className='text-sm font-semibold text-[#1E1E1E] mb-2'>Period details</h4>
                    <div className='overflow-x-auto rounded-lg border border-[#E2E8F0]'>
                        <table className='w-full text-sm text-left'>
                            <thead className='bg-[#EDEEF5] text-xs text-[#0C1E5B] uppercase'>
                                <tr>
                                    <th className='px-3 py-2'>Day</th>
                                    <th className='px-3 py-2'>Class</th>
                                    <th className='px-3 py-2'>Section</th>
                                    <th className='px-3 py-2'>Subject</th>
                                    <th className='px-3 py-2'>Teacher</th>
                                    <th className='px-3 py-2'>Start</th>
                                    <th className='px-3 py-2'>End</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timelines.map((row) => (
                                    <tr key={row.id || `${row.day}-${row.subject}-${row.startTime}`} className='border-t border-[#f2f4f7]'>
                                        <td className='px-3 py-2 text-[#667085]'>{row.day || '—'}</td>
                                        <td className='px-3 py-2 text-[#667085]'>{row.className || '—'}</td>
                                        <td className='px-3 py-2 text-[#667085]'>{row.section || '—'}</td>
                                        <td className='px-3 py-2 text-[#667085]'>{row.subject || '—'}</td>
                                        <td className='px-3 py-2 text-[#667085]'>{row.teacher || '—'}</td>
                                        <td className='px-3 py-2 text-[#667085]'>{row.startTime || '—'}</td>
                                        <td className='px-3 py-2 text-[#667085]'>{row.endTime || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </ContentAreaOverlay>
    )
}

export default ClassTimeTableModal
