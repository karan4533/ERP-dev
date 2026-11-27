import React, { useEffect, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import noProfile from '../../../assets/images/no-profile.png'
import { isApiStudentsEnabled } from '../../../services/apiClient'
import { listStaffParentsApi } from '../../../services/parentsStaffApi'
import { getParentsList } from './parentsListData'

const ParentsList = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [rows, setRows] = useState(() => (isApiStudentsEnabled() ? [] : getParentsList()))
    const [loading, setLoading] = useState(isApiStudentsEnabled())
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    useEffect(() => {
        let cancelled = false
        if (!isApiStudentsEnabled()) {
            setRows(getParentsList())
            setError('')
            setLoading(false)
            return undefined
        }
        setLoading(true)
        setError('')
        listStaffParentsApi()
            .then((list) => {
                if (cancelled) return
                const mapped = (Array.isArray(list) ? list : []).map((row, index) => ({
                    id: row.id || row.studentId || `parent-${index}`,
                    parentProfile: row.parentProfile || '',
                    parentName: row.parentName || '—',
                    parentEmail: row.parentEmail || '—',
                    mobileNumber: row.mobileNumber || '—',
                    studentName: row.studentName || '—',
                    className: row.className || '',
                    section: row.section || '',
                    admissionNumber: row.admissionNumber || '—',
                }))
                setRows(mapped)
            })
            .catch((err) => {
                if (!cancelled) {
                    setRows(getParentsList())
                    setError(err.message || 'Failed to load parents from API; showing local parent accounts.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const filteredRows = rows.filter((parent) => {
        const query = search.trim().toLowerCase()
        if (!query) return true
        return `${parent.parentName} ${parent.studentName} ${parent.parentEmail} ${parent.admissionNumber}`
            .toLowerCase()
            .includes(query)
    })

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input type='text' id='search' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Parent name, student name...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
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
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Parents List</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Parents of students in your grade band and teaching allocations.
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                {error && <p className='text-sm text-[#F44336] mb-3'>{error}</p>}
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase text-center rounded-s-lg'>Parent Profile</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Parent Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Parent Email</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Admission Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={7} className='px-2 py-10 text-center text-[#667085]'>
                                        Loading parents…
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className='px-2 py-10 text-center text-[#667085]'>
                                        No parents in your scope yet.
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredRows.map((parent) => (
                                <tr key={parent.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 flex justify-center rounded-s-lg'>
                                        <img
                                            src={parent.parentProfile || noProfile}
                                            alt={parent.parentName}
                                            className='w-9 h-9 rounded-full object-cover'
                                        />
                                    </td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{parent.parentName}</td>
                                    <td className='px-2 py-4'>{parent.parentEmail}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{parent.mobileNumber}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{parent.studentName}</td>
                                    <td className='px-2 py-4'>
                                        {parent.className}
                                        {parent.section ? `-${parent.section}` : ''}
                                    </td>
                                    <td className='px-2 py-4 rounded-e-lg'>{parent.admissionNumber}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {loading || filteredRows.length === 0
                        ? 'Showing 0 entries'
                        : `Showing 1 to ${filteredRows.length} of ${filteredRows.length} entries`}
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

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='parentslist'
                title='ParentsList'
                rows={Array.isArray(filteredRows) ? filteredRows : []}
                exportDescription={<>You are exporting {Array.isArray(filteredRows) ? filteredRows.length : 0} record(s).</>}
            />
        </section>
    )
}

export default ParentsList
