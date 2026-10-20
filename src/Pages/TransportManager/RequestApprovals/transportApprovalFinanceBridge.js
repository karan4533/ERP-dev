import { formatCurrency, parseRupeeAmount } from '../../AccountHead/financeDomain/financeHelpers'
import { loadFinanceState, saveFinanceState } from '../../AccountHead/financeDomain/financeStorage'
import { upsertTransportExpense } from '../TransportExpenses/transportExpensesData'

const toAmountLabel = (value) => {
    const numeric = parseRupeeAmount(value)
    if (numeric > 0) return formatCurrency(numeric)
    const raw = String(value || '').trim()
    return raw || formatCurrency(0)
}

const isoDateFromTransport = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return new Date().toISOString().slice(0, 10)
    const sep = raw.includes('/') ? '/' : '-'
    const parts = raw.split(sep).map(Number)
    if (parts.length !== 3) return new Date().toISOString().slice(0, 10)
    const [day, month, year] = parts
    if (!day || !month || !year) return new Date().toISOString().slice(0, 10)
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildFinanceMaintenanceRow(approval, amountLabel, amount) {
    return {
        id: `TM-${String(approval.requestId || approval.id || Date.now()).replace(/\W/g, '')}`,
        vehicle: approval.vehicleNumber || '—',
        type: approval.serviceType || approval.issueType || 'Routine Service',
        date: isoDateFromTransport(approval.requestDate),
        description: approval.description || approval.issueType || 'Vehicle maintenance',
        vendor: approval.serviceCenter || '—',
        cost: amountLabel,
        amount,
        status: 'Completed',
        linkedRequestId: approval.requestId || approval.id,
        source: 'principal-approved-maintenance',
    }
}

function buildFinanceApprovalRow(approval, amountLabel) {
    return {
        id: `APR-${String(approval.requestId || approval.id || Date.now()).replace(/\W/g, '')}`,
        raisedBy: approval.reportedBy || 'Transport Manager',
        initials: 'TM',
        department: 'Transport',
        type: 'Service',
        amount: amountLabel,
        raisedOn: approval.requestDate || new Date().toLocaleDateString('en-IN'),
        status: 'Approved',
        vehicle: approval.vehicleNumber || '—',
        decidedAt: new Date().toISOString(),
        linkedRequestId: approval.requestId || approval.id,
        detail: {
            raisedByFull: approval.reportedBy || 'Transport Manager',
            department: 'Transport',
            claimType: approval.serviceType || approval.issueType || 'Vehicle maintenance',
            vehicle: approval.vehicleNumber || '—',
            amount: amountLabel,
            submittedOn: approval.requestDate || '',
            serviceCenter: approval.serviceCenter || '—',
        },
    }
}

function mergeById(list, row) {
    const next = Array.isArray(list) ? [...list] : []
    const idx = next.findIndex((item) => String(item.id) === String(row.id)
        || (row.linkedRequestId && String(item.linkedRequestId) === String(row.linkedRequestId)))
    if (idx >= 0) next[idx] = { ...next[idx], ...row }
    else next.unshift(row)
    return next
}

/**
 * After Principal approves: store ops expense (service or fuel).
 * Finance Panel reads these via ops merge — Principal has no finance.write, so we do not call /finance/state.
 */
export async function postApprovedMaintenanceToFinance(approval) {
    if (!approval) return { success: false, message: 'Missing approval record.' }

    const requestId = approval.requestId || approval.id
    const isFuel = String(requestId || '').startsWith('FR-')
    const amountLabel = toAmountLabel(
        approval.estimatedCost || approval.amount || (isFuel ? approval.requestedQuantity : '')
    )
    const amount = parseRupeeAmount(amountLabel)

    const expenseResult = await upsertTransportExpense(
        isFuel
            ? {
                id: approval.linkedExpenseId || undefined,
                vehicleNumber: approval.vehicleNumber || '',
                driverName: approval.driverName || approval.reportedBy || '',
                fuelDate: approval.requestedDate || approval.requestDate || '',
                fuelStation: approval.fuelStation || '—',
                fuelQuantity: approval.requestedQuantity || '',
                amount: amountLabel,
                paymentMode: approval.paymentMode || 'UPI',
                linkedRequestId: requestId,
                source: 'principal-approved-fuel',
                status: 'Posted',
            }
            : {
                id: approval.linkedExpenseId || undefined,
                vehicleNumber: approval.vehicleNumber || '',
                serviceType: approval.serviceType || approval.issueType || 'General Maintenance',
                serviceDate: approval.requestDate || '',
                serviceCenter: approval.serviceCenter || '—',
                amount: amountLabel,
                invoiceNumber: `INV-${requestId}`,
                remarks: approval.description || `Principal-approved maintenance ${requestId}`,
                linkedRequestId: requestId,
                source: 'principal-approved-maintenance',
                status: 'Posted',
            },
        isFuel ? 'FE-' : 'SE-'
    )

    if (expenseResult?.success === false) {
        return {
            success: false,
            message: expenseResult.message || 'Could not save transport expense (API forbidden).',
            expense: null,
            finance: { success: false, api: true },
            linkedExpenseId: null,
        }
    }

    const maintenanceRow = isFuel
        ? null
        : buildFinanceMaintenanceRow(approval, amountLabel, amount)
    const financeApprovalRow = {
        ...buildFinanceApprovalRow(approval, amountLabel),
        type: isFuel ? 'Fuel' : 'Service',
    }

    // Browser cache only — Account Head Transport Finance merges live ops expenses/approvals.
    const saved = loadFinanceState()
    const data = { ...(saved?.data || {}) }
    if (maintenanceRow) {
        data.transportMaintenance = mergeById(data.transportMaintenance, maintenanceRow)
    }
    data.approvals = mergeById(data.approvals, financeApprovalRow)
    saveFinanceState(data)

    return {
        success: true,
        expense: expenseResult?.record || null,
        finance: { success: true, api: false, localCache: true },
        linkedExpenseId: expenseResult?.record?.id || null,
    }
}

/** Map ops service expenses into Finance Maintenance & Damage table shape. */
export function mapServiceExpensesToFinanceRows(expenses = []) {
    return (expenses || [])
        .filter((row) => String(row.id || '').startsWith('SE-') || row.source === 'principal-approved-maintenance')
        .map((row) => ({
            id: row.id,
            vehicle: row.vehicleNumber || '—',
            type: row.serviceType || 'Routine Service',
            date: row.serviceDate || '—',
            description: row.remarks || row.serviceType || 'Service expense',
            vendor: row.serviceCenter || '—',
            cost: row.amount,
            amount: parseRupeeAmount(row.amount),
            status: row.status || 'Completed',
            linkedRequestId: row.linkedRequestId,
            source: row.source || 'transport-expenses',
        }))
}

/** Map approved transport approval requests into Fuel & Expense Claims rows. */
export function mapApprovalsToFinanceClaims(approvals = []) {
    return (approvals || [])
        .filter((row) => {
            const status = String(row.status || '').toLowerCase()
            return status === 'approved' || status === 'completed'
        })
        .map((row) => ({
            id: row.requestId || row.id,
            claimant: row.reportedBy || row.driverName || 'Transport Manager',
            initials: String(row.reportedBy || row.driverName || 'TM')
                .split(/\s+/)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'TM',
            vehicle: row.vehicleNumber || '—',
            type: String(row.id || row.requestId || '').startsWith('FR-') ? 'Fuel' : 'Service',
            date: row.requestDate || row.requestedDate || '—',
            amount: toAmountLabel(row.estimatedCost || row.amount || row.requestedQuantity),
            status: 'Approved',
        }))
}
