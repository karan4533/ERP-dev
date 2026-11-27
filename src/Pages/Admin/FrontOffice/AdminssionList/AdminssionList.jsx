import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import ListPagination, { PageSizeSelect } from '../../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../../Common/useListPagination'
import { filterListRows } from '../../../../Common/listFiltering'
import EditRequestModal from '../../../../Common/CommonComponents/EditRequestModal'
import {
    admissionFinanceBlockReason,
    deleteAdmission,
    enrollAdmissionAsStudent,
    filterAdmissions,
    getAdmissionEditPath,
    getAdmissionProfileImage,
    getAdmissionViewPath,
    getAllAdmissions,
    getStudentDisplayName,
} from './admissionListData'
import { getAddAdmissionPath, isAdminFrontOfficePath } from '../AdmissionEnquiry/admissionEnquiryData'
import { canShowDeleteOption } from '../../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../../context/AuthContext'

const AdminssionList = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const { pathname } = useLocation()
    const isAdminView = isAdminFrontOfficePath(pathname)
    const addAdmissionPath = getAddAdmissionPath(pathname)
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [records, setRecords] = useState([])

    const refresh = async () => {
        const rows = await getAllAdmissions()
        setRecords(rows)
    }

    useEffect(() => {
        refresh()
    }, [])

    const statusOptions = useMemo(
        () => [...new Set(records.map((record) => record.status).filter(Boolean))].sort(),
        [records],
    )

    const filteredRecords = useMemo(
        () => filterListRows(filterAdmissions(records, { search }), {
            equals: { status },
            fromDate,
            toDate,
            dateKeys: ['createdDate', 'admissionDate'],
        }),
        [records, search, status, fromDate, toDate],
    )

    const pagination = useListPagination(filteredRecords, {
        resetKey: [search, status, fromDate?.getTime(), toDate?.getTime()].join('|'),
    })
    const visibleRecords = pagination.rows

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
    }

    const handleDelete = async (id) => {
        if (!showDelete) return
        const result = await deleteAdmission(id)
        if (!result.success) {
            toast.error(result.message || 'Delete failed.')
            return
        }
        await refresh()
        toast.success('Admission removed.')
    }

    const handleEnroll = async (record) => {
        const financeBlock = admissionFinanceBlockReason(record)
        if (financeBlock) {
            toast.error(financeBlock)
            return
        }
        const email = record.parentAccountEmail || ''
        if (!email) {
            toast.error('Set Parent Username / Email on the admission before enrolling.')
            return
        }
        const entered = window.prompt(
            `Create parent login for ${email}.\nEnter a temporary parent password (min 10 characters, with a letter and a number). The parent must change it at first login:`,
            '',
        )
        if (entered == null) return
        const password = String(entered).trim()
        if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            toast.error('Parent password must be at least 10 characters and contain a letter and a number.')
            return
        }

        const result = await enrollAdmissionAsStudent(record.id, {
            parentAccountEmail: email,
            parentAccountPassword: password,
        })
        if (!result.success) {
            toast.error(result.message)
            return
        }
        await refresh()
        if (result.parentCreated) {
            toast.success(`${getStudentDisplayName(record)} enrolled. Parent: ${email}`)
        } else if (result.parentMapped) {
            toast.success(`${getStudentDisplayName(record)} enrolled and linked to existing parent account.`)
        } else {
            toast.success(`${getStudentDisplayName(record)} enrolled as student.`)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Name, admission no., class...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {statusOptions.map((item) => (
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
                    <h2 className='text-xl font-medium text-black'>Admissions</h2>
                    <div className='flex gap-x-2'>
                        {!isAdminView && (
                            <NavLink
                                to={addAdmissionPath}
                                className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                            >
                                <Plus size={16} />
                                Add Admission
                            </NavLink>
                        )}
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

                {filteredRecords.length === 0 ? (
                    records.length ? (
                        <div className='py-16 text-center'>
                            <h3 className='text-lg font-semibold text-[#0C1E5B]'>No records match the filters.</h3>
                        </div>
                    ) : (
                        <div className='py-16 text-center'>
                            <h3 className='text-lg font-semibold text-[#0C1E5B]'>No admissions yet</h3>
                            <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>
                                Create an admission to see records here.
                            </p>
                        </div>
                    )
                ) : (
                    <>
                        <PageSizeSelect pagination={pagination} className='my-2' />
                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left rtl:text-right'>
                                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                    <tr className='rounded-lg'>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Profile</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Roll No</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission Number</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gender</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Created Date</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Country</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>City</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleRecords.map((record) => (
                                        <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                            <td className='px-2 py-4 object-cover flex justify-center rounded-s-lg'>
                                                <img
                                                    src={getAdmissionProfileImage(record)}
                                                    alt={getStudentDisplayName(record)}
                                                    className='w-9 h-9 rounded-full object-cover'
                                                />
                                            </td>
                                            <td className='px-2 py-4'>{getStudentDisplayName(record)}</td>
                                            <td className='px-2 py-4'>{record.rollNumber || '—'}</td>
                                            <td className='px-2 py-4'>{record.className || '—'}</td>
                                            <td className='px-2 py-4'>{record.admissionNumber || '—'}</td>
                                            <td className='px-2 py-4'>{record.gender || '—'}</td>
                                            <td className='px-2 py-4'>{record.mobileNumber || '—'}</td>
                                            <td className='px-2 py-4'>{record.createdDate || '—'}</td>
                                            <td className='px-2 py-4'>{record.country || '—'}</td>
                                            <td className='px-2 py-4'>{record.city || '—'}</td>
                                            <td className='px-2 py-4 text-center rounded-e-lg'>
                                                {/* Once enrolled, the record lives in the Student Database; the admission is closed. */}
                                                {record.status === 'Enrolled' ? (
                                                    <span className='text-xs font-medium text-[#027A48] whitespace-nowrap' title='Managed in the Student Database'>
                                                        Enrolled
                                                    </span>
                                                ) : (
                                                <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                    <NavLink
                                                        to={getAdmissionViewPath(pathname, record.id)}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        View
                                                    </NavLink>
                                                    {!isAdminView && (
                                                        <>
                                                            <NavLink
                                                                to={getAdmissionEditPath(pathname, record.id)}
                                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                            >
                                                                Edit
                                                            </NavLink>
                                                            {showDelete ? (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => handleDelete(record.id)}
                                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                                >
                                                                    Delete
                                                                </button>
                                                            ) : null}
                                                            <button
                                                                type='button'
                                                                onClick={() => handleEnroll(record)}
                                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                            >
                                                                Enroll as Student
                                                            </button>
                                                        </>
                                                    )}
                                                </Dropdown>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <ListPagination pagination={pagination} />
                    </>
                )}
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='adminssion-list'
                rows={Array.isArray(filteredRecords) ? filteredRecords : []}
                exportDescription={<>You are exporting {Array.isArray(filteredRecords) ? filteredRecords.length : 0} record(s).</>}
            />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
        </section>
    )
}

export default AdminssionList
