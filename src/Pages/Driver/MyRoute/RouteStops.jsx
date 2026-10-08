import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    CLASS_OPTIONS,
    DAY_OPTIONS,
    ROUTE_STOPS,
    SECTION_OPTIONS,
    filterRouteStops,
} from './routeStopsData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const RouteStops = () => {
    const [search, setSearch] = useState('')
    const [className, setClassName] = useState('12th')
    const [section, setSection] = useState('A')
    const [day, setDay] = useState('Monday')
    const [exportModal, setExportModal] = useState(false)

    const filteredStops = useMemo(() => filterRouteStops({
        stops: ROUTE_STOPS,
        search,
        className,
        section,
        day,
    }), [search, className, section, day])

    const clearFilters = () => {
        setSearch('')
        setClassName('')
        setSection('')
        setDay('')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all cursor-pointer w-fit'
                    >
                        Clear Filters
                    </button>
                    <div className='flex flex-col gap-y-2 md:max-w-xs w-full'>
                        <label htmlFor='stop-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='stop-search'
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Pickup point, landmark...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 lg:mt-8 mt-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={className}
                            onChange={(event) => setClassName(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {CLASS_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Sec</label>
                        <select
                            id='section-filter'
                            value={section}
                            onChange={(event) => setSection(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SECTION_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='day-filter' className='text-base font-medium text-[#808080]'>Day</label>
                        <select
                            id='day-filter'
                            value={day}
                            onChange={(event) => setDay(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {DAY_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                    <h2 className='text-xl font-semibold text-black'>Route Stops List</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer uppercase'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                <div className='flex gap-x-2 items-center mb-4'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md text-sm'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm text-[#515DEF]'>Entries Per Page</span>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left min-w-[800px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg text-center`}>Stop No</th>
                                <th className={thClass}>Pickup Point</th>
                                <th className={thClass}>Arrival Time</th>
                                <th className={thClass}>Departure Time</th>
                                <th className={`${thClass} text-center`}>Students Boarding</th>
                                <th className={`${thClass} rounded-e-lg`}>Landmark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStops.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-2 py-8 text-center text-[#667085]'>
                                        No route stops found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredStops.map((stop) => (
                                    <tr key={stop.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} rounded-s-lg text-center font-medium text-[#1E1E1E]`}>
                                            {stop.stopNo}
                                        </td>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{stop.pickupPoint}</td>
                                        <td className={tdClass}>{stop.arrivalTime}</td>
                                        <td className={tdClass}>{stop.departureTime}</td>
                                        <td className={`${tdClass} text-center font-medium text-[#1E1E1E]`}>
                                            {stop.studentsBoarding}
                                        </td>
                                        <td className={`${tdClass} rounded-e-lg`}>{stop.landmark}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                    <p className='text-sm font-medium text-[#515DEF]'>
                        Showing 1 to {filteredStops.length} of {filteredStops.length} entries
                    </p>
                    <div className='flex items-center gap-2'>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                            <ChevronLeft size={16} />
                        </button>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full bg-[#515DEF] text-white text-sm font-medium cursor-pointer'>
                            1
                        </button>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default RouteStops
