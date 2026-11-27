/**
 * Merge Transport Manager campus ops into Account Head finance snapshot collections.
 * Principal posts expenses to ops only (no finance.write); Finance Head syncs them here.
 */
import { formatCurrency, parseRupeeAmount } from './financeHelpers'
import {
    getFuelRequests,
    getMaintenanceRequests,
    hydrateTransportApprovalRequestsFromApi,
} from '../../TransportManager/RequestApprovals/requestApprovalsData'
import {
    getTransportExpenses,
    hydrateTransportExpensesFromApi,
} from '../../TransportManager/TransportExpenses/transportExpensesData'
import { PAYMENT_MODES, SOURCE_MODULES, TRANSACTION_DIRECTIONS, TRANSACTION_STATUSES } from './financeConstants'
import {
    mapServiceExpensesToFinanceRows,
} from '../../TransportManager/RequestApprovals/transportApprovalFinanceBridge'
import {
    getVehicles,
    hydrateVehiclesFromApi,
} from '../../TransportManager/VehicleManagement/vehicleManagementData'

const initialsOf = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return 'TM'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const amountLabel = (row) => {
    const numeric = parseRupeeAmount(row.estimatedCost || row.amount || row.requestedQuantity || '')
    if (numeric > 0) return formatCurrency(numeric)
    const raw = String(row.estimatedCost || row.amount || row.requestedQuantity || '').trim()
    return raw || formatCurrency(0)
}

const financeStatusFromOps = (status) => {
    const value = String(status || '').trim().toLowerCase()
    if (value === 'rejected') return 'Rejected'
    if (value === 'approved' || value === 'completed') return 'Approved'
    if (value === 'awaiting principal') return 'Pending'
    if (value === 'in-process' || value === 'in process') return 'Pending'
    return 'Pending'
}

/** Map TM/Principal approval rows into Finance Approvals shape. */
export function mapOpsRequestToFinanceApproval(row) {
    const requestId = String(row.requestId || row.id || '').trim()
    const isFuel = requestId.startsWith('FR-')
    const amount = amountLabel(row)
    const raisedBy = row.reportedBy || row.driverName || 'Transport Manager'
    return {
        id: requestId ? `APR-${requestId.replace(/\W/g, '')}` : `APR-${Date.now()}`,
        linkedRequestId: requestId,
        raisedBy,
        initials: initialsOf(raisedBy),
        department: 'Transport',
        type: isFuel ? 'Fuel Claim' : (row.issueType || row.serviceType || 'Service'),
        amount,
        raisedOn: row.requestDate || row.requestedDate || '',
        status: financeStatusFromOps(row.status),
        vehicle: row.vehicleNumber || '—',
        decidedAt: row.principalApprovedAt || row.tmApprovedAt || row.decidedAt || '',
        decidedBy: row.principalApprovedAt ? 'Principal' : (row.tmApprovedAt ? 'Transport Manager' : ''),
        remarks: row.remarks || '',
        detail: {
            raisedByFull: raisedBy,
            department: 'Transport',
            claimType: isFuel ? 'Fuel reimbursement' : (row.issueType || row.serviceType || 'Vehicle maintenance'),
            vehicle: row.vehicleNumber || '—',
            amount,
            submittedOn: row.requestDate || row.requestedDate || '',
            document: row.document || '—',
            serviceCenter: row.serviceCenter || '',
        },
        source: 'transport-ops',
    }
}

export function mapOpsVehicleToFleetRow(vehicle) {
    const regNo = vehicle.vehicleNumber || vehicle.regNo || ''
    const driver = vehicle.driverName || vehicle.driver || '—'
    return {
        id: vehicle.id || `V-${regNo}`,
        regNo,
        type: vehicle.category || vehicle.vehicleType || vehicle.type || 'Bus',
        route: vehicle.routeName || vehicle.route || 'Unassigned',
        driver,
        driverInitials: initialsOf(driver),
        lastService: vehicle.lastServiceDate || vehicle.lastService || '—',
        nextServiceDue: vehicle.nextServiceDue || vehicle.nextService || '—',
        odometer: vehicle.odometerReading || vehicle.odometer || '—',
        status: vehicle.status || 'Active',
        source: 'transport-ops',
    }
}

export const mergeByKey = (base = [], extra = [], keyFn) => {
    const map = new Map()
    ;[...base, ...extra].forEach((row) => {
        const key = keyFn(row)
        if (!key) return
        const prev = map.get(key) || {}
        map.set(key, { ...prev, ...row })
    })
    return [...map.values()]
}

/** Ensure every finance student has a wallet row (API-safe, no demo names). */
export function ensureWalletsFromStudents(students = [], wallets = []) {
    const byEmail = new Map(
        (wallets || []).map((row) => [String(row.email || '').toLowerCase(), row]),
    )
    const next = [...(wallets || [])]
    students.forEach((student) => {
        const email = String(student.email || '').trim().toLowerCase()
        if (!email || byEmail.has(email)) return
        const name = student.name || student.shortName || 'Student'
        const row = {
            id: `UW-${student.id}`,
            name,
            email: student.email,
            initials: initialsOf(name),
            role: 'Student',
            walletId: `WLT-${String(student.id).replace(/\W/g, '').slice(-8) || Date.now()}`,
            balance: '₹0',
            lastRecharge: '—',
            status: 'Zero Balance',
            studentId: student.id,
            source: 'finance-student',
        }
        byEmail.set(email, row)
        next.push(row)
    })
    return next
}

