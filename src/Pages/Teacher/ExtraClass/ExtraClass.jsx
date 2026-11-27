import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Plus, Download } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'
import { useEditRequestFlow } from '../../../Common/CommonComponents/useEditRequestFlow'
import { canUseAcademicsApi } from '../../../services/academicsApi'
import {
    EXTRA_CLASSES_UPDATED_EVENT,
    deleteExtraClass,
    getExtraClasses,
    hydrateExtraClassesFromApi,
    SUBJECTS,
    CLASSES,
    SECTIONS,
} from './extraClassData'

const ExtraClass = ({
    canCreate = false,
    listPath = '/teacher/class/extra-class',
    addPath = '/teacher/class/extra-class/add',
    viewPath = '/teacher/class/extra-class/view',
    editPath = '/teacher/class/extra-class/edit',
}) => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const { editRequestModal, setEditRequestModal, requestEdit, confirmEditRequest } = useEditRequestFlow()
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const { role } = useAuth()
    const showDelete = canShowDeleteOption(role)
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const requestDelete = (record) => {
        if (!showDelete || !record) return
        setPendingDelete(record)
        setDeleteRequestModal(true)
    }

    const confirmDelete = async () => {
        const target = pendingDelete
        setDeleteRequestModal(false)
        if (!target || deleting) return
        setDeleting(true)
        try {
            await deleteExtraClass(target.id)
            toast.success(`Extended class ${target.extraClassId || target.id} deleted.`)
        } catch (err) {
            toast.error(err?.message || 'Could not delete extended class.')
        } finally {
            setPendingDelete(null)
            setDeleting(false)
            setRows(getExtraClasses())
        }
    }

    useEffect(() => {
        let cancelled = false
        const refresh = () => {
            if (!cancelled) setRows(getExtraClasses())
        }
        setLoading(true)
        setError('')
        ;(async () => {
            if (canUseAcademicsApi()) {
                const ok = await hydrateExtraClassesFromApi()
                if (!ok && !cancelled) setError('Could not load extended classes from the campus API.')
            }
            if (!cancelled) {
                setRows(getExtraClasses())
                setLoading(false)
            }
        })()
        window.addEventListener(EXTRA_CLASSES_UPDATED_EVENT, refresh)
        return () => {
            cancelled = true
            window.removeEventListener(EXTRA_CLASSES_UPDATED_EVENT, refresh)
        }
    }, [])

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
                        <input type='text' id='search' placeholder='Extended class ID, topic...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='subject-filter' className='text-base font-medium text-[#808080]'>Subject</label>
                        <select id='subject-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select id='class-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {CLASSES.map((item) => (
                                <option key={item} value={item}>Class {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select id='section-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {SECTIONS.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
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
                    <h2 className='text-xl font-medium text-black'>Extended Class List</h2>
                    <div className='flex gap-x-2'>
                        {canCreate && (
                        <NavLink
                            to={addPath}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add Extended Class
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
                {error && <p className='text-sm text-[#B54708] mb-3'>{error}</p>}
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                {loading ? (
                    <p className='text-sm text-[#667085] py-8 text-center'>Loading…</p>
                ) : (
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Extended Class ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Topic</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Venue</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Reason</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={10} className='px-2 py-10 text-center text-[#667085]'>
                                        No extended classes yet.
                                    </td>
                                </tr>
                            )}
                            {rows.map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.extraClassId}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.subject}</td>
                                    <td className='px-2 py-4'>{record.classSection}</td>
                                    <td className='px-2 py-4 max-w-xs'>{record.topic}</td>
                                    <td className='px-2 py-4'>{record.date}</td>
                                    <td className='px-2 py-4'>{record.startTime}</td>
                                    <td className='px-2 py-4'>{record.endTime}</td>
                                    <td className='px-2 py-4'>{record.venue}</td>
                                    <td className='px-2 py-4 max-w-xs'>{record.reason}</td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`${viewPath}/${record.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                View
                                            </NavLink>
                                            <button
                                                type='button'
                                                onClick={() => requestEdit({ editTo: `${editPath}/${record.id}` })}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                Edit
                                            </button>
                                            {showDelete ? (
                                                <button
                                                    type='button'
                                                    disabled={deleting || Boolean(error)}
                                                    onClick={() => requestDelete(record)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer disabled:opacity-50'
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
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {loading
                        ? 'Loading…'
                        : rows.length === 0
                            ? 'Showing 0 of 0 entries'
                            : `Showing 1 to ${rows.length} of ${rows.length} entries`}
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
                filename='extra-class'
                rows={Array.isArray(rows) ? rows : []}
                exportDescription={<>You are exporting {Array.isArray(rows) ? rows.length : 0} record(s).</>}
            />
            <EditRequestModal
                editRequestModal={editRequestModal}
                setEditRequestModal={setEditRequestModal}
                onConfirm={confirmEditRequest}
            />
            <DeleteRequestModal
                deleteRequestModal={deleteRequestModal}
                setDeleteRequestModal={(open) => {
                    setDeleteRequestModal(open)
                    if (!open && !deleting) setPendingDelete(null)
                }}
                onConfirm={confirmDelete}
                title={pendingDelete ? `Delete extended class ${pendingDelete.extraClassId || pendingDelete.id}?` : undefined}
                confirmLabel='Delete'
            />
        </section>
    )
}

export default ExtraClass
