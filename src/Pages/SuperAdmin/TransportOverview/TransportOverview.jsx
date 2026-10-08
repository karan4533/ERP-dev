import React, { useMemo, useState } from 'react'
import { Bus, Droplet, FileText, Route, Users, Wrench } from 'lucide-react'
import {
    OVERVIEW_SECTIONS,
    docStatusBadgeColor,
    getFleetSummary,
    getSectionSummary,
    getSectionTable,
} from './transportOverviewData'

const SECTION_ICONS = {
    routes: Route,
    vehicles: Bus,
    drivers: Users,
    'fuel-expenses': Droplet,
    'vehicle-maintenance': Wrench,
    'vehicle-documents': FileText,
}

const SummaryCard = ({ label, value, description }) => (
    <div className='bg-white rounded-2xl shadow-md p-5'>
        <p className='text-sm font-medium text-[#808080]'>{label}</p>
        <p className='text-3xl font-bold text-[#0C1E5B] mt-2'>{value}</p>
        {description && <p className='text-sm text-[#667085] mt-2'>{description}</p>}
    </div>
)

const MiniStat = ({ label, value }) => (
    <div className='rounded-xl border border-[#E4E7EC] bg-[#FAFBFC] p-4'>
        <p className='text-xs font-medium text-[#808080]'>{label}</p>
        <p className='text-xl font-semibold text-[#515DEF] mt-1'>{value}</p>
    </div>
)

const TransportOverview = () => {
    const [activeSection, setActiveSection] = useState('routes')
    const fleetSummary = useMemo(() => getFleetSummary(), [])
    const sectionSummary = useMemo(() => getSectionSummary(activeSection), [activeSection])
    const { columns, rows } = useMemo(() => getSectionTable(activeSection), [activeSection])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>Transport Overview</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    School-wide transport governance view — routes, fleet, drivers, fuel, maintenance, and compliance documents.
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <SummaryCard
                    label='Active Routes'
                    value={fleetSummary.totalRoutes}
                    description={`${fleetSummary.totalStops} stops across campus routes`}
                />
                <SummaryCard
                    label='Fleet Vehicles'
                    value={fleetSummary.totalVehicles}
                    description={`${fleetSummary.totalCapacity} total passenger capacity`}
                />
                <SummaryCard
                    label='Active Drivers'
                    value={`${fleetSummary.activeDrivers} / ${fleetSummary.totalDrivers}`}
                    description='Drivers currently on duty'
                />
                <SummaryCard
                    label='Recent Fuel Spend'
                    value={fleetSummary.fuelSpend}
                    description={`${fleetSummary.scheduledMaintenance} services scheduled · ${fleetSummary.expiringDocs} docs expiring soon`}
                />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap gap-2'>
                    {OVERVIEW_SECTIONS.map((section) => {
                        const Icon = SECTION_ICONS[section.key]
                        const isActive = activeSection === section.key
                        return (
                            <button
                                key={section.key}
                                type='button'
                                onClick={() => setActiveSection(section.key)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                    isActive
                                        ? 'bg-[#515DEF] text-white'
                                        : 'bg-[#EDEEF5] text-[#515DEF] hover:bg-[#515DEF33]'
                                }`}
                            >
                                {Icon && <Icon size={16} />}
                                {section.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {sectionSummary.map((item) => (
                    <MiniStat key={item.label} label={item.label} value={item.value} />
                ))}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-2 mb-4'>
                    {SECTION_ICONS[activeSection] && (
                        <span className='flex size-9 items-center justify-center rounded-lg bg-[#515DEF33] text-[#515DEF]'>
                            {React.createElement(SECTION_ICONS[activeSection], { size: 18 })}
                        </span>
                    )}
                    <h2 className='text-xl font-medium text-black'>
                        {OVERVIEW_SECTIONS.find((s) => s.key === activeSection)?.label}
                    </h2>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                {columns.map((column, index) => (
                                    <th
                                        key={column.key}
                                        className={`px-2 py-3.5 text-[#0C1E5B] font-medium uppercase ${
                                            index === 0 ? 'rounded-s-lg' : index === columns.length - 1 ? 'rounded-e-lg' : ''
                                        }`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id ?? `${row.vehicleNumber}-${row.docType ?? row.expenseId ?? row.serviceId}`} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    {columns.map((column, index) => {
                                        const value = row[column.key] ?? '—'
                                        const badgeClass = column.badgeMap?.[value] ?? docStatusBadgeColor[value]
                                        return (
                                            <td key={column.key} className={`px-2 py-4 ${index === 0 ? 'rounded-s-lg' : ''}`}>
                                                {column.badge ? (
                                                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${badgeClass ?? 'bg-[#66708533] text-[#667085]'}`}>
                                                        {value}
                                                    </span>
                                                ) : (
                                                    value
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className='text-sm font-medium text-[#515DEF] mt-4'>
                    Showing {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
                </p>
            </div>
        </section>
    )
}

export default TransportOverview
