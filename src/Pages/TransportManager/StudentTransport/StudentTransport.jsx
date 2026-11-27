import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, EllipsisIcon, Plus, Download } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ListPagination, { PageSizeSelect } from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import { filterListRows } from '../../../Common/listFiltering'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'
import { toast } from 'react-toastify'
import {
    CLASS_SECTIONS,
    deleteStudentTransport,
    getStudentTransports,
    hydrateStudentTransportsFromApi,
} from './studentTransportData'
import { ensureClassCatalogHydrated } from '../../../services/classDetailsApi'
import { CLASS_CATALOG_UPDATED_EVENT } from '../../../Common/RBAC/academicsCatalogData'

const StudentTransport = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const [studentTransports, setStudentTransports] = useState(() => getStudentTransports())
    const [catalogTick, setCatalogTick] = useState(0)
    useEffect(() => {
        hydrateStudentTransportsFromApi().finally(() => setStudentTransports(getStudentTransports()))
        ensureClassCatalogHydrated()
        const refresh = () => setCatalogTick((value) => value + 1)
        window.addEventListener(CLASS_CATALOG_UPDATED_EVENT, refresh)
        return () => window.removeEventListener(CLASS_CATALOG_UPDATED_EVENT, refresh)
    }, [])
    void catalogTick

    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [classSection, setClassSection] = useState('')
    const [exportModal, setExportModal] = useState(false)

    const filteredTransports = useMemo(
        () => filterListRows(studentTransports, {
            search,
            searchKeys: ['studentId', 'studentName', 'classSection', 'admissionNumber', 'routeName', 'startLocation', 'endLocation', 'vehicleNumber', 'supportStaff', 'driverName', 'driverContact'],
            equals: { classSection },
            fromDate,
            toDate,
            dateKeys: ['createdDate'],
        }),
        [studentTransports, search, classSection, fromDate, toDate],
    )
    const pagination = useListPagination(filteredTransports, {
        resetKey: [search, classSection, fromDate?.getTime(), toDate?.getTime()].join('|'),
    })

    const clearFilters = () => {
        setSearch('')
        setClassSection('')
        setFromDate(null)
        setToDate(null)
    }
    const [deleteModal, setDeleteModal] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const openDelete = (recordId) => {
        if (!showDelete) return
        setPendingDeleteId(recordId)
        setDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!showDelete || !pendingDeleteId || deleting) return
        setDeleting(true)
        const result = await deleteStudentTransport(pendingDeleteId)
        setDeleting(false)
        setDeleteModal(false)
        setPendingDeleteId(null)
        if (result?.success === false) {
            toast.error(result.message || 'Could not delete record.')
            return
        }
        setStudentTransports(getStudentTransports())
        toast.success(result?.api ? 'Record deleted from campus API.' : 'Record deleted.')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input type='text' id='search' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Student ID, name, route...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class & Section</label>
                        <select id='class-filter' value={classSection} onChange={(e) => setClassSection(e.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {CLASS_SECTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
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
                    <h2 className='text-xl font-medium text-black'>Student Transport</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/transport-manager/student-transport/add'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add Student Transport
                        </NavLink>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <PageSizeSelect pagination={pagination} className='my-2' />
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Student ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Route Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Support Staff</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Contact</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Created Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransports.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className='px-2 py-8 text-center text-[#667085]'>{emptyListMessage(studentTransports.length)}</td>
                                </tr>
                            ) : null}
                            {pagination.rows.map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.studentId}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.studentName}</td>
                                    <td className='px-2 py-4'>{record.classSection}</td>
                                    <td className='px-2 py-4'>{record.admissionNumber}</td>
                                    <td className='px-2 py-4'>{record.routeName}</td>
                                    <td className='px-2 py-4'>{record.startLocation}</td>
                                    <td className='px-2 py-4'>{record.endLocation}</td>
                                    <td className='px-2 py-4'>{record.vehicleNumber}</td>
                                    <td className='px-2 py-4'>{record.supportStaff}</td>
                                    <td className='px-2 py-4'>{record.driverName}</td>
                                    <td className='px-2 py-4'>{record.driverContact}</td>
                                    <td className='px-2 py-4'>{record.createdDate}</td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`/transport-manager/student-transport/view/${record.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                View
                                            </NavLink>
                                            <NavLink
                                                to={`/transport-manager/student-transport/edit/${record.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                Edit
                                            </NavLink>
                                            {showDelete ? (
                                                <button
                                                    type='button'
                                                    onClick={() => openDelete(record.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Delete
                                                </button>
                                            ) : null}
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination pagination={pagination} />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='studenttransport'
                title='StudentTransport'
                rows={filteredTransports}
                exportDescription={<>You are exporting {filteredTransports.length} record(s).</>}
            />
            <DeleteRequestModal
                deleteRequestModal={deleteModal}
                setDeleteRequestModal={setDeleteModal}
                onConfirm={handleConfirmDelete}
                title='Delete Student Transport?'
                message='This will permanently remove this student transport record. This action cannot be undone.'
                confirmLabel={deleting ? 'Deleting…' : 'Delete'}
            />
        </section>
    )
}

export default StudentTransport
