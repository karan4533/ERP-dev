import React, { useEffect, useMemo, useState } from 'react'
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
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import {
    getServiceExpenses,
    hydrateTransportExpensesFromApi,
} from '../../../TransportManager/TransportExpenses/transportExpensesData'
import { mapServiceExpensesToFinanceRows } from '../../../TransportManager/RequestApprovals/transportApprovalFinanceBridge'

const MaintenanceDamageTab = ({ onLogDamage }) => {
    const { financePersistence, transportMaintenance, syncTransportOpsIntoFinance } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)
    const [opsServiceRows, setOpsServiceRows] = useState(() => mapServiceExpensesToFinanceRows(getServiceExpenses()))

    useEffect(() => {
        hydrateTransportExpensesFromApi().finally(() => {
            setOpsServiceRows(mapServiceExpensesToFinanceRows(getServiceExpenses()))
        })
        syncTransportOpsIntoFinance?.().catch(() => {})
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount sync
    }, [])

    const records = useMemo(() => {
        const snapshot = transportMaintenance?.length
            ? transportMaintenance
            : (apiLive ? [] : MAINTENANCE_RECORDS)
        const byId = new Map()
        ;[...opsServiceRows, ...snapshot].forEach((row) => {
            const key = row.linkedRequestId || row.id
            if (!byId.has(key)) byId.set(key, row)
        })
        return [...byId.values()]
    }, [apiLive, opsServiceRows, transportMaintenance])

    const summary = useMemo(() => {
        const total = records.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
        const damage = records.filter((row) => /damage/i.test(row.type || '')).length
        const vehicles = new Set(records.map((row) => row.vehicle).filter(Boolean)).size
        return [
            { label: 'Records on snapshot', value: String(records.length), sub: apiLive ? 'transportMaintenance' : 'Local + snapshot', iconTone: 'info' },
            { label: 'Logged spend', value: formatCurrency(total), sub: 'Sum of costs', iconTone: 'success' },
            { label: 'Damage rows', value: String(damage), sub: 'Type = Damage', iconTone: 'warning' },
            { label: 'Vehicles tracked', value: String(vehicles), sub: 'Distinct reg. nos', iconTone: 'info' },
        ]
    }, [apiLive, records])

    const spendByVehicle = useMemo(() => {
        const map = new Map()
        records.forEach((row) => {
            const key = row.vehicle || '—'
            map.set(key, (map.get(key) || 0) + (Number(row.amount) || 0))
        })
        const rows = [...map.entries()].map(([vehicle, amount]) => ({ vehicle, amount, value: amount }))
        const max = Math.max(...rows.map((row) => row.amount), 1)
        return rows.map((row) => ({
            ...row,
            amount: formatCurrency(row.amount),
            value: Math.round((row.value / max) * 100),
            warn: row.value === max && rows.length > 1,
        }))
    }, [records])

    return (
        <div className='space-y-6'>
            {apiLive ? (
                <p className='text-sm text-[#667085] bg-[#F8FAFC] border border-[#E4E7EC] rounded-xl px-4 py-3'>
                    Maintenance & damage rows persist on campus finance snapshot (`transportMaintenance`) and post cash expense lines to Day Book / GL.
                </p>
            ) : (
                <p className='text-sm text-[#B8860B] bg-[#FFF8E7] border border-[#F5E6B8] rounded-xl px-4 py-3'>
                    OFFLINE DEMO — seed rows show until you log live maintenance records.
                </p>
            )}
            <SummaryCards cards={apiLive || records.length ? summary : MAINTENANCE_SUMMARY} />

            {!apiLive && !transportMaintenance?.length && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <Panel title='Maintenance spend by vehicle'>
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
                    <Panel title='Damage breakdown'>
                        <div className='space-y-3'>
                            {DAMAGE_BREAKDOWN.map((item) => (
                                <div key={item.label} className='flex items-center justify-between text-sm'>
                                    <span className='text-[#667085]'>{item.label}</span>
                                    <span className='font-semibold text-[#1E1E1E]'>{item.amount}</span>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>
            )}

            {spendByVehicle.length > 0 && (
                <Panel title='Maintenance spend by vehicle (snapshot)'>
                    <div className='space-y-4'>
                        {spendByVehicle.map((item) => (
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
            )}

            <TableCard
                title='Maintenance & damage records'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <div className='relative min-w-[160px]'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input type='text' placeholder='Search vehicle...' className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2' />
                        </div>
                        <button
                            type='button'
                            onClick={onLogDamage}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer'
                        >
                            <Plus size={16} />
                            Log damage
                        </button>
                        <button type='button' className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md cursor-pointer'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                )}
                footer={<TablePagination summary={`${records.length} records`} />}
            >
                <table className='w-full text-sm text-left mt-4'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Vehicle</th>
                            <th className={thClass}>Type</th>
                            <th className={thClass}>Date</th>
                            <th className={thClass}>Status</th>
                            <th className={`${thClass} rounded-e-lg`}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={5} className={`${tdClass} text-[#667085]`}>
                                    No maintenance records yet. Use Log damage to write to the finance API.
                                </td>
                            </tr>
                        ) : records.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg`}>{row.vehicle}</td>
                                <td className={tdClass}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${maintenanceTypeBadgeColor[row.type] || ''}`}>{row.type}</span>
                                </td>
                                <td className={tdClass}>{row.date || '—'}</td>
                                <td className={tdClass}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${maintenanceStatusBadgeColor[row.status] || 'bg-[#515DEF33] text-[#515DEF]'}`}>{row.status}</span>
                                </td>
                                <td className={`${tdClass} rounded-e-lg font-semibold`}>{row.cost || formatCurrency(row.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableCard>
        </div>
    )
}

export default MaintenanceDamageTab
