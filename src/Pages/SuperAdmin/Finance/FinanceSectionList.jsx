import React, { useEffect, useMemo } from 'react'
import FinanceDataTable from './Components/FinanceDataTable'
import { getSectionMeta, transactionStatusBadgeColor } from './financeOverviewData'
import { useFinance } from '../../AccountHead/financeDomain/FinanceContext'
import { formatCurrency, formatDisplayDate } from '../../AccountHead/financeDomain/financeHelpers'
import { paymentModeLabel } from '../../AccountHead/financeDomain/financeConstants'
import {
    claimStatusBadgeColor,
    fleetStatusBadgeColor,
} from '../../AccountHead/TransportFinance/transportFinanceData'
import { feeStructureStatusBadgeColor } from '../../AccountHead/FeesManagement/feesManagementData'
import FinanceSnapshotBanner from '../../AccountHead/financeDomain/FinanceSnapshotBanner'

const FinanceSectionList = ({ sectionKey }) => {
    const {
        feeStructures,
        postedInflow,
        transactions,
        wallets,
        transportFleet,
        approvals,
        students,
        receipts,
        chartOfAccounts,
        syncTransportOpsIntoFinance,
        financePersistence,
    } = useFinance()

    useEffect(() => {
        if (sectionKey === 'transport' || sectionKey === 'collections') {
            syncTransportOpsIntoFinance?.().catch(() => {})
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- section open
    }, [sectionKey])

    const meta = useMemo(() => getSectionMeta(sectionKey), [sectionKey])

    const summary = useMemo(() => {
        const inflow = (postedInflow || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
        const outflow = (transactions || [])
            .filter((row) => row.direction === 'OUT')
            .reduce((sum, row) => sum + Number(row.amount || 0), 0)
        switch (sectionKey) {
            case 'fees':
                return [
                    { label: 'Fee structures', value: String(feeStructures?.length || 0) },
                    { label: 'Students on ledger', value: String(students?.length || 0) },
                    { label: 'Receipts', value: String(receipts?.length || 0) },
                    { label: 'Posted inflow', value: formatCurrency(inflow) },
                ]
            case 'collections':
                return [
                    { label: 'Total Inflow', value: formatCurrency(inflow) },
                    { label: 'Total Outflow', value: formatCurrency(outflow) },
                    { label: 'Net', value: formatCurrency(inflow - outflow) },
                    { label: 'Transactions', value: String(transactions?.length || 0) },
                ]
            case 'wallets':
                return [
                    { label: 'Wallets', value: String(wallets?.length || 0) },
                    {
                        label: 'Total held',
                        value: formatCurrency(
                            (wallets || []).reduce(
                                (sum, row) => sum + (Number(String(row.balance || '').replace(/[₹,\s]/g, '')) || 0),
                                0,
                            ),
                        ),
                    },
                    {
                        label: 'Active',
                        value: String((wallets || []).filter((row) => (row.status || 'Active') === 'Active').length),
                    },
                    { label: 'Source', value: financePersistence?.apiEnabled ? 'API' : 'Offline' },
                ]
            case 'transport':
                return [
                    { label: 'Fleet vehicles', value: String(transportFleet?.length || 0) },
                    {
                        label: 'Transport approvals',
                        value: String(
                            (approvals || []).filter(
                                (row) => String(row.department || '').toLowerCase() === 'transport',
                            ).length,
                        ),
                    },
                    {
                        label: 'Pending claims',
                        value: String(
                            (approvals || []).filter(
                                (row) => (
                                    String(row.department || '').toLowerCase() === 'transport'
                                    && (!row.status || String(row.status).toLowerCase() === 'pending')
                                ),
                            ).length,
                        ),
                    },
                    { label: 'Source', value: financePersistence?.apiEnabled ? 'API + TM ops' : 'Offline' },
                ]
            case 'accounting':
                return [
                    { label: 'Chart of accounts', value: String(chartOfAccounts?.length || 0) },
                    { label: 'Transactions', value: String(transactions?.length || 0) },
                    { label: 'Receipts', value: String(receipts?.length || 0) },
                    { label: 'Source', value: financePersistence?.apiEnabled ? 'API' : 'Offline' },
                ]
            case 'reports':
                return [
                    { label: 'Inflow', value: formatCurrency(inflow) },
                    { label: 'Outflow', value: formatCurrency(outflow) },
                    { label: 'Net', value: formatCurrency(inflow - outflow) },
                    { label: 'Txn count', value: String(transactions?.length || 0) },
                ]
            default:
                return []
        }
    }, [
        approvals,
        chartOfAccounts,
        feeStructures,
        financePersistence?.apiEnabled,
        postedInflow,
        receipts,
        sectionKey,
        students,
        transactions,
        transportFleet,
        wallets,
    ])

    const tables = useMemo(() => {
        switch (sectionKey) {
            case 'fees':
                return [
                    {
                        title: 'Fee Structures',
                        columns: [
                            { key: 'id', label: 'Structure ID' },
                            { key: 'className', label: 'Grade' },
                            { key: 'feeHead', label: 'Fee head' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'status', label: 'Status', badge: true, badgeMap: feeStructureStatusBadgeColor },
                        ],
                        rows: (feeStructures || []).map((row) => ({
                            ...row,
                            amount: formatCurrency(row.amount || 0),
                            status: row.status || 'ACTIVE',
                        })),
                    },
                    {
                        title: 'Recent Fee Collections',
                        columns: [
                            { key: 'id', label: 'Txn ID' },
                            { key: 'reference', label: 'Reference' },
                            { key: 'mode', label: 'Mode' },
                            { key: 'amount', label: 'Paid' },
                            { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                        ],
                        rows: (postedInflow || []).slice(0, 12).map((row) => ({
                            id: row.id,
                            reference: row.receiptNo || row.transactionNo || '—',
                            mode: paymentModeLabel(row.paymentMode),
                            amount: formatCurrency(row.amount || 0),
                            status: row.status || 'POSTED',
                        })),
                    },
                ]
            case 'collections':
                return [
                    {
                        title: 'Income Register',
                        columns: [
                            { key: 'id', label: 'Entry ID' },
                            { key: 'date', label: 'Date' },
                            { key: 'source', label: 'Source' },
                            { key: 'reference', label: 'Reference' },
                            { key: 'mode', label: 'Mode' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                        ],
                        rows: (postedInflow || []).map((row) => ({
                            id: row.id,
                            date: formatDisplayDate(row.transactionDate),
                            source: row.category || 'Student Fees',
                            reference: row.receiptNo || row.transactionNo || '—',
                            mode: paymentModeLabel(row.paymentMode),
                            amount: `+${formatCurrency(row.amount || 0)}`,
                            status: row.status === 'POSTED' ? 'Cleared' : (row.status || 'Processing'),
                        })),
                    },
                    {
                        title: 'Expense Register',
                        columns: [
                            { key: 'id', label: 'Entry ID' },
                            { key: 'date', label: 'Date' },
                            { key: 'category', label: 'Category' },
                            { key: 'paidTo', label: 'Paid To' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                        ],
                        rows: (transactions || [])
                            .filter((row) => row.direction === 'OUT')
                            .map((row) => ({
                                id: row.id,
                                date: formatDisplayDate(row.transactionDate),
                                category: row.category || row.sourceModule || 'Expense',
                                paidTo: row.narration || '—',
                                amount: `−${formatCurrency(row.amount || 0)}`,
                                status: row.status === 'POSTED' ? 'Paid' : (row.status || 'Processing'),
                            })),
                    },
                ]
            case 'wallets':
                return [
                    {
                        title: 'User Wallets',
                        columns: [
                            { key: 'walletId', label: 'Wallet ID' },
                            { key: 'name', label: 'Name' },
                            { key: 'role', label: 'Role' },
                            { key: 'balance', label: 'Balance' },
                            { key: 'lastRecharge', label: 'Last Recharge' },
                            { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                        ],
                        rows: wallets || [],
                    },
                ]
            case 'transport':
                return [
                    {
                        title: 'Fleet Vehicles',
                        columns: [
                            { key: 'regNo', label: 'Reg. No.' },
                            { key: 'type', label: 'Type' },
                            { key: 'route', label: 'Route' },
                            { key: 'driver', label: 'Driver' },
                            { key: 'nextServiceDue', label: 'Next Service' },
                            { key: 'status', label: 'Status', badge: true, badgeMap: fleetStatusBadgeColor },
                        ],
                        rows: transportFleet || [],
                    },
                    {
                        title: 'Fuel & Expense Claims',
                        columns: [
                            { key: 'id', label: 'Claim ID' },
                            { key: 'claimant', label: 'Claimant' },
                            { key: 'vehicle', label: 'Vehicle' },
                            { key: 'type', label: 'Type' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'status', label: 'Status', badge: true, badgeMap: claimStatusBadgeColor },
                        ],
                        rows: (approvals || [])
                            .filter((row) => String(row.department || '').toLowerCase() === 'transport')
                            .map((row) => ({
                                id: row.linkedRequestId || row.id,
                                claimant: row.raisedBy,
                                vehicle: row.vehicle || '—',
                                type: row.type,
                                amount: row.amount,
                                status: row.status || 'Pending',
                            })),
                    },
                ]
            case 'accounting':
                return [
                    {
                        title: 'Recent transactions',
                        columns: [
                            { key: 'id', label: 'Txn' },
                            { key: 'date', label: 'Date' },
                            { key: 'direction', label: 'Direction' },
                            { key: 'category', label: 'Category' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                        ],
                        rows: (transactions || []).slice(0, 20).map((row) => ({
                            id: row.transactionNo || row.id,
                            date: formatDisplayDate(row.transactionDate),
                            direction: row.direction || 'IN',
                            category: row.category || row.sourceModule || '—',
                            amount: formatCurrency(row.amount || 0),
                            status: row.status || 'POSTED',
                        })),
                    },
                ]
            case 'reports':
                return [
                    {
                        title: 'Income by category',
                        columns: [
                            { key: 'category', label: 'Category' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'count', label: 'Txns' },
                        ],
                        rows: (() => {
                            const map = new Map()
                            ;(postedInflow || []).forEach((row) => {
                                const key = row.category || 'Other'
                                const prev = map.get(key) || { category: key, amount: 0, count: 0 }
                                prev.amount += Number(row.amount) || 0
                                prev.count += 1
                                map.set(key, prev)
                            })
                            return [...map.values()].map((row) => ({
                                ...row,
                                amount: formatCurrency(row.amount),
                            }))
                        })(),
                    },
                    {
                        title: 'Expenditure by category',
                        columns: [
                            { key: 'category', label: 'Category' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'count', label: 'Txns' },
                        ],
                        rows: (() => {
                            const map = new Map()
                            ;(transactions || [])
                                .filter((row) => row.direction === 'OUT')
                                .forEach((row) => {
                                    const key = row.category || row.sourceModule || 'Other'
                                    const prev = map.get(key) || { category: key, amount: 0, count: 0 }
                                    prev.amount += Number(row.amount) || 0
                                    prev.count += 1
                                    map.set(key, prev)
                                })
                            return [...map.values()].map((row) => ({
                                ...row,
                                amount: formatCurrency(row.amount),
                            }))
                        })(),
                    },
                ]
            default:
                return []
        }
    }, [
        approvals,
        feeStructures,
        postedInflow,
        sectionKey,
        transactions,
        transportFleet,
        wallets,
    ])

    if (!meta || sectionKey === 'overview') {
        return null
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>{meta.label}</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    Live oversight from Account Head finance snapshot (and TM ops for transport).
                </p>
                <FinanceSnapshotBanner mockNote='Super Admin finance sections read the same GET /finance/state snapshot — not demo constants.' />
            </div>

            {summary.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {summary.map((item) => (
                        <div key={item.label} className='bg-white rounded-2xl shadow-md p-4'>
                            <p className='text-sm font-medium text-[#808080]'>{item.label}</p>
                            <p className='text-2xl font-semibold text-[#515DEF] mt-2'>{item.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {tables.map((table) => (
                <FinanceDataTable
                    key={table.title}
                    title={table.title}
                    columns={table.columns}
                    rows={table.rows}
                />
            ))}
        </section>
    )
}

export default FinanceSectionList
