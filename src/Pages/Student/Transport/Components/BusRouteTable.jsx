import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const BUS_ROUTE_ROWS = [
    {
        routeName: 'Route 1 – Main Road',
        vehicleId: 'VH-001',
        vehicleNumber: 'TN55 AB 1234',
        driverName: 'Suresh Kumar',
        driverContact: '+91 9876543210',
        pickupLocation: 'Anna Nagar Stop',
        pickupTime: '07:30 AM',
        dropLocation: 'Anna Nagar Stop',
        dropTime: '04:45 PM',
        routeStops: 'Main Road, Market Area, Anna Nagar',
    },
]

const BusRouteTable = ({ title = 'Bus Route Details', showPagination = true }) => (
    <>
        <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
            <h2 className='text-xl font-medium text-black'>{title}</h2>
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
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Route Name</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Vehicle ID</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Vehicle Number</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Driver Name</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Driver Contact</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Pickup Location</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Pickup Time</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Drop Location</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Drop Time</th>
                        <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Route Stops</th>
                    </tr>
                </thead>
                <tbody>
                    {BUS_ROUTE_ROWS.map((row) => (
                        <tr key={row.vehicleId} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg">
                            <td className="px-2 py-4 rounded-s-lg">{row.routeName}</td>
                            <td className="px-2 py-4">{row.vehicleId}</td>
                            <td className="px-2 py-4">{row.vehicleNumber}</td>
                            <td className="px-2 py-4">{row.driverName}</td>
                            <td className="px-2 py-4">{row.driverContact}</td>
                            <td className="px-2 py-4">{row.pickupLocation}</td>
                            <td className="px-2 py-4">{row.pickupTime}</td>
                            <td className="px-2 py-4">{row.dropLocation}</td>
                            <td className="px-2 py-4">{row.dropTime}</td>
                            <td className="px-2 py-4 rounded-e-lg">{row.routeStops}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {showPagination && (
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to 10 of 20 entries</p>
                <div className="flex justify-center gap-x-2 flex-wrap">
                    <button type="button" className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronLeft size={16} />
                    </button>
                    <button type="button" className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                        1
                    </button>
                    <button type="button" className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                        2
                    </button>
                    <button type="button" className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
    </>
)

export default BusRouteTable
