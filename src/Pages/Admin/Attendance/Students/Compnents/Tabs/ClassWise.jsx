import React, { useState } from 'react'
import { Download } from 'lucide-react'
import ExportModal from '../../../../../../Common/CommonComponents/ExportModal';

const ClassWise = () => {

    const [exportModal, setExportModal] = useState(false)

    return (
        <div>
            <h2 className='text-xl font-medium text-black mb-4'>Class Wise Attendance</h2>
            <div className='flex justify-between sm:items-center items-stretch sm:flex-row flex-col gap-y-2 mb-4'>
                <div className='flex gap-x-2 items-center my-2'>
                    <select name="" id="" className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="40">40</option>
                        <option value="50">50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <button onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-center text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex justify-center items-center gap-x-2 sm:w-fit w-full'>
                    <Download size={16} />
                    Export
                </button>
            </div>

            <div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr className='rounded-lg'>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Class</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Section</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Attendance</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Percentage</th>
                            </tr>
                        </thead>

                        <tbody>
                            {Array.from({ length: 8 }).map((_, index) => (
                                <tr key={index} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg">
                                    <td className="px-2 py-4 rounded-s-lg">10</td>
                                    <td className="px-2 py-4">A</td>
                                    <td className="px-2 py-4">45</td>
                                    <td className="px-2 py-4 rounded-e-lg">
                                        82%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </div>
    )
}

export default ClassWise