import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { getClosedActions, statusBadgeColor } from './actionsReportsData'

const ClosedActionsReport = () => {
    const location = useLocation()
    const [records, setRecords] = useState(() => getClosedActions())
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        setRecords(getClosedActions())
    }, [location.pathname])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-8'>
                <p className='text-sm text-[#667085]'>
                    Completed corrective actions with closure details and resolution time.
                </p>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Closed Actions</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right min-w-[800px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Observation</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Department</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Closed By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Closed Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Days Taken</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-2 py-4 rounded-s-lg max-w-[200px]'>
                                        <span className='block text-xs text-[#515DEF]'>{record.observationId}</span>
                                        <span className='block font-medium text-[#1E1E1E] truncate' title={record.observation}>{record.observation}</span>
                                    </td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.department}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.closedBy}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.closedDate}</td>
                                    <td className='px-2 py-4 whitespace-nowrap font-semibold text-[#515DEF]'>{record.daysTaken} days</td>
                                    <td className='px-2 py-4 rounded-e-lg'>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {records.length} of {records.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default ClosedActionsReport
