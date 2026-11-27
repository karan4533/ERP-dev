import React, { useEffect, useMemo, useState } from 'react'
import { Bus, Droplet, FileText, Route, Users, Wrench } from 'lucide-react'
import {
    OVERVIEW_SECTIONS,
    docStatusBadgeColor,
    getFleetSummaryFromRows,
    getSectionSummaryFromRows,
    getSectionTableFromRows,
} from './transportOverviewData'
import { hydrateRoutesFromApi, getRoutes } from '../../TransportManager/RouteManagement/routeManagementData'
import { hydrateVehiclesFromApi, getVehicles } from '../../TransportManager/VehicleManagement/vehicleManagementData'
import { hydrateDriversFromApi, getDrivers } from '../../TransportManager/DriverManagement/driverManagementData'
import { hydrateTransportExpensesFromApi, getFuelExpenses } from '../../TransportManager/TransportExpenses/transportExpensesData'
import { hydrateMaintenanceRecordsFromApi, getMaintenanceRecords } from '../../TransportManager/VehicleMaintenance/vehicleMaintenanceData'

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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [rows, setRows] = useState({
        routes: [],
        vehicles: [],
        drivers: [],
        fuel: [],
        maintenance: [],
    })

    useEffect(() => {
        let active = true
        setLoading(true)
        Promise.allSettled([
            hydrateRoutesFromApi().then(() => getRoutes()),
            hydrateVehiclesFromApi().then(() => getVehicles()),
            hydrateDriversFromApi().then(() => getDrivers()),
            hydrateTransportExpensesFromApi().then(() => getFuelExpenses()),
            hydrateMaintenanceRecordsFromApi().then(() => getMaintenanceRecords()),
        ]).then((results) => {
            if (!active) return
            const pick = (i, fallback = []) => (results[i].status === 'fulfilled' ? results[i].value : fallback)
            setRows({
                routes: pick(0),
                vehicles: pick(1),
                drivers: pick(2),
                fuel: pick(3),
                maintenance: pick(4),
            })
            const failed = results.filter((r) => r.status === 'rejected').length
            setError(failed ? `${failed} transport collection(s) could not load; showing available live data.` : '')
            setLoading(false)
        })
        return () => { active = false }
    }, [])

    const fleetSummary = useMemo(() => getFleetSummaryFromRows(rows), [rows])
    const sectionSummary = useMemo(() => getSectionSummaryFromRows(activeSection, rows), [activeSection, rows])
    const { columns, rows: tableRows } = useMemo(() => getSectionTableFromRows(activeSection, rows), [activeSection, rows])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>Transport Overview</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    Live transport collections — routes, fleet, drivers, fuel, maintenance, and vehicle documents.
                </p>
                {loading ? <p className='text-sm text-[#667085] mt-2'>Loading transport data…</p> : null}
                {error ? <p className='text-sm text-[#B42318] mt-2'>{error}</p> : null}
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
                    description='Drivers currently active'
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
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm border cursor-pointer ${
                                    isActive
                                        ? 'bg-[#515DEF] text-white border-[#515DEF]'
                                        : 'bg-white text-[#667085] border-[#D9D9D9] hover:border-[#515DEF]'
                                }`}
                            >
                                <Icon size={16} />
                                {section.label}
                            </button>
                        )
                    })}
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mt-4'>
                    {sectionSummary.map((stat) => (
                        <MiniStat key={stat.label} label={stat.label} value={stat.value} />
                    ))}
                </div>

                <div className='relative overflow-x-auto mt-6'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                {columns.map((col, index) => (
                                    <th
                                        key={col.key}
                                        className={`px-3 py-3 text-[#0C1E5B] font-medium uppercase ${index === 0 ? 'rounded-s-lg' : ''} ${index === columns.length - 1 ? 'rounded-e-lg' : ''}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className='px-3 py-8 text-center text-[#667085]'>
                                        No live records in this section yet.
                                    </td>
                                </tr>
                            ) : tableRows.map((row) => (
                                <tr key={row.id || row.vehicleNumber || JSON.stringify(row)} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    {columns.map((col) => (
                                        <td key={col.key} className='px-3 py-3 text-[#667085]'>
                                            {col.key === 'status' && row.status ? (
                                                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${docStatusBadgeColor[row.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                                    {row[col.key]}
                                                </span>
                                            ) : (row[col.key] ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default TransportOverview
