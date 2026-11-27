import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Plus, Download } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'
import { canUseAcademicsApi } from '../../../services/academicsApi'
import { classKeysMatch } from '../../../Common/Teacher/teacherAssignedClasses'
import { useTeacherAssignments } from '../../../Common/Teacher/useTeacherAssignments'
import {
    deleteOnlineClass,
    getOnlineClasses,
    hydrateOnlineClassesFromApi,
    ONLINE_CLASS_STATUSES,
    ONLINE_CLASSES_UPDATED_EVENT,
    statusBadgeColor,
} from './onlineClassData'

const OnlineClass = ({
    canCreate = true,
    listPath = '/teacher/class/online-class',
    addPath = '/teacher/class/online-class/add',
    viewPath = '/teacher/class/online-class/view',
}) => {
    const location = useLocation()
    const { role } = useAuth()
    const showDelete = canShowDeleteOption(role)
    const api = canUseAcademicsApi()
    const assignments = useTeacherAssignments()
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [search, setSearch] = useState('')
    const [subjectFilter, setSubjectFilter] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [rows, setRows] = useState(() => getOnlineClasses())
    const [loading, setLoading] = useState(api)

    const classOptions = assignments.classes
    const sectionOptions = assignments.sectionsFor(classFilter)
    const subjectOptions = assignments.subjects

    const refresh = () => setRows(getOnlineClasses())

    useEffect(() => {
        let cancelled = false
        setLoading(api)
        hydrateOnlineClassesFromApi().finally(() => {
            if (cancelled) return
            refresh()
            setLoading(false)
        })
        const onUpdate = () => refresh()
        window.addEventListener(ONLINE_CLASSES_UPDATED_EVENT, onUpdate)
        return () => {
            cancelled = true
            window.removeEventListener(ONLINE_CLASSES_UPDATED_EVENT, onUpdate)
        }
    }, [api, location.key])

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase()
        const email = assignments.profile.email
        return rows.filter((record) => {
            if (assignments.ready && assignments.assignments.length) {
                const inAssignedClass = assignments.assignments.some(
                    (row) =>
                        classKeysMatch(row.className, record.className) &&
                        (!row.section || !record.section || row.section === record.section),
                )
                const mine = !record.teacherEmail || record.teacherEmail === email
                if (!inAssignedClass || !mine) return false
            }
            if (subjectFilter && record.subject !== subjectFilter) return false
            if (classFilter && !classKeysMatch(classFilter, record.className)) return false
            if (sectionFilter && record.section !== sectionFilter) return false
            if (statusFilter && record.status !== statusFilter) return false
            if (!query) return true
            const haystack = `${record.onlineClassId} ${record.topic} ${record.subject} ${record.meetingPlatform}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [rows, assignments, search, subjectFilter, classFilter, sectionFilter, statusFilter])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setSubjectFilter('')
                            setClassFilter('')
                            setSectionFilter('')
                            setStatusFilter('')
                            setFromDate(null)
                            setToDate(null)
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <p className='text-sm text-[#667085]'>
                        {assignments.emptyReason ||
                            (api
                                ? 'Campus online-class list scoped to your assigned classes.'
                                : 'Browser store (API off).')}
                    </p>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Online class ID, topic...' className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Subject</label>
                        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {subjectOptions.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            value={classFilter}
                            onChange={(e) => {
                                setClassFilter(e.target.value)
                                setSectionFilter('')
                            }}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                            disabled={!classOptions.length}
                        >
                            <option value=''>All assigned</option>
                            {classOptions.map((item) => (
                                <option key={item} value={item}>Class {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Section</label>
                        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {sectionOptions.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {ONLINE_CLASS_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Online Class List</h2>
                    <div className='flex gap-x-2'>
                        {canCreate ? (
                            <NavLink to={addPath} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                                <Plus size={16} />
                                Add Online Class
                            </NavLink>
                        ) : null}
                        <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Online Class ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Topic</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Platform</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Link</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading || !assignments.ready ? (
                                <tr><td colSpan={12} className='px-2 py-10 text-center text-[#667085]'>Loading online classes…</td></tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className='px-2 py-10 text-center text-[#667085]'>
                                        {assignments.emptyReason || 'No online classes yet. Use Add Online Class to create one.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.onlineClassId}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.subject}</td>
                                        <td className='px-2 py-4'>{record.className}</td>
                                        <td className='px-2 py-4'>{record.section}</td>
                                        <td className='px-2 py-4 max-w-xs'>{record.topic}</td>
                                        <td className='px-2 py-4'>{record.date}</td>
                                        <td className='px-2 py-4'>{record.startTime}</td>
                                        <td className='px-2 py-4'>{record.endTime}</td>
                                        <td className='px-2 py-4'>{record.meetingPlatform}</td>
                                        <td className='px-2 py-4 max-w-xs truncate' title={record.meetingLink}>{record.meetingLink}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[record.status] || ''}`}>{record.status}</span>
                                        </td>
                                        <td className='px-2 py-4 text-center'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink to={`${viewPath}/${record.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>View</NavLink>
                                                {canCreate ? (
                                                    <button type='button' onClick={() => { if (showDelete) setDeleteTarget(record) }} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Delete</button>
                                                ) : null}
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
                <p className='text-sm font-medium text-[#515DEF]'>Showing {filteredRows.length} of {rows.length} entries</p>
                <div className='flex gap-x-2'>
                    <button type='button' className='size-8 flex justify-center items-center bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full'><ChevronLeft size={16} /></button>
                    <button type='button' className='size-8 flex justify-center items-center bg-[#515DEF] text-white border border-[#515DEF] rounded-full'>1</button>
                    <button type='button' className='size-8 flex justify-center items-center bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full'><ChevronRight size={16} /></button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} filename='online-class' rows={filteredRows} exportDescription={<>You are exporting {filteredRows.length} record(s).</>} />
            <DeleteRequestModal
                deleteRequestModal={Boolean(deleteTarget)}
                setDeleteRequestModal={(open) => { if (!open) setDeleteTarget(null) }}
                onConfirm={() => {
                    if (deleteTarget) deleteOnlineClass(deleteTarget.id)
                    setDeleteTarget(null)
                    refresh()
                }}
                title='Delete Online Class?'
                message='This removes the session from the campus online-class list.'
                confirmLabel='Delete'
            />
        </section>
    )
}

export default OnlineClass
