import React, { useState } from 'react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronLeft, ChevronRight, Download } from "lucide-react";
import no_profile from "../../../assets/images/no-profile.png"
import ExportModal from '../../../Common/CommonComponents/ExportModal';

const HosteGatePass = () => {

    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [gateKeeperStatus, setGateKeeperStatus] = useState("Pending");
    const [exportModal, setExportModal] = useState(false);

    const bagdeColor = {
        "Returned": "bg-[#4CAF5033] text-[#4CAF50]",
        "Checked Out": "bg-[#FF980033] text-[#FF9800]",
    }

    const statusColor = {
        "Approved": "text-[#4CAF50]",
        "Pending": "text-[#FF0000]",
        "On Processing": "text-[#FF9800]",
    }

    const gateKeeperStatusColor = {
        "Verified": "text-[#4CAF50] border-[#4CAF5033]",
        "Pending": "text-[#FF0000] border-[#FF000033]",
        "On Processing": "text-[#FF9800] border-[#FF980033]",
    }

    const gateKeeperStatusOptions = [
        { value: "Pending", label: "Pending" },
        { value: "On Processing", label: "On Processing" },
        { value: "Verified", label: "Verified" },
    ]

    const handleGateKeeperStatusChange = (e) => {
        setGateKeeperStatus(e.target.value);
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select name="" id="" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="search" className='text-base font-medium text-[#808080]'>Search</label>
                        <input type="text" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="class" className='text-base font-medium text-[#808080]'>Status</label>
                        <select name="" id="" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>

                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />

                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>

                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable={true}
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />

                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>


            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>

                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Hostel Gate Pass List</h2>
                    <div className='flex gap-x-2 items-center'>
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
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase text-center rounded-s-lg">Profile</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Gate Pass ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Student Name</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Class</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Hostel</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Leave Type</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Out Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Return Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Parent Approval</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Warden Approval</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Gate Keeper</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Final Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg">
                                <td className="px-2 py-4 object-cover flex justify-center rounded-s-lg">
                                    <img src={no_profile} alt="no-profile-image" className='w-9 h-9' />
                                </td>
                                <td className="px-2 py-4">GP001</td>
                                <td className="px-2 py-4">Arun Kumar</td>
                                <td className="px-2 py-4">Class 10 A</td>
                                <td className="px-2 py-4">QMIS Hostel</td>
                                <td className="px-2 py-4">Home Visit</td>
                                <td className="px-2 py-4">15-08-2025 09:00 AM</td>
                                <td className="px-2 py-4">16-08-2025 06:00 PM</td>
                                <td className="px-2 py-4">
                                    <span className={`font-medium whitespace-nowrap ${statusColor["Approved"]}`}>
                                        Approved
                                    </span>
                                </td>
                                <td className="px-2 py-4">
                                    <span className={`font-medium whitespace-nowrap ${statusColor["Approved"]}`}>
                                        Approved
                                    </span>
                                </td>
                                <td className="px-2 py-4">
                                    <select
                                        value={gateKeeperStatus}
                                        onChange={handleGateKeeperStatusChange}
                                        className={`text-sm font-medium border rounded-md px-2 py-1 w-full ${gateKeeperStatusColor[gateKeeperStatus]}`}
                                    >
                                        {gateKeeperStatusOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                                className={gateKeeperStatusColor[option.value]}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-2 py-4 rounded-e-lg">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${bagdeColor["Returned"]}`}>
                                        Returned
                                    </span>
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

        </section>
    )
}

export default HosteGatePass
