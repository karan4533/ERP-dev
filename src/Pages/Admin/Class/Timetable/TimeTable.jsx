import React, { useState } from 'react'
import { NavLink } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download } from "lucide-react";
import Dropdown from '../../../../Common/CommonComponents/Dropdown';
import ExportModal from '../../../../Common/CommonComponents/ExportModal';
import EditRequestModal from '../../../../Common/CommonComponents/EditRequestModal';
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal';

const TimeTable = () => {

    const [exportModal, setExportModal] = useState(false);
    const [editRequestModal, setEditRequestModal] = useState(false);
    const [deleteRequestModal, setDeleteRequestModal] = useState(false);

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="search" className='text-base font-medium text-[#808080]'>Search</label>
                        <input type="text" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full' />
                    </div>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="status" className='text-base font-medium text-[#808080]'>Class</label>
                        <select name="" id="" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="status" className='text-base font-medium text-[#808080]'>Section</label>
                        <select name="" id="" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="status" className='text-base font-medium text-[#808080]'>Day</label>
                        <select name="" id="" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                        </select>
                    </div>
                </div>
            </div>


            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Time Table List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to="/admin/class/add-timetable" className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Add New Period
                        </NavLink>
                        <button onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select name="" id="" className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="40">40</option>
                        <option value="50">50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr className='rounded-lg'>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Period Number</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Time Duration</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Subject</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Teacher</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase text-center rounded-e-lg">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg">
                                <td className="px-2 py-4 rounded-s-lg">1</td>
                                <td className="px-2 py-4">09:00 AM - 09:45 AM</td>
                                <td className="px-2 py-4">English</td>
                                <td className="px-2 py-4">Sandy Selva</td>
                                <td className="px-2 py-4 text-center rounded-e-lg">
                                    <Dropdown
                                        buttonContent={<EllipsisIcon size={16} className='text-black' />}
                                    >
                                        <button className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">
                                            View
                                        </button>
                                        <button onClick={() => setEditRequestModal(true)} className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">
                                            Edit
                                        </button>
                                        <button onClick={() => setDeleteRequestModal(true)} className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">
                                            Delete
                                        </button>
                                    </Dropdown>

                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to 10 of 20 entries</p>

                <div className="flex justify-center gap-x-2 flex-wrap">
                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronLeft size={16} />
                    </button>

                    <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                        1
                    </button>

                    <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                        2
                    </button>

                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />

            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />

            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default TimeTable