import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    ASSETS_INVENTORY,
    VIEW_FILTERS,
    DEPARTMENTS,
    ALERT_TYPES,
    STATUS_OPTIONS,
    statusBadgeColor,
    alertBadgeColor,
} from './assetsInventoryData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const AssetsInventoryOverview = () => {
    const [activeView, setActiveView] = useState('all')
    const [fromDate, setFromDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)

    const filteredItems = useMemo(() => {
        if (activeView === 'all') return ASSETS_INVENTORY
        return ASSETS_INVENTORY.filter((item) => item.viewType === activeView)
    }, [activeView])

    const activeViewMeta = VIEW_FILTERS.find((view) => view.key === activeView)

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Assets & Inventory Overview</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Cross-department view of inventory levels, IT assets, and transport fleet status.
                </p>

                <div className='mt-4'>
                    <p className='text-sm font-medium text-[#1E1E1E] mb-2'>Views</p>
                    <div className='flex flex-wrap gap-2'>
                        {VIEW_FILTERS.map((view) => (
                            <button
                                key={view.key}
                                type='button'
                                onClick={() => setActiveView(view.key)}
                                className={`text-sm px-4 py-2 rounded-md border transition-all cursor-pointer ${activeView === view.key ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'bg-white text-[#515DEF] border-[#515DEF] hover:bg-[#515DEF] hover:text-white'}`}
                            >
                                {view.label}
                            </button>
                        ))}
                    </div>
                    {activeViewMeta?.sub && (
                        <p className='text-xs text-[#667085] mt-2'>{activeViewMeta.sub}</p>
                    )}
                </div>

                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4 mt-6'>
                    <button className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs'>
                        <option value="">From Beginning</option>
                    </select>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input type="text" placeholder="Item name, category..." className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Department</label>
                        <select className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Alert Type</label>
                        <select className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            {ALERT_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>
                        {activeViewMeta?.label ?? 'All Assets & Inventory'}
                    </h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Department</th>
                                <th className={thClass}>Asset Category</th>
                                <th className={thClass}>Asset/Product</th>
                                <th className={thClass}>Current Quantity</th>
                                <th className={thClass}>Alert Type</th>
                                <th className={thClass}>Status</th>
                                <th className={thClass}>Last Updated</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{item.department}</td>
                                    <td className={tdClass}>{item.assetCategory}</td>
                                    <td className={`${tdClass} max-w-[180px] truncate`} title={item.assetProduct}>{item.assetProduct}</td>
                                    <td className={`${tdClass} ${item.status === 'Critical' ? 'text-[#FF5722] font-medium' : ''}`}>{item.currentQuantity}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${alertBadgeColor[item.alertType]}`}>
                                            {item.alertType}
                                        </span>
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className={tdClass}>{item.lastUpdated}</td>
                                    <td className={`${tdClass} text-center rounded-e-lg`}>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`/joint-director-assistant/assets-inventory/view/${item.id}`}
                                                className="block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer"
                                            >
                                                View
                                            </NavLink>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredItems.length} of {filteredItems.length} entries
                </p>
                <div className="flex justify-center gap-x-2">
                    <button type="button" className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronLeft size={16} />
                    </button>
                    <button type="button" className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer">
                        1
                    </button>
                    <button type="button" className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default AssetsInventoryOverview
