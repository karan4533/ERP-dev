import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { useAuth } from '../../../context/AuthContext'
import {
    getMyGateDuties,
    hydrateGateDutyAssignmentsFromApi,
} from '../../GateKeeperManager/AssignDuty/gateDutyData'

const MyDuty = () => {
    const { name, email } = useAuth()
    const scope = {
        gateKeeperName: name || '',
        // Prefer login email — server also filters gate-duty-assignments by assigneeEmail.
        employeeId: email || '',
        email: email || '',
    }
    const [rows, setRows] = useState(() => getMyGateDuties(scope))
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        hydrateGateDutyAssignmentsFromApi().finally(() => setRows(getMyGateDuties(scope)))
        // Re-filter when signed-in identity is available.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, email])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => { setFromDate(null); setToDate(null) }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input type="text" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>My Duty List</h2>
                    <p className='text-xs text-[#667085]'>Same collection as Gate Keeper Manager → Assign Duty (`gate-duty-assignments`).</p>
                    <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Duty ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Duty Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Shift</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Gate Location</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Start Time</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">End Time</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Assigned By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-2 py-8 text-center text-[#667085]">
                                        No duty assigned yet. Gate Keeper Manager must assign you from Assign Duty.
                                    </td>
                                </tr>
                            ) : rows.map((row) => (
                                <tr key={row.id || row.dutyId} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 rounded-s-lg">{row.dutyId || row.id}</td>
                                    <td className="px-2 py-4">{row.dutyDate}</td>
                                    <td className="px-2 py-4">{row.shift}</td>
                                    <td className="px-2 py-4">{row.gateLocation}</td>
                                    <td className="px-2 py-4">{row.startTime}</td>
                                    <td className="px-2 py-4">{row.endTime}</td>
                                    <td className="px-2 py-4 rounded-e-lg">{row.assignedBy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {rows.length ? 1 : 0} to {rows.length} of {rows.length} entries
                </p>
                <div className="flex justify-center gap-x-2 flex-wrap">
                    <button type='button' className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer">
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer">1</button>
                    <button type='button' className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='myduty'
                title='MyDuty'
                rows={Array.isArray(rows) ? rows : []}
                exportDescription={<>You are exporting {Array.isArray(rows) ? rows.length : 0} record(s).</>}
            />
        </section>
    )
}

export default MyDuty
