import React, { useMemo } from 'react'
import { X } from 'lucide-react'
import ClassTimeTableGrid from './ClassTimeTableGrid'
import { buildClassGridFromTimelines, getClassSectionLabel } from '../classTimetableData'

const ClassTimeTableModal = ({ open, onClose, record }) => {
    const gridProps = useMemo(
        () => (record ? buildClassGridFromTimelines(record.timelines) : null),
        [record],
    )

    if (!open || !record) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} />
            <div className='relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg p-5 py-4'>
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-xl font-medium text-[#1E1E1E]'>
                        {getClassSectionLabel(record)} Timetable
                    </h3>
                    <button type='button' onClick={onClose} className='hover:text-red-500 cursor-pointer'>
                        <X />
                    </button>
                </div>

                {gridProps && (
                    <ClassTimeTableGrid
                        days={gridProps.days}
                        timeSlots={gridProps.timeSlots}
                        schedule={gridProps.schedule}
                    />
                )}
            </div>
        </div>
    )
}

export default ClassTimeTableModal
