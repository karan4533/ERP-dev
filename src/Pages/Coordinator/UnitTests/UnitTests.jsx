import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Download, EllipsisIcon, Plus } from 'lucide-react'
import ListPagination, { PageSizeSelect } from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import pdf_icon from '../../../assets/images/pdf-icon.png'
import noAssign from '../../../assets/images/no-assign.png'
import {
    CLASSES,
    deleteUnitTest,
    filterUnitTests,
    formatTestDate,
    getUnitTests,
    hydrateUnitTestsFromApi,
    ROUTE_BASE,
    SECTIONS,
    SUBJECTS,
    UNIT_TESTS_UPDATED_EVENT,
} from './unitTestsData'

const emptyFilters = {
    search: '',
    subject: '',
    className: '',
    section: '',
}

const UnitTestsEmpty = () => (
    <div className='bg-white rounded-2xl shadow-md p-8 sm:p-12 min-h-[420px] flex items-center justify-center'>
        <div className='flex flex-col items-center text-center max-w-md mx-auto'>
            <img src={noAssign} alt='No unit tests found' className='w-72 h-72 object-contain' />
            <h2 className='text-xl sm:text-2xl font-semibold text-[#0C1E5B] mt-6'>
                No Unit Tests Found!
            </h2>
            <p className='text-sm sm:text-base text-[#667085] mt-2'>
                It looks like you haven&apos;t created any unit tests yet.
            </p>
            <NavLink
                to={`${ROUTE_BASE}/add`}
                className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2 mt-8'
            >
                <Plus size={16} />
                Create Unit Test
            </NavLink>
        </div>
    </div>
)

const UnitTestsList = ({ items }) => {
    const [filters, setFilters] = useState(emptyFilters)
    const [exportModal, setExportModal] = useState(false)
    const [deletingId, setDeletingId] = useState('')

    const filteredItems = useMemo(() => filterUnitTests(items, filters), [items, filters])
    const pagination = useListPagination(filteredItems, { resetKey: JSON.stringify(filters) })

    const handleDelete = async (record) => {
        const label = record.entryId || record.title || 'this unit test'
        if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
        setDeletingId(record.id)
        try {
            await deleteUnitTest(record.id)
        } catch (error) {
            toast.error(error?.message || 'Could not delete unit test.')
        } finally {
            setDeletingId('')
        }
    }

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }))
    }

    const clearFilters = () => setFilters(emptyFilters)

    return (
        <>
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
                            type='text'
                            id='search'
                            value={filters.search}
                            onChange={(event) => updateFilter('search', event.target.value)}
                            placeholder='Entry ID, title...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='subject-filter' className='text-base font-medium text-[#808080]'>Subject</label>
                        <select
                            id='subject-filter'
                            value={filters.subject}
                            onChange={(event) => updateFilter('subject', event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={filters.className}
                            onChange={(event) => updateFilter('className', event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {CLASSES.map((item) => (
                                <option key={item} value={item}>Class {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={filters.section}
                            onChange={(event) => updateFilter('section', event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SECTIONS.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>CA / RCT</h2>
                <p className='text-xs text-[#667085]'>Continuous Assessment / Regular Class Test</p>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={`${ROUTE_BASE}/add`}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Unit Test
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
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Entry ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Title</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Test Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Marks</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Duration</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Question Paper</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>{emptyListMessage(items.length)}</td>
                                </tr>
                            ) : null}
                            {pagination.rows.map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.entryId}</td>
                                    <td className='px-2 py-4'>{record.subject}</td>
                                    <td className='px-2 py-4'>{record.className}</td>
                                    <td className='px-2 py-4'>{record.section}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.title}</td>
                                    <td className='px-2 py-4'>{formatTestDate(record.testDate)}</td>
                                    <td className='px-2 py-4'>{record.totalMarks}</td>
                                    <td className='px-2 py-4'>{record.duration} min</td>
                                    <td className='px-2 py-4'>
                                        <span className='flex items-center gap-x-2'>
                                            <img src={pdf_icon} alt='file-icon' className='w-6 h-6' />
                                            <span className='text-sm font-normal text-[#515DEF]'>{record.fileName}</span>
                                        </span>
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`${ROUTE_BASE}/view/${record.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                View
                                            </NavLink>
                                            <NavLink
                                                to={`${ROUTE_BASE}/edit/${record.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                Edit
                                            </NavLink>
                                            <button
                                                type='button'
                                                disabled={deletingId === record.id}
                                                onClick={() => handleDelete(record)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer disabled:opacity-50'
                                            >
                                                {deletingId === record.id ? 'Deleting…' : 'Delete'}
                                            </button>
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
                filename='unittests'
                title='UnitTests'
                rows={Array.isArray(filteredItems) ? filteredItems : []}
                exportDescription={<>You are exporting {Array.isArray(filteredItems) ? filteredItems.length : 0} record(s).</>}
            />
        </>
    )
}

const UnitTests = () => {
    const location = useLocation()
    const [items, setItems] = useState(() => getUnitTests())

    useEffect(() => {
        let cancelled = false
        hydrateUnitTestsFromApi().finally(() => {
            if (!cancelled) setItems(getUnitTests())
        })
        const onUpdate = () => setItems(getUnitTests())
        window.addEventListener(UNIT_TESTS_UPDATED_EVENT, onUpdate)
        return () => {
            cancelled = true
            window.removeEventListener(UNIT_TESTS_UPDATED_EVENT, onUpdate)
        }
    }, [location.key])

    if (items.length === 0) {
        return (
            <section>
                <UnitTestsEmpty />
            </section>
        )
    }

    return (
        <section>
            <UnitTestsList items={items} />
        </section>
    )
}

export default UnitTests
