import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { pullFinanceState } from '../../../../services/financeApi'
import { formatCurrency } from '../../../AccountHead/financeDomain/financeHelpers'

const COLUMNS = [
    { key: 'className', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'feeHead', label: 'Fee Head' },
    { key: 'amount', label: 'Amount' },
    { key: 'academicYear', label: 'Academic Year' },
]

export default function ClassFeeDetails() {
    const loadRows = useCallback(async () => {
        const state = await pullFinanceState()
        const data = state?.data || state || {}
        const structures = Array.isArray(data.feeStructures) ? data.feeStructures : []
        const heads = Array.isArray(data.feeHeads) ? data.feeHeads : []
        const headName = (id) => heads.find((h) => String(h.id) === String(id))?.name || id || 'Fee'

        if (structures.length) {
            return structures.flatMap((row, index) => {
                const items = Array.isArray(row.items || row.heads || row.components) ? (row.items || row.heads || row.components) : [row]
                return items.map((item, itemIndex) => ({
                    id: `${row.id || index}-${itemIndex}`,
                    className: row.className || row.class_name || row.grade || '—',
                    section: row.section || row.sectionName || 'All',
                    feeHead: item.name || headName(item.feeHeadId || item.headId) || '—',
                    amount: formatCurrency(item.amount || item.value || row.amount || 0),
                    academicYear: row.academicYear || row.year || '—',
                }))
            })
        }

        const installments = Array.isArray(data.installments) ? data.installments : []
        const byClass = new Map()
        installments.forEach((row) => {
            const key = `${row.className || row.class_name || '—'}|${row.section || 'All'}|${row.feeHead || row.category || 'Fee'}`
            const current = byClass.get(key) || {
                id: key,
                className: row.className || row.class_name || '—',
                section: row.section || 'All',
                feeHead: row.feeHead || row.category || 'Fee',
                amountValue: 0,
                academicYear: row.academicYear || '—',
            }
            current.amountValue += Number(row.amount || row.netAmount || row.balanceAmount || 0)
            byClass.set(key, current)
        })
        return [...byClass.values()].map((row) => ({
            ...row,
            amount: formatCurrency(row.amountValue),
        }))
    }, [])

    return (
        <AdminLiveDataList
            title='Class Fee Details'
            description='Live fee structures / installment totals from finance state.'
            columns={COLUMNS}
            loadRows={loadRows}
            searchKeys={['className', 'section', 'feeHead']}
            addPath='/admin/student/add-class-fee-details'
        />
    )
}