const isoDateFromTransport = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return new Date().toISOString().slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
    const sep = raw.includes('/') ? '/' : '-'
    const parts = raw.split(sep).map(Number)
    if (parts.length !== 3) return new Date().toISOString().slice(0, 10)
    const [day, month, year] = parts
    if (!day || !month || !year) return new Date().toISOString().slice(0, 10)
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Parse ₹ / L / % labels into a rupee amount when possible. */
export const expenseAmountRupees = (row = {}) => {
    if (Number(row.amountValue) > 0) return Number(row.amountValue)
    const direct = parseRupeeAmount(row.amount ?? row.cost ?? row.estimatedCost ?? '')
    if (direct > 0) return direct
    // "110 L" style — treat litres × ₹90 as a working estimate when no ₹ amount stored.
    const qty = String(row.fuelQuantity || row.requestedQuantity || '').trim()
    const litres = Number(String(qty).replace(/[^\d.]/g, '')) || 0
    if (litres > 0 && /l/i.test(qty) && !/%/.test(qty)) {
        return Math.round(litres * 90)
    }
    return 0
}

/**
 * Build posted OUT finance transactions from TM transport expenses (FE-/SE-/OE-).
 * Skips rows already represented in `existingTransactions` by reference / linkedExpenseId.
 */
export function buildOutTransactionsFromTransportExpenses(
    expenses = [],
    existingTransactions = [],
    sequence = { txn: 1, voucher: 1 },
) {
    const existingKeys = new Set()
    ;(existingTransactions || []).forEach((txn) => {
        ;[txn.id, txn.reference, txn.voucherNo, txn.linkedExpenseId].forEach((key) => {
            const value = String(key || '').trim()
            if (value) existingKeys.add(value)
        })
    })

    const seq = {
        txn: Number(sequence?.txn) || 1,
        voucher: Number(sequence?.voucher) || 1,
    }
    const created = []

    ;(expenses || []).forEach((expense) => {
        const expenseId = String(expense.id || expense.expenseId || '').trim()
        if (!expenseId) return
        if (existingKeys.has(expenseId) || existingKeys.has(`TXN-TE-${expenseId}`)) return

        const amount = expenseAmountRupees(expense)
        if (amount <= 0) return

        const isFuel = expenseId.startsWith('FE-')
        const isService = expenseId.startsWith('SE-')
        seq.txn += 1
        seq.voucher += 1
        const transactionNo = `TXN-${String(seq.txn).padStart(5, '0')}`
        const voucherNo = `PV-${String(seq.voucher).padStart(4, '0')}`
        const date = isoDateFromTransport(
            expense.fuelDate || expense.serviceDate || expense.expenseDate || expense.date,
        )
        const category = isFuel
            ? 'Transport Fuel'
            : isService
                ? 'Transport Maintenance'
                : 'Transport Expense'
        const narration = isFuel
            ? `Fuel — ${expense.vehicleNumber || '—'} · ${expense.fuelStation || 'Station'} · ${expense.fuelQuantity || ''}`
            : `${expense.serviceType || 'Service'} — ${expense.vehicleNumber || '—'} · ${expense.serviceCenter || expense.vendor || '—'}`

        const txn = {
            id: `TXN-TE-${expenseId}`,
            transactionNo,
            transactionDate: date,
            direction: TRANSACTION_DIRECTIONS.OUT,
            sourceModule: SOURCE_MODULES.TRANSPORT,
            category,
            paymentMode: expense.paymentMode || PAYMENT_MODES.UPI,
            amount,
            studentId: undefined,
            reference: expenseId,
            linkedExpenseId: expenseId,
            linkedRequestId: expense.linkedRequestId || '',
            narration: narration.trim(),
            status: TRANSACTION_STATUSES.POSTED,
            voucherNo,
            createdBy: 'Transport Ops Sync',
            createdAt: new Date().toISOString(),
            receiptNo: undefined,
            installmentIds: [],
            entryType: 'Expense',
        }
        created.push(txn)
        existingKeys.add(expenseId)
        existingKeys.add(txn.id)
    })

    return { transactions: created, sequence: seq }
}

/**
 * Hydrate TM ops and return merged finance collections (does not persist).
 */
export async function collectTransportOpsForFinance({
    approvals = [],
    transportFleet = [],
    transportMaintenance = [],
} = {}) {
    await Promise.all([
        hydrateTransportApprovalRequestsFromApi(),
        hydrateTransportExpensesFromApi(),
        hydrateVehiclesFromApi(),
    ])

    const opsApprovals = [...getMaintenanceRequests(), ...getFuelRequests()]
        .map(mapOpsRequestToFinanceApproval)

    const nextApprovals = mergeByKey(
        approvals,
        opsApprovals,
        (row) => String(row.linkedRequestId || row.id || '').trim(),
    )

    const opsFleet = getVehicles().map(mapOpsVehicleToFleetRow).filter((row) => row.regNo)
    const nextFleet = mergeByKey(
        transportFleet,
        opsFleet,
        (row) => String(row.regNo || row.id || '').trim().toUpperCase(),
    )

    const opsMaintenance = mapServiceExpensesToFinanceRows(
        getTransportExpenses().filter((row) => String(row.id || '').startsWith('SE-')),
    )
    const nextMaintenance = mergeByKey(
        transportMaintenance,
        opsMaintenance,
        (row) => String(row.linkedRequestId || row.id || '').trim(),
    )

    return {
        approvals: nextApprovals,
        transportFleet: nextFleet,
        transportMaintenance: nextMaintenance,
        opsApprovalCount: opsApprovals.length,
        opsFleetCount: opsFleet.length,
        opsMaintenanceCount: opsMaintenance.length,
        transportExpenses: getTransportExpenses(),
    }
}
