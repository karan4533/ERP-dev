import React, { useEffect, useMemo, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    COMPLIANCE_DOCS,
    COMPLIANCE_SUMMARY,
    complianceStatusBadgeColor,
} from '../transportFinanceData'
import {
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './TransportShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { getCampusMemory, hydrateCampusKey, usesCampusApiForKey } from '../../../../services/campusJsonStore'

const VEHICLES_KEY = 'schoolerp-transport-vehicles-v1'

const ComplianceTab = () => {
    const {
        financePersistence,
        transportCompliance,
        setTransportCompliance,
        transportFleet,
        flushFinanceToApi,
    } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)
    const [docType, setDocType] = useState('Insurance')
    const [vehicle, setVehicle] = useState('')
    const [validTill, setValidTill] = useState('')
    const [saving, setSaving] = useState(false)
    const [opsRegNos, setOpsRegNos] = useState([])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            if (usesCampusApiForKey(VEHICLES_KEY)) {
                await hydrateCampusKey(VEHICLES_KEY, [])
            }
            if (cancelled) return
            const rows = getCampusMemory(VEHICLES_KEY) || []
            setOpsRegNos(
                rows
                    .map((row) => row.vehicleNumber || row.regNo || '')
                    .map((value) => String(value).trim())
                    .filter(Boolean),
            )
        })()
        return () => { cancelled = true }
    }, [])

    const fleetOptions = useMemo(() => {
        const fromFinance = (transportFleet || []).map((row) => row.regNo).filter(Boolean)
        const merged = [...new Set([...fromFinance, ...opsRegNos])]
        return merged.length ? merged : ['Unassigned']
    }, [opsRegNos, transportFleet])
    const docs = useMemo(() => {
        if (apiLive) return transportCompliance || []
        return transportCompliance?.length ? transportCompliance : COMPLIANCE_DOCS
    }, [apiLive, transportCompliance])

    const summary = useMemo(() => {
        const expiring = docs.filter((row) => /expir|due|soon/i.test(row.status || '')).length
        return [
            { label: 'Documents on snapshot', value: String(docs.length), sub: apiLive ? 'transportCompliance' : 'Local + snapshot', iconTone: 'info' },
            { label: 'Expiring / attention', value: String(expiring), sub: 'Status keywords', iconTone: 'warning' },
            { label: 'Fleet vehicles', value: String(transportFleet?.length || 0), sub: 'Linked register', iconTone: 'success' },
            { label: 'Mode', value: apiLive ? 'API' : 'Offline', sub: 'Finance snapshot', iconTone: 'success' },
        ]
    }, [apiLive, docs, transportFleet])

    const handleAdd = async () => {
        const reg = vehicle || fleetOptions[0]
        if (!validTill) {
            toast.error('Valid-till date is required.')
            return
        }
        const row = {
            id: `TC-${Date.now().toString().slice(-8)}`,
            vehicle: reg,
            type: docType,
            validTill,
            status: 'Valid',
            documentNo: `${docType.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`,
        }
        const next = [row, ...(transportCompliance || [])]
        setSaving(true)
        setTransportCompliance(next)
        const persist = await flushFinanceToApi({ transportCompliance: next })
        setSaving(false)
        if (persist?.success === false) {
            toast.error(persist.message || 'Saved locally — API push failed.')
        } else {
            toast.success(persist?.api ? 'Compliance doc saved to finance API.' : 'Compliance document added.')
        }
        setValidTill('')
    }

    return (
        <div className='space-y-6'>
            {apiLive ? (
                <p className='text-sm text-[#667085] bg-[#F8FAFC] border border-[#E4E7EC] rounded-xl px-4 py-3'>
                    Compliance documents persist on campus finance snapshot (`transportCompliance`) via PUT /finance/state.
                </p>
            ) : (
                <p className='text-sm text-[#B8860B] bg-[#FFF8E7] border border-[#F5E6B8] rounded-xl px-4 py-3'>
                    OFFLINE DEMO — seed compliance rows show until you add live documents.
                </p>
            )}
            <SummaryCards cards={apiLive || docs.length ? summary : COMPLIANCE_SUMMARY} />

            <TableCard
                title='Compliance & documentation register'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3'>
                        <select
                            value={vehicle || fleetOptions[0]}
                            onChange={(event) => setVehicle(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                        >
                            {fleetOptions.map((reg) => (
                                <option key={reg} value={reg}>{reg}</option>
                            ))}
                        </select>
                        <select
                            value={docType}
                            onChange={(event) => setDocType(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'
                        >
                            <option>Insurance</option>
                            <option>Fitness</option>
                            <option>Permit</option>
                            <option>Pollution</option>
                        </select>
                        <input
                            type='date'
                            value={validTill}
                            onChange={(event) => setValidTill(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2'
                        />
                        <button
                            type='button'
                            disabled={saving}
                            onClick={handleAdd}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer disabled:opacity-60'
                        >
                            <Plus size={16} />
                            {saving ? 'Saving…' : 'Add document'}
                        </button>
                        <button type='button' className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md cursor-pointer'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                )}
                footer={<TablePagination summary={`${docs.length} documents`} />}
            >
                <table className='w-full text-sm text-left mt-4'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Vehicle</th>
                            <th className={thClass}>Type</th>
                            <th className={thClass}>Valid till</th>
                            <th className={thClass}>Doc no.</th>
                            <th className={`${thClass} rounded-e-lg`}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {docs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className={`${tdClass} text-[#667085]`}>
                                    No compliance documents on the snapshot yet.
                                </td>
                            </tr>
                        ) : docs.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg`}>{row.vehicle || row.regNo}</td>
                                <td className={tdClass}>{row.type}</td>
                                <td className={tdClass}>{row.validTill || row.expiry || '—'}</td>
                                <td className={tdClass}>{row.documentNo || '—'}</td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${complianceStatusBadgeColor[row.status] || 'bg-[#4CAF5033] text-[#4CAF50]'}`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableCard>
        </div>
    )
}

export default ComplianceTab
