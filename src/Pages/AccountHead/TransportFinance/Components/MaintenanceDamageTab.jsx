import React from 'react'
import { Download, Plus, Search } from 'lucide-react'
import {
    DAMAGE_BREAKDOWN,
    MAINTENANCE_RECORDS,
    MAINTENANCE_SPEND,
    MAINTENANCE_SUMMARY,
    maintenanceStatusBadgeColor,
    maintenanceTypeBadgeColor,
} from '../transportFinanceData'
import {
    Panel,
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './TransportShared'

const MaintenanceDamageTab = ({ onLogDamage }) => (
    <div className='space-y-6'>
        <SummaryCards cards={MAINTENANCE_SUMMARY} />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Panel
                title='Maintenance spend by vehicle'
                action={(
                    <button type='button' className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                        Full report
                    </button>
                )}
            >
                <div className='space-y-4'>
                    {MAINTENANCE_SPEND.map((item) => (
                        <div key={item.vehicle}>
                            <div className='flex items-center justify-between text-sm mb-1.5'>
                                <span className='text-[#667085]'>{item.vehicle}</span>
                                <span className='font-semibold text-[#1E1E1E]'>{item.amount}</span>
                            </div>
                            <div className='h-2 rounded-full bg-[#EDEEF5] overflow-hidden'>
                                <div
                                    className={`h-full rounded-full ${item.warn ? 'bg-[#FF5722]' : 'bg-[#515DEF]'}`}
                                    style={{ width: `${item.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Panel>

            <Panel title='Damage report breakdown'>
                <div className='space-y-3'>
                    {DAMAGE_BREAKDOWN.map((item) => (
                        <div key={item.label} className='flex items-center justify-between text-sm'>
                            <span className='text-[#667085]'>{item.label}</span>
                            <span className='font-semibold text-[#1E1E1E]'>
                                {item.amount}
                                <span className='text-xs font-normal text-[#667085] ml-1'>({item.cases} cases)</span>
                            </span>
                        </div>
                    ))}
                </div>
                <button
                    type='button'
                    onClick={onLogDamage}
                    className='w-full mt-6 inline-flex items-center justify-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer'
                >
                    <Plus size={16} />
                    Log Damage / Maintenance
                </button>
            </Panel>
        </div>

        <TableCard
            title='Maintenance & damage records'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <div className='relative min-w-[160px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input
                            type='text'
                            placeholder='Search vehicle...'
                            className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                        />
                    </div>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        <option>All Types</option>
                        <option>Routine Service</option>
                        <option>Repair</option>
                        <option>Damage</option>
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        <option>All Status</option>
                        <option>Completed</option>
                        <option>In Progress</option>
                        <option>Pending Approval</option>
                    </select>
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            )}
            footer={<TablePagination summary='42 records this year' />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Vehicle</th>
                        <th className={thClass}>Date</th>
                        <th className={thClass}>Description</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>Vendor / Garage</th>
                        <th className={thClass}>Cost</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-e-lg`}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {MAINTENANCE_RECORDS.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{row.vehicle}</td>
                            <td className={tdClass}>{row.date}</td>
                            <td className={tdClass}>{row.description}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${maintenanceTypeBadgeColor[row.type]}`}>
                                    {row.type}
                                </span>
                            </td>
                            <td className={tdClass}>{row.vendor}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.cost}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${maintenanceStatusBadgeColor[row.status]}`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <button type='button' className='text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'>
                                    {row.status === 'Pending Approval' ? 'Review' : 'View'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
)

export default MaintenanceDamageTab
