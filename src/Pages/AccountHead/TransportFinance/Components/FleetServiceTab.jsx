import React from 'react'
import { Plus, Search } from 'lucide-react'
import {
    FLEET_SUMMARY,
    FLEET_VEHICLES,
    fleetStatusBadgeColor,
} from '../transportFinanceData'
import {
    StaffAvatar,
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './TransportShared'

const FleetServiceTab = ({ onAddVehicle }) => (
    <div className='space-y-6'>
        <SummaryCards cards={FLEET_SUMMARY} />

        <TableCard
            title='Vehicle fleet register'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <div className='relative min-w-[180px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input
                            type='text'
                            placeholder='Search vehicle / reg. no...'
                            className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                        />
                    </div>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[110px]'>
                        <option>All Types</option>
                        <option>Bus</option>
                        <option>Van</option>
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[110px]'>
                        <option>All Status</option>
                        <option>Active</option>
                        <option>In Service</option>
                        <option>Idle</option>
                    </select>
                    <button
                        type='button'
                        onClick={onAddVehicle}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Plus size={16} />
                        Add Vehicle
                    </button>
                </div>
            )}
            footer={<TablePagination summary='18 vehicles total' />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Reg. No.</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>Route</th>
                        <th className={thClass}>Driver</th>
                        <th className={thClass}>Last Service</th>
                        <th className={thClass}>Next Service Due</th>
                        <th className={thClass}>Odometer</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-e-lg`}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {FLEET_VEHICLES.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-mono text-xs text-[#1E1E1E]`}>{row.regNo}</td>
                            <td className={tdClass}>{row.type}</td>
                            <td className={tdClass}>{row.route}</td>
                            <td className={tdClass}>
                                <StaffAvatar initials={row.driverInitials} name={row.driver} />
                            </td>
                            <td className={tdClass}>{row.lastService}</td>
                            <td className={tdClass}>{row.nextServiceDue}</td>
                            <td className={tdClass}>{row.odometer}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${fleetStatusBadgeColor[row.status]}`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <button type='button' className='text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'>
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
)

export default FleetServiceTab
