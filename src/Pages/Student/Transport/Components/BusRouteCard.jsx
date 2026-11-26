import React from 'react'
import { Bus, Clock, MapPin, Phone, Route, UserRound } from 'lucide-react'
import { BUS_ROUTE_ROWS } from './BusRouteTable'

const DetailItem = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const BusRouteCard = ({ title = 'Bus Route Details' }) => {
    const route = BUS_ROUTE_ROWS[0]

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <h2 className='text-xl font-semibold text-black mb-4'>{title}</h2>

            <div className='rounded-xl border border-[#EEF0F6] bg-[#FAFBFD] p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
                    <div>
                        <p className='text-sm font-medium text-[#515DEF] uppercase tracking-wide'>Assigned Route</p>
                        <h3 className='text-xl font-semibold text-[#0C1E5B] mt-1'>{route.routeName}</h3>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        <span className='inline-flex items-center gap-2 bg-[#EBF4FE] px-4 py-1.5 rounded-md'>
                            <Bus className='w-5 h-5 text-[#0751E0]' />
                            <span className='text-sm font-medium text-[#0751E0]'>{route.vehicleNumber}</span>
                        </span>
                        <span className='inline-flex items-center gap-2 bg-[#F0F8FE] px-4 py-1.5 rounded-md'>
                            <Route className='w-5 h-5 text-[#515DEF]' />
                            <span className='text-sm font-medium text-[#515DEF]'>{route.vehicleId}</span>
                        </span>
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <DetailItem label='Driver Name' value={route.driverName} />
                    <DetailItem label='Driver Contact' value={route.driverContact} />
                    <DetailItem label='Pickup Location' value={route.pickupLocation} />
                    <DetailItem label='Pickup Time' value={route.pickupTime} />
                    <DetailItem label='Drop Location' value={route.dropLocation} />
                    <DetailItem label='Drop Time' value={route.dropTime} />
                    <div className='flex flex-col gap-y-1 sm:col-span-2 lg:col-span-3'>
                        <span className='text-base font-medium text-[#808080]'>Route Stops</span>
                        <span className='text-sm text-[#1E1E1E]'>{route.routeStops}</span>
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                    <div className='flex items-start gap-3 rounded-lg border border-[#D2E2F0] bg-[#F0F8FE] p-4'>
                        <MapPin className='w-5 h-5 text-[#515DEF] shrink-0 mt-0.5' />
                        <div>
                            <p className='text-sm font-semibold text-[#0C1E5B]'>Morning Pickup</p>
                            <p className='text-sm text-[#667085] mt-1'>{route.pickupLocation}</p>
                            <p className='text-xs text-[#515DEF] font-medium mt-1 flex items-center gap-1'>
                                <Clock size={14} />
                                {route.pickupTime}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-start gap-3 rounded-lg border border-[#D1E7CC] bg-[#F1FCF2] p-4'>
                        <MapPin className='w-5 h-5 text-[#0B6D2C] shrink-0 mt-0.5' />
                        <div>
                            <p className='text-sm font-semibold text-[#0C1E5B]'>Evening Drop</p>
                            <p className='text-sm text-[#667085] mt-1'>{route.dropLocation}</p>
                            <p className='text-xs text-[#0B6D2C] font-medium mt-1 flex items-center gap-1'>
                                <Clock size={14} />
                                {route.dropTime}
                            </p>
                        </div>
                    </div>
                </div>

                <div className='flex justify-between items-center mt-6 bg-[#EDF4FE] p-3 rounded-md gap-4 flex-wrap'>
                    <div className='flex gap-x-3 items-center'>
                        <UserRound className='w-5 h-5 text-[#0A5DFE] shrink-0' />
                        <span className='text-sm text-[#00007A]'>
                            <strong>Driver:</strong> {route.driverName}
                        </span>
                    </div>
                    <div className='flex gap-x-2 items-center text-sm text-[#0A5DFE] font-medium'>
                        <Phone size={16} />
                        {route.driverContact}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BusRouteCard
