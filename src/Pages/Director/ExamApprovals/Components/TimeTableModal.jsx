import React from 'react'
import { X } from 'lucide-react'
import ExamTimeTable from './ExamTimeTable'

const TimeTableModal = ({ timeTableModal, setTimeTableModal }) => {
    return (
        <div>
            {timeTableModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setTimeTableModal(false)}
                    />

                    <div className="relative z-10 w-full max-w-4xl rounded-xl bg-white shadow-lg p-5 py-4">
                        <div className='flex justify-between items-center mb-4'>
                            <h3 className='text-xl font-medium text-[#1E1E1E]'>Exam Time Table</h3>
                            <button onClick={() => setTimeTableModal(false)} className='hover:text-red-500 cursor-pointer'>
                                <X />
                            </button>
                        </div>

                        <ExamTimeTable />
                    </div>
                </div>
            )}
        </div>
    )
}

export default TimeTableModal
