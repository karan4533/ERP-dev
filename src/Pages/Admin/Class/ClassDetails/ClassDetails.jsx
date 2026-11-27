import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import { EllipsisIcon, Plus, Download } from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import ListPagination, { PageSizeSelect } from '../../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../../Common/useListPagination'
import EditRequestModal from '../../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal'
import { canShowDeleteOption } from '../../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../../context/AuthContext'
import {
    getClassDetails,
    removeClassDetails,
} from '../../../../Common/RBAC/academicsCatalogData'
import { deleteClass, setClassActive } from '../../../../services/classDetailsApi'
import EditClassModal from './Components/EditClassModal'
import { useClassDirectory } from './useClassDirectory'

const CONFIRM_COPY = {
    deactivate: {
        title: 'Deactivate class?',
        message: (record) => `${record.className} (${record.academicYear}) will disappear from class lists and dropdowns. Its students, attendance and other records stay linked to it, and you can reactivate it later.`,
        confirmLabel: 'Deactivate',
        done: (record) => `${record.className} deactivated.`,
    },
    reactivate: {
        title: 'Reactivate class?',
        message: (record) => `${record.className} (${record.academicYear}) will appear in class lists and dropdowns again.`,
        confirmLabel: 'Reactivate',
        done: (record) => `${record.className} reactivated.`,
    },
    delete: {
        title: 'Delete class permanently?',
        message: (record) => `This permanently deletes ${record.className} (${record.academicYear}) and its sections. It only works if no student, admission, enquiry, exam, lesson plan or attendance record uses this class; otherwise the server refuses and you can deactivate it instead.`,
        confirmLabel: 'Delete',
        done: (record) => `${record.className} deleted.`,
    },
}

