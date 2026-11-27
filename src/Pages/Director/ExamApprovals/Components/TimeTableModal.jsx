import React from 'react'
import { X } from 'lucide-react'
import ContentAreaOverlay from '../../../../Common/CommonComponents/ContentAreaOverlay'
import ExamTimeTable from './ExamTimeTable'

const TimeTableModal = ({ timeTableModal, setTimeTableModal }) => {
    return (
        <ContentAreaOverlay
            open={Boolean(timeTableModal)}
            onClose={() => setTimeTableModal(false)}
            panelClassName='max-w-4xl'
        >
            <div className='flex justify-between items-center mb-4'>
                <h3 className='text-xl font-medium text-[#1E1E1E]'>Exam Time Table</h3>
                <button
                    type='button'
                    onClick={() => setTimeTableModal(false)}
                    className='hover:text-red-500 cursor-pointer'
                >
                    <X />
                </button>
            </div>
            <ExamTimeTable />
        </ContentAreaOverlay>
    )
}

export default TimeTableModal
