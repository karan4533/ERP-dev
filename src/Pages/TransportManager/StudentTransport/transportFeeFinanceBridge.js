import { isApiFinanceEnabled } from '../../../services/apiClient'
import { postTransportEnrollmentFeeApi } from '../../../services/financeApi'
import { DEFAULT_ACADEMIC_YEAR } from '../../AccountHead/financeDomain/financeConstants'
import { parseRupeeAmount } from '../../AccountHead/financeDomain/financeHelpers'
import { loadFinanceState, saveFinanceState } from '../../AccountHead/financeDomain/financeStorage'
import {
    buildPaymentSchedule,
    scheduleToInstallments,
} from '../../AccountHead/FeesManagement/feePaymentSchedule'

const STRUCTURE_TO_FREQUENCY = {
    Yearly: 'ONE_TIME',
    'Half Yearly': 'HALF_YEARLY',
    Quarterly: 'QUARTERLY',
    Monthly: 'MONTHLY',
}

const parseFeesStructure = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return { structure: 'Yearly', amountLabel: '', amount: 0 }
    const [structurePart, ...rest] = raw.split(' — ')
    const amountLabel = rest.join(' — ').trim()
    return {
        structure: structurePart || 'Yearly',
        amountLabel,
        amount: parseRupeeAmount(amountLabel || structurePart),
    }
}

const classNameFromSection = (classSection) => {
    const raw = String(classSection || '').trim()
    if (!raw) return ''
    return raw.split(/\s*[-–]\s*/)[0].trim()
}

export function mapTransportFeesToFinanceFrequency(structureLabel) {
    return STRUCTURE_TO_FREQUENCY[structureLabel] || 'ONE_TIME'
}

/**
 * Post transport enrollment as payable Transport Fee installments (Fee Collection + Parent/Student fees).
 */
export async function postStudentTransportFeeToFinance(assignment) {
    if (!assignment) return { success: false, message: 'Missing transport assignment.' }

    const { structure, amountLabel, amount: parsedAmount } = parseFeesStructure(assignment.feesStructure)
    const saved = loadFinanceState()
    const financeStructures = saved?.data?.feeStructures || []
    const routeStructure = financeStructures.find((row) => (
        String(row.routeId || '') === String(assignment.routeId || '')
        && String(row.feeCategoryId || '').toUpperCase().includes('TRANSPORT')
        && row.status !== 'INACTIVE'
    ))
    const amount = Number(routeStructure?.amount) > 0
        ? Number(routeStructure.amount)
        : parsedAmount
    const frequency = routeStructure?.frequency
        || mapTransportFeesToFinanceFrequency(structure)
    const feeHead = routeStructure?.feeHead
        || (assignment.routeName ? `Transport Fee — ${assignment.routeName}` : 'Transport Fee')

    if (!(amount > 0)) {
        return {
            success: false,
            message: 'Set a route fee in Fee Management (or on the route) before billing Finance.',
        }
    }

    const academicYear = assignment.academicYear || routeStructure?.academicYear || DEFAULT_ACADEMIC_YEAR
    const studentId = String(assignment.studentId || assignment.id || '').trim()
    if (!studentId) {
        return { success: false, message: 'Student ID is required to post the transport bill.' }
    }

    const structureId = routeStructure?.id || `FS-TRANSPORT-ROUTE-${assignment.routeId || assignment.id || studentId}`
    const schedule = buildPaymentSchedule({
        amount,
        frequency,
        academicYear,
        dueDayOfMonth: Number(routeStructure?.dueDayOfMonth) || 10,
    })
    const installments = scheduleToInstallments({
        schedule,
        studentId,
        academicYear,
        structureId,
        feeCategoryId: 'CAT-TRANSPORT',
        feeHead,
    }).map((row) => ({
        ...row,
        source: 'transport-enrollment',
        transportAssignmentId: assignment.id,
        routeId: assignment.routeId || routeStructure?.routeId || '',
        routeName: assignment.routeName || routeStructure?.routeName || '',
        installmentLabel: `${feeHead} — ${row.installmentLabel?.split(' — ').slice(1).join(' — ') || structure}`,
    }))

    const studentRow = {
        id: studentId,
        name: assignment.studentName || studentId,
        className: classNameFromSection(assignment.classSection) || assignment.className || '',
        section: String(assignment.classSection || '').split(/\s*[-–]\s*/)[1]?.trim() || '',
        academicYear,
        admissionNumber: assignment.admissionNumber || '',
        parentName: assignment.parentName || '',
        parentPhone: assignment.parentContact || '',
        status: 'Active',
        source: 'transport-enrollment',
    }

    const feeStructureRow = {
        id: structureId,
        academicYear,
        className: 'All Classes',
        feeCategoryId: 'CAT-TRANSPORT',
        feeHead,
        frequency,
        amount,
        dueDayOfMonth: Number(routeStructure?.dueDayOfMonth) || 10,
        status: 'ACTIVE',
        paymentSchedule: schedule,
        source: routeStructure?.source || 'transport-enrollment',
        transportAssignmentId: assignment.id,
        routeId: assignment.routeId || routeStructure?.routeId || '',
        routeName: assignment.routeName || routeStructure?.routeName || '',
        amountLabel: amountLabel || `₹${amount}`,
    }

    const payload = {
        student: studentRow,
        feeStructure: feeStructureRow,
        installments,
        transportAssignmentId: assignment.id,
    }

    // Always mirror into browser finance cache for Account Head offline/demo.
    const data = { ...(saved?.data || {}) }
    data.feeCategories = mergeById(data.feeCategories, {
        id: 'CAT-TRANSPORT',
        name: 'Transport Fee',
        code: 'TRANSPORT',
        active: true,
    })
    data.feeStructures = mergeById(data.feeStructures, feeStructureRow)
    data.students = mergeById(data.students, studentRow)
    let nextInstallments = Array.isArray(data.installments) ? [...data.installments] : []
    nextInstallments = nextInstallments.filter(
        (row) => !(row.transportAssignmentId === assignment.id || (
            row.source === 'transport-enrollment'
            && row.studentId === studentId
            && row.feeStructureId === structureId
        )),
    )
    nextInstallments = [...installments, ...nextInstallments]
    data.installments = nextInstallments
    saveFinanceState(data)

    if (!isApiFinanceEnabled()) {
        return {
            success: true,
            api: false,
            installmentsCreated: installments.length,
            message: 'Transport bill saved for Fee Collection (local finance cache).',
        }
    }

    try {
        const result = await postTransportEnrollmentFeeApi(payload)
        return {
            success: true,
            api: true,
            installmentsCreated: result?.installmentsCreated ?? installments.length,
            message: 'Transport bill posted to Finance for Fee Collection / Parent payment.',
            result,
        }
    } catch (error) {
        return {
            success: true,
            api: false,
            installmentsCreated: installments.length,
            message: error?.message
                || 'Saved locally — Finance API could not accept the transport bill yet.',
            warning: true,
        }
    }
}

function mergeById(list, row) {
    const next = Array.isArray(list) ? [...list] : []
    const idx = next.findIndex((item) => String(item.id) === String(row.id))
    if (idx >= 0) next[idx] = { ...next[idx], ...row }
    else next.unshift(row)
    return next
}