const ClassDetails = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [search, setSearch] = useState('')
    const [records, setRecords] = useState(() => getClassDetails())
    const [pendingDeleteId, setPendingDeleteId] = useState(null)
    const [yearId, setYearId] = useState('')
    const [showInactive, setShowInactive] = useState(false)
    const [editing, setEditing] = useState(null)
    const [confirm, setConfirm] = useState(null)
    const [busy, setBusy] = useState(false)
    // API mode: classes, sections and years come from the server. Local mode: the browser catalog.
    const directory = useClassDirectory(yearId, showInactive)
    const apiMode = directory.apiMode
    const sourceRecords = apiMode ? directory.records : records

    const refresh = () => setRecords(getClassDetails())

    // API mode shows a class's active sections, plus the deactivated ones when asked.
    const shownSections = (record) => (
        showInactive ? (record.sections || []) : (record.sections || []).filter((section) => section.isActive !== false)
    )

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return sourceRecords
        return sourceRecords.filter((item) => {
            const sectionNames = (item.sections || []).map((section) => section.name).join(', ')
            const teacherNames = (item.sections || []).map((section) => section.classTeacherName || '').join(' ')
            return (
                item.className.toLowerCase().includes(query)
                || (item.displayName || '').toLowerCase().includes(query)
                || sectionNames.toLowerCase().includes(query)
                || (item.classTeacher || '').toLowerCase().includes(query)
                || teacherNames.toLowerCase().includes(query)
            )
        })
    }, [sourceRecords, search])
    const pagination = useListPagination(filteredRecords, { resetKey: [search, yearId, showInactive].join('|') })

    const confirmDelete = () => {
        if (!showDelete || !pendingDeleteId) return
        removeClassDetails(pendingDeleteId)
        setPendingDeleteId(null)
        setDeleteRequestModal(false)
        refresh()
        toast.success('Class details deleted.')
    }

    const runConfirmed = async () => {
        if (!confirm || busy) return
        if (confirm.type === 'delete' && !showDelete) return
        const { type, record } = confirm
        const copy = CONFIRM_COPY[type]
        setBusy(true)
        try {
            if (type === 'delete') await deleteClass(record.id)
            else await setClassActive(record.id, type === 'reactivate')
            toast.success(copy.done(record))
            directory.reload()
        } catch (error) {
            toast.error(
                error?.status === 403
                    ? 'You do not have permission to change classes.'
                    : error?.message || 'Could not complete that action.',
            )
        } finally {
            setBusy(false)
            setConfirm(null)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setYearId('')
                            setShowInactive(false)
                        }}
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
                            placeholder='Class, section, teacher...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    {apiMode ? (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='academic-year' className='text-base font-medium text-[#808080]'>Academic Year</label>
                            <select
                                id='academic-year'
                                value={yearId}
                                onChange={(e) => setYearId(e.target.value)}
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                            >
                                <option value=''>All years</option>
                                {directory.years.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name}{year.isCurrent ? ' (current)' : ''}{year.isActive ? '' : ' - inactive'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}
                    {apiMode && (
                        <div className='flex flex-col gap-y-2 justify-end'>
                            <label htmlFor='show-inactive' className='flex items-center gap-2 text-sm font-medium text-[#808080] py-2'>
                                <input
                                    id='show-inactive'
                                    type='checkbox'
                                    checked={showInactive}
                                    onChange={(e) => setShowInactive(e.target.checked)}
                                />
                                Show deactivated classes and sections
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Class Details List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/admin/class/add-class-details'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add New Class
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

                {apiMode && (
                    <p className='text-xs text-[#667085] mb-3'>
                        Classes, sections, capacity, room and class teacher are saved on the server, per academic year.
                        A class cannot be renamed. Deactivate a class to hide it while keeping its records; delete
                        works only for a class nothing uses.
                    </p>
                )}

                {apiMode && directory.status === 'loading' ? (
                    <div role='status' className='py-16 text-center text-sm text-[#667085]'>Loading classes…</div>
                ) : apiMode && directory.status === 'error' ? (
                    <div role='alert' className='py-16 text-center'>
                        <h3 className='text-lg font-semibold text-[#B42318]'>Could not load classes</h3>
                        <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>{directory.error}</p>
                        <button
                            type='button'
                            onClick={directory.reload}
                            className='mt-4 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer'
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className='py-16 text-center'>
                        <h3 className='text-lg font-semibold text-[#0C1E5B]'>
                            {search || (apiMode && yearId) ? 'No classes match these filters' : 'No class details yet'}
                        </h3>
                        <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>
                            {search || (apiMode && yearId)
                                ? 'Clear the filters to see every class.'
                                : 'Create classes and sections here. They will appear in Mark Entry and student creation dropdowns.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <PageSizeSelect pagination={pagination} className='my-2' />
                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left rtl:text-right'>
                                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                    <tr className='rounded-lg'>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                        {apiMode ? (
                                            <>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Academic Year</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Capacity</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Teacher</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Room</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section Capacity</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Capacity</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Teacher</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Room Number</th>
                                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagination.rows.map((record) => {
                                        const visible = apiMode ? shownSections(record) : (record.sections || [])
                                        const sectionNames = visible.map((section) => section.name).join(', ')
                                        const sectionCapacities = visible
                                            .map((section) => `${section.name}=${section.capacity || '—'}`)
                                            .join(', ')

                                        return (
                                            <tr key={record.id} className={`border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg ${apiMode && record.isActive === false ? 'bg-[#F9FAFB]' : ''}`}>
                                                <td className='px-2 py-4 rounded-s-lg'>{record.className || record.displayName}</td>
                                                <td className='px-2 py-4'>{sectionNames || '—'}</td>
                                                {apiMode ? (
                                                    <>
                                                        <td className='px-2 py-4'>{record.academicYear}</td>
                                                        <td className='px-2 py-4'>
                                                            <div className='font-medium text-[#344054]'>{record.capacity ?? '—'}</div>
                                                            {visible.length > 1 && visible.some((section) => section.capacity) && (
                                                                <div className='text-xs'>{sectionCapacities}</div>
                                                            )}
                                                        </td>
                                                        <td className='px-2 py-4'>
                                                            {visible.some((section) => section.classTeacherName)
                                                                ? visible.map((section) => (
                                                                    <div key={section.id}>
                                                                        {visible.length > 1 ? `${section.name}: ` : ''}{section.classTeacherName || '—'}
                                                                    </div>
                                                                ))
                                                                : '—'}
                                                        </td>
                                                        <td className='px-2 py-4'>
                                                            {visible.some((section) => section.roomNumber)
                                                                ? visible.map((section) => (
                                                                    <div key={section.id}>
                                                                        {visible.length > 1 ? `${section.name}: ` : ''}{section.roomNumber || '—'}
                                                                    </div>
                                                                ))
                                                                : '—'}
                                                        </td>
                                                        <td className='px-2 py-4'>
                                                            <span className={`inline-block text-xs px-2 py-1 rounded-full ${record.isActive === false ? 'bg-[#F2F4F7] text-[#667085]' : 'bg-[#ECFDF3] text-[#027A48]'}`}>
                                                                {record.isActive === false ? 'Deactivated' : 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                                <button
                                                                    type='button'
                                                                    onClick={() => setEditing(record)}
                                                                    disabled={record.isActive === false}
                                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                                                                >
                                                                    Edit sections
                                                                </button>
                                                                <button
                                                                    type='button'
                                                                    onClick={() => setConfirm({ type: record.isActive === false ? 'reactivate' : 'deactivate', record })}
                                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                                >
                                                                    {record.isActive === false ? 'Reactivate' : 'Deactivate'}
                                                                </button>
                                                                {showDelete ? (
                                                                    <button
                                                                        type='button'
                                                                        onClick={() => setConfirm({ type: 'delete', record })}
                                                                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                ) : null}
                                                            </Dropdown>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                <td className='px-2 py-4'>{sectionCapacities || '—'}</td>
                                                <td className='px-2 py-4'>{record.classCapacity || '—'}</td>
                                                <td className='px-2 py-4'>{record.classTeacher || '—'}</td>
                                                <td className='px-2 py-4'>{record.classRoomNumber || '—'}</td>
                                                <td className='px-2 py-4 text-center rounded-e-lg'>
                                                    <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                // Prefer real edit when sections API is available; otherwise
                                                                // privileged roles skip "Send Request to Super Admin".
                                                                if (apiMode) setEditing(record)
                                                                else setEditRequestModal(true)
                                                            }}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                        >
                                                            Edit
                                                        </button>
                                                        {showDelete ? (
                                                            <button
                                                                type='button'
                                                                onClick={() => {
                                                                    setPendingDeleteId(record.id)
                                                                    setDeleteRequestModal(true)
                                                                }}
                                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                            >
                                                                Delete
                                                            </button>
                                                        ) : null}
                                                    </Dropdown>
                                                </td>
                                                    </>
                                                )}
                                            </tr>
                                        )
                                    })}
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
                filename='class-details'
                rows={Array.isArray(filteredRecords) ? filteredRecords : []}
                exportDescription={<>You are exporting {Array.isArray(filteredRecords) ? filteredRecords.length : 0} record(s).</>}
            />
            {apiMode ? (
                <>
                    {editing && (
                        <EditClassModal
                            key={editing.id}
                            record={editing}
                            onClose={() => setEditing(null)}
                            onSaved={directory.reload}
                        />
                    )}
                    <DeleteRequestModal
                        deleteRequestModal={Boolean(confirm)}
                        setDeleteRequestModal={(open) => {
                            if (!open && !busy) setConfirm(null)
                        }}
                        onConfirm={runConfirmed}
                        title={confirm ? CONFIRM_COPY[confirm.type].title : ''}
                        message={confirm ? CONFIRM_COPY[confirm.type].message(confirm.record) : ''}
                        confirmLabel={busy ? 'Working…' : confirm ? CONFIRM_COPY[confirm.type].confirmLabel : ''}
                    />
                </>
            ) : (
                <>
                    <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
                    <DeleteRequestModal
                        deleteRequestModal={deleteRequestModal}
                        setDeleteRequestModal={(open) => {
                            setDeleteRequestModal(open)
                            if (!open) setPendingDeleteId(null)
                        }}
                        onConfirm={confirmDelete}
                        title='Delete Class Details?'
                        message='This will remove the class and its sections from Mark Entry and student assignment dropdowns.'
                        confirmLabel='Delete'
                    />
                </>
            )}
        </section>
    )
}

export default ClassDetails
