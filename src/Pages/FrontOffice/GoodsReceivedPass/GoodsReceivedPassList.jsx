import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus, Printer } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    STATUS_OPTIONS,
    deleteGoodsReceivedPass,
    formatDisplayTime,
    getGoodsReceivedPasses,
    statusBadgeColor,
} from './goodsReceivedPassData'

const parseDate = (value) => {
    if (!value) return null
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const GoodsReceivedPassList = () => {
    const [records, setRecords] = useState(() => getGoodsReceivedPasses())
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [exportModal, setExportModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [selectedId, setSelectedId] = useState(null)

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const query = search.trim().toLowerCase()
            const matchesSearch =
                !query ||
                record.grNo.toLowerCase().includes(query) ||
                record.supplierName.toLowerCase().includes(query) ||
                record.billNo.toLowerCase().includes(query) ||
                record.createdBy.toLowerCase().includes(query)

            const matchesStatus = !statusFilter || record.status === statusFilter

            const recordDate = parseDate(record.date)
            const matchesFrom = !fromDate || (recordDate && recordDate >= fromDate)
            const matchesTo = !toDate || (recordDate && recordDate <= toDate)

            return matchesSearch && matchesStatus && matchesFrom && matchesTo
        })
    }, [records, search, statusFilter, fromDate, toDate])

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
        setFromDate(null)
        setToDate(null)
        setCurrentPage(1)
    }

    const handleDelete = () => {
        if (!selectedId) return
        deleteGoodsReceivedPass(selectedId)
        setRecords(getGoodsReceivedPasses())
        setDeleteModal(false)
        setSelectedId(null)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'><option value=''>From Beginning</option></select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input type='text' value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} placeholder='G.R. No., supplier, bill...' className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {STATUS_OPTIONS.map((status) => (<option key={status} value={status}>{status}</option>))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative'>
                            <DatePicker selected={fromDate} onChange={(date) => { setFromDate(date); setCurrentPage(1) }} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={(date) => { setToDate(date); setCurrentPage(1) }} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Goods Received Pass List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to='/front-office/add-goods-received-pass' className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Add Goods Received Pass
                        </NavLink>
                        <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className='flex gap-x-2 items-center my-2'>
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }} className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>G.R. No.</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Payment</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Supplier Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Bill No.</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Total Items</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Created By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.length === 0 ? (
                                <tr><td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>No goods received pass records found.</td></tr>
                            ) : (
                                paginatedRecords.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.grNo}</td>
                                        <td className='px-2 py-4'>{record.date}</td>
                                        <td className='px-2 py-4'>{formatDisplayTime(record.time, record.timePeriod)}</td>
                                        <td className='px-2 py-4'>{record.paymentType}</td>
                                        <td className='px-2 py-4'>{record.supplierName}</td>
                                        <td className='px-2 py-4'>{record.billNo}</td>
                                        <td className='px-2 py-4'>{record.totalItems}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status] ?? statusBadgeColor.Pending}`}>{record.status}</span>
                                        </td>
                                        <td className='px-2 py-4'>{record.createdBy}</td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink to={`/front-office/goods-received-pass/view/${record.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>View</NavLink>
                                                <NavLink to={`/front-office/goods-received-pass/edit/${record.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Edit</NavLink>
                                                <button type='button' onClick={() => { setSelectedId(record.id); setDeleteModal(true) }} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Delete</button>
                                                <NavLink to={`/front-office/goods-received-pass/view/${record.id}?print=1`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'><span className='inline-flex items-center gap-1'><Printer size={14} /> Print</span></NavLink>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing {filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} entries</p>
                <div className='flex gap-x-2'>
                    <button type='button' disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)} className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-50'><ChevronLeft size={16} /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
                        <button key={page} type='button' onClick={() => setCurrentPage(page)} className={`size-8 flex justify-center items-center p-2 border border-[#E2E8F0] rounded-full cursor-pointer ${currentPage === page ? 'bg-[#515DEF] text-white' : 'bg-white text-[#515DEF] hover:bg-[#515DEF] hover:text-white'}`}>{page}</button>
                    ))}
                    <button type='button' disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)} className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-50'><ChevronRight size={16} /></button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} exportDescription={<>You are exporting {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'} {statusFilter && <span className='text-[#515DEF]'>( Filtered: {statusFilter} )</span>}</>} />

            {deleteModal && (
                <div className='fixed inset-0 z-500 flex items-center justify-center'>
                    <div className='absolute inset-0 bg-black/40' onClick={() => setDeleteModal(false)} />
                    <div className='relative z-10 w-full max-w-md rounded-xl bg-white shadow-lg p-6'>
                        <h3 className='text-lg font-semibold text-black'>Delete Goods Received Pass?</h3>
                        <p className='text-sm text-[#667085] mt-2'>This action cannot be undone.</p>
                        <div className='flex gap-3 mt-6'>
                            <button type='button' onClick={() => setDeleteModal(false)} className='flex-1 rounded-md border border-[#D9D9D9] px-4 py-2 text-sm text-[#667085] hover:bg-[#F9FAFB] cursor-pointer'>Cancel</button>
                            <button type='button' onClick={handleDelete} className='flex-1 rounded-md bg-[#FF0000] px-4 py-2 text-sm text-white hover:opacity-90 cursor-pointer'>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default GoodsReceivedPassList
