import React from 'react'
import { X } from 'lucide-react'
import ExamTimeTable from '../../../Principal/ExaminationTimetable/Components/ExamTimeTable'

const ExamTimeTableModal = ({ open, onClose, examName, timetable }) => {
    if (!open) return null

    const hasTimetable = timetable?.timeSlots?.length > 0 && timetable?.days?.length > 0

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} />

            <div className='relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-lg overflow-hidden'>
                <div className='flex justify-between items-center px-5 py-4 border-b border-[#EEF0F6]'>
                    <div>
                        <h3 className='text-xl font-semibold text-[#0C1E5B]'>Examination Timetable</h3>
                        {examName && (
                            <p className='text-sm text-[#667085] mt-0.5'>{examName}</p>
                        )}
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='p-1 rounded-lg hover:bg-[#EDEEF5] text-[#667085] hover:text-[#F44336] cursor-pointer'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='overflow-y-auto p-5'>
                    {hasTimetable ? (
                        <ExamTimeTable
                            days={timetable.days}
                            timeSlots={timetable.timeSlots}
                            schedule={timetable.schedule}
                            subjectColors={timetable.subjectColors}
                        />
                    ) : (
                        <div className='text-center py-12 text-[#667085] text-sm'>
                            No timetable subjects added for this exam schedule.
                        </div>
                    )}
                </div>

                <div className='px-5 py-4 border-t border-[#EEF0F6] bg-[#FAFBFD]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='w-full bg-[#515DEF] text-white text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ExamTimeTableModal
