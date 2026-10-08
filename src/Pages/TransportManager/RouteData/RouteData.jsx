import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, MapPin, ChevronRight } from 'lucide-react'
import { ROUTES } from '../RouteManagement/routeManagementData'

const MapPlaceholder = () => (
    <div className='relative h-44 bg-linear-to-br from-[#E8EBFF] via-[#F4F6FF] to-[#EDEEF5] overflow-hidden'>
        <div
            className='absolute inset-0 opacity-30'
            style={{
                backgroundImage: `
                    linear-gradient(#515DEF22 1px, transparent 1px),
                    linear-gradient(90deg, #515DEF22 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
            }}
        />
        <div className='absolute inset-0 flex items-center justify-center'>
            <div className='flex flex-col items-center gap-2 text-[#515DEF]'>
                <div className='p-3 rounded-full bg-white/80 shadow-sm'>
                    <MapPin size={28} />
                </div>
                <span className='text-xs font-semibold uppercase tracking-wider'>Route Map Preview</span>
            </div>
        </div>
        <div className='absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm'>
            <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
            </span>
            <span className='text-[10px] font-semibold text-[#0C1E5B]'>LIVE</span>
        </div>
    </div>
)

const RouteData = () => {
    const navigate = useNavigate()

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-6'>
                <h2 className='text-xl font-medium text-black'>Route Data</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Select a route to view live tracking and route details on the map.
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
                {ROUTES.map((route) => (
                    <button
                        key={route.id}
                        type='button'
                        onClick={() => navigate(`/transport-manager/route-data/track/${route.id}`)}
                        className='bg-white rounded-2xl shadow-md overflow-hidden text-left hover:shadow-lg hover:ring-2 hover:ring-[#515DEF]/20 transition-all duration-200 cursor-pointer group'
                    >
                        <MapPlaceholder />
                        <div className='p-4'>
                            <div className='flex items-start justify-between gap-3'>
                                <div className='min-w-0 flex-1'>
                                    <h3 className='text-base font-semibold text-[#0C1E5B] truncate group-hover:text-[#515DEF] transition-colors'>
                                        {route.routeName}
                                    </h3>
                                    <p className='text-xs text-[#667085] mt-1 truncate'>
                                        {route.startLocation} → {route.endLocation}
                                    </p>
                                </div>
                                <ChevronRight size={18} className='text-[#667085] shrink-0 mt-0.5 group-hover:text-[#515DEF] transition-colors' />
                            </div>

                            <div className='mt-4 pt-4 border-t border-[#f2f4f7] space-y-2'>
                                <div className='flex items-center gap-2 text-sm text-[#667085]'>
                                    <Bus size={16} className='text-[#515DEF] shrink-0' />
                                    <span className='truncate'>
                                        <span className='font-medium text-[#1E1E1E]'>Bus:</span> {route.vehicleNumber}
                                    </span>
                                </div>
                                <div className='flex items-center gap-2 text-sm text-[#667085]'>
                                    <span className='text-[#515DEF] shrink-0'>👤</span>
                                    <span className='truncate'>
                                        <span className='font-medium text-[#1E1E1E]'>Driver:</span> {route.driverName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    )
}

export default RouteData
