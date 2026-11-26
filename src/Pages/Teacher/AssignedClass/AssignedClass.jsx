import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { getActiveCreatedUserSession } from '../../../Common/RBAC/createdUsersData'
import { useAuth } from '../../../context/AuthContext'
import {
    CLASSES,
    SECTIONS,
    SUBJECTS,
    classTeacherBadgeColor,
    getAssignedClasses,
} from './assignedClassData'

const AssignedClass = () => {
    const [exportModal, setExportModal] = useState(false)
    const { email } = useAuth()
    const session = getActiveCreatedUserSession()
    const teacherEmail = session?.email || email
    const assignedClasses = useMemo(
        () => getAssignedClasses(teacherEmail),
        [teacherEmail],
    )

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
                        <input type='text' id='search' placeholder='Class, section, subject...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
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
                        <label htmlFor='subject-filter' className='text-base font-medium text-[#808080]'>Subject</label>
                        <select id='subject-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {SUBJECTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Assigned Class List</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                {assignedClasses.length === 0 ? (
                    <div className='py-16 text-center'>
                        <h3 className='text-lg font-semibold text-[#0C1E5B]'>No classes assigned yet</h3>
                        <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>
                            Once an Administrator assigns classes and subjects to your account under RBAC, they will appear here.
                        </p>
                    </div>
                ) : (
                    <>
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
                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left rtl:text-right'>
                                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                    <tr className='rounded-lg'>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Total Students</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Class Teacher</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignedClasses.map((record) => (
                                        <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.className}</td>
                                            <td className='px-2 py-4'>{record.section}</td>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.subject}</td>
                                            <td className='px-2 py-4'>{record.totalStudents}</td>
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${classTeacherBadgeColor[record.classTeacher]}`}>
                                                    {record.classTeacher}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className='flex justify-between items-center px-4 mt-4'>
                            <p className='text-sm font-medium text-[#515DEF]'>
                                Showing 1 to {assignedClasses.length} of {assignedClasses.length} entries
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
                    </>
                )}
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default AssignedClass
