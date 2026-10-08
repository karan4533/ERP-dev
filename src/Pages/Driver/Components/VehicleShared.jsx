import React from 'react'
import {
    Bus,
    Clock,
    GraduationCap,
    Hash,
    MapPin,
    Phone,
    Route,
    ShieldCheck,
    Sun,
    UserRound,
    Users,
} from 'lucide-react'

export const ICON_TONES = {
    info: 'bg-[#515DEF1A] text-[#515DEF]',
    success: 'bg-[#4CAF501A] text-[#4CAF50]',
    warning: 'bg-[#FF98001A] text-[#FF9800]',
    danger: 'bg-[#FF57221A] text-[#FF5722]',
}

const TILE_ICON_MAP = {
    id: Hash,
    number: Bus,
    type: Bus,
    model: Bus,
    capacity: Users,
    driver: UserRound,
    contact: Phone,
    route: Route,
    status: ShieldCheck,
    routeId: Hash,
    routeName: MapPin,
    routeVehicle: Bus,
    routeType: Sun,
    distance: Route,
    travelTime: Clock,
    stops: MapPin,
    students: GraduationCap,
    routeStatus: ShieldCheck,
}

export const InfoTile = ({ icon, label, value, iconTone = 'info', isStatus, statusClassName }) => {
    const Icon = TILE_ICON_MAP[icon] ?? Bus

    return (
        <div className='flex items-center gap-4 p-4 rounded-xl border border-[#F2F4F7] bg-white hover:border-[#515DEF33] hover:shadow-sm transition-all duration-200'>
            <div className={`p-3 rounded-xl shrink-0 ${ICON_TONES[iconTone]}`}>
                <Icon size={22} />
            </div>
            <div className='min-w-0 flex-1'>
                <p className='text-sm text-[#667085]'>{label}</p>
                {isStatus ? (
                    <span className={`inline-flex mt-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusClassName}`}>
                        {value}
                    </span>
                ) : (
                    <p className='text-base font-semibold text-[#1E1E1E] mt-0.5 wrap-break-word'>
                        {value}
                    </p>
                )}
            </div>
        </div>
    )
}
