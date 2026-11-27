import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, EllipsisIcon, Plus, Download } from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ListPagination, { PageSizeSelect } from '../../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../../Common/useListPagination'
import { filterListRows } from '../../../../Common/listFiltering'
import ExportModal from './Components/ExportModal'
import {
    STATUS_OPTIONS,
    convertEnquiryToAdmission,
    deleteAdmissionEnquiry,
    filterAdmissionEnquiries,
    getAllAdmissionEnquiries,
    getEnquiryProfileImage,
    getEnquiryRouteBase,
    statusBadgeColor,
} from './admissionEnquiryData'
import { getAdmissionEditPath } from '../AdminssionList/admissionListData'
import { canShowDeleteOption } from '../../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../../context/AuthContext'

const AdmissionEnquiry = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const routeBase = getEnquiryRouteBase(pathname)
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [records, setRecords] = useState([])

    const refresh = async () => {
        const rows = await getAllAdmissionEnquiries()
        setRecords(rows)
    }

    useEffect(() => {
        refresh()
    }, [])

    const filteredRecords = useMemo(
        () => filterListRows(filterAdmissionEnquiries(records, { search, status }), {
            fromDate,
            toDate,
            dateKeys: ['enquiryDate', 'createdDate'],
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
        const result = await deleteAdmissionEnquiry(id)
        if (!result.success) {
            toast.error(result.message || 'Could not delete enquiry.')
            return
        }
        await refresh()
        toast.success('Enquiry closed.')
    }

    const handleConvertToAdmission = async (record) => {
        const result = await convertEnquiryToAdmission(record.id)
        if (!result.success) {
            toast.error(result.message || 'Convert failed.')
            return
        }
        await refresh()
        const admissionId = result.admission?.id
        if (!admissionId) {
            toast.error('Convert created no admission id. Open Admission List and edit the new row.')
            return
        }
        toast.success('Enquiry converted. Save parent email, then Enroll as Student from Admission List.')
        // Use edit URL (not add + location.state) so refresh still updates the converted row.
        navigate(getAdmissionEditPath(pathname, admissionId), {
            state: {
                fromEnquiryId: record.id,
                enquiry: record,
                admissionId,
                admission: result.admission,
            },
        })
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
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
                            placeholder='Name, mobile, class...'
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
                            {STATUS_OPTIONS.map((item) => (
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
                    <h2 className='text-xl font-medium text-black'>Admission Enquiry List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={`${routeBase}/add`}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add Admission Enquiry
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

                {filteredRecords.length === 0 ? (
                    records.length ? (
                        <div className='py-16 text-center'>
                            <h3 className='text-lg font-semibold text-[#0C1E5B]'>No records match the filters.</h3>
                        </div>
                    ) : (
                        <div className='py-16 text-center'>
                            <h3 className='text-lg font-semibold text-[#0C1E5B]'>No admission enquiries yet</h3>
                            <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>
                                Create an enquiry to start tracking admission leads.
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
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Source</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Enquiry Date</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gender</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Next Follow Up Date</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>City</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>State</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleRecords.map((record) => (
                                        <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                            <td className='px-2 py-4 object-cover flex justify-center rounded-s-lg'>
                                                <img src={getEnquiryProfileImage(record)} alt={record.name} className='w-9 h-9 rounded-full object-cover' />
                                            </td>
                                            <td className='px-2 py-4'>{record.name}</td>
                                            <td className='px-2 py-4'>{record.mobileNumber}</td>
                                            <td className='px-2 py-4'>{record.className || '—'}</td>
                                            <td className='px-2 py-4'>{record.source || '—'}</td>
                                            <td className='px-2 py-4'>{record.enquiryDate || '—'}</td>
                                            <td className='px-2 py-4'>{record.gender || '—'}</td>
                                            <td className='px-2 py-4'>{record.nextFollowUpDate || '—'}</td>
                                            <td className='px-2 py-4'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status] || statusBadgeColor.Active}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4'>{record.city || '—'}</td>
                                            <td className='px-2 py-4'>{record.state || '—'}</td>
                                            <td className='px-2 py-4 text-center rounded-e-lg'>
                                                <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                    <NavLink
                                                        to={`${routeBase}/view/${record.id}`}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        View
                                                    </NavLink>
                                                    <NavLink
                                                        to={`${routeBase}/edit/${record.id}`}
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
                                                        onClick={() => handleConvertToAdmission(record)}
                                                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Convert to Admission
                                                    </button>
                                                </Dropdown>
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
                filename='admission-enquiry'
                rows={Array.isArray(filteredRecords) ? filteredRecords : []}
                exportDescription={<>You are exporting {Array.isArray(filteredRecords) ? filteredRecords.length : 0} record(s).</>}
            />
        </section>
    )
}

export default AdmissionEnquiry
