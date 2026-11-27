/**
 * Apply Account Head–defined fee structures onto finance students as unpaid installments.
 * Never invents sample structures/categories — those come only from Define / Configure / CSV.
 */
import { DEFAULT_ACADEMIC_YEAR, FEE_INSTALLMENT_STATUSES } from './financeConstants'
import { normalizeAcademicYear, sameAcademicYear } from './financeHelpers'
import {
    buildPaymentSchedule,
    scheduleToInstallments,
} from '../FeesManagement/feePaymentSchedule'
import { isAllClassesFee, isRouteBilledFee } from '../FeesManagement/feeCampusOptions'

const classKey = (value) => String(value || '').trim().toLowerCase()

const classMatchesStructure = (studentClassName, structureClassName) => {
    if (isAllClassesFee(structureClassName)) return true
    return classKey(studentClassName) === classKey(structureClassName)
}

const isProtectedInstallment = (row) => {
    const paid = Number(row?.paidAmount) || 0
    return paid > 0 || ['PAID', 'PARTIALLY_PAID', 'WAIVED'].includes(row?.status)
}

/**
 * Build installment rows for students from existing fee structures (and their schedules).
 *
 * @param {{
 *  students?: object[],
 *  feeStructures?: object[],
 *  existingInstallments?: object[],
 *  startDateByYear?: Record<string, string>,
 * }} args
 */
export const applyFeeStructuresToStudents = ({
    students = [],
    feeStructures = [],
    existingInstallments = [],
    startDateByYear = {},
} = {}) => {
    const activeStructures = (feeStructures || []).filter(
        (row) => row && row.status !== 'INACTIVE' && row.className && Number(row.amount) > 0
            && !isRouteBilledFee(row),
    )

    const generated = []
    const structureIdsTouched = new Set()

    students.forEach((student) => {
        const studentClass = classKey(student.className)
        if (!studentClass) return

        activeStructures.forEach((structure) => {
            if (!classMatchesStructure(student.className, structure.className)) return
            const targetYear = String(structure.academicYear || '').trim()
            const studentYear = String(student.academicYear || '').trim()
            if (targetYear && studentYear && !sameAcademicYear(targetYear, studentYear)) return

            structureIdsTouched.add(structure.id)
            const yearLabel = normalizeAcademicYear(
                student.academicYear || structure.academicYear || DEFAULT_ACADEMIC_YEAR,
            ) || DEFAULT_ACADEMIC_YEAR
            const schedule = structure.paymentSchedule || buildPaymentSchedule({
                amount: structure.amount,
                frequency: structure.frequency || 'ONE_TIME',
                academicYear: yearLabel,
                startDate: startDateByYear[structure.academicYear]
                    || startDateByYear[yearLabel]
                    || '',
                dueDayOfMonth: structure.dueDayOfMonth || 10,
            })

            generated.push(...scheduleToInstallments({
                schedule,
                studentId: student.id,
                academicYear: yearLabel,
                structureId: structure.id,
                feeCategoryId: structure.feeCategoryId,
                feeHead: structure.feeHead,
            }))
        })
    })

    // Drop unpaid rows for structures we regenerated; keep paid/partial and unrelated rows.
    const keep = (existingInstallments || []).filter((row) => {
        if (!structureIdsTouched.has(row.feeStructureId)) return true
        return isProtectedInstallment(row)
    })

    const protectedKeys = new Set(
        keep
            .filter((row) => structureIdsTouched.has(row.feeStructureId))
            .map((row) => `${row.studentId}:${row.feeStructureId}:${row.scheduleIndex ?? row.dueDate}`),
    )
    const fresh = generated.filter(
        (row) => !protectedKeys.has(`${row.studentId}:${row.feeStructureId}:${row.scheduleIndex ?? row.dueDate}`),
    )

    return {
        installments: [...fresh, ...keep],
        generatedCount: fresh.length,
        structuresApplied: structureIdsTouched.size,
        studentsMatched: new Set(fresh.map((row) => row.studentId)).size,
        meta: {
            appliedFeeStructuresAt: new Date().toISOString(),
            appliedFeeStructures: structureIdsTouched.size,
            appliedInstallments: fresh.length,
        },
    }
}

/**
 * @deprecated Use applyFeeStructuresToStudents — kept so older imports do not invent demo masters.
 */
export const buildCampusFeeLedger = (args = {}) => {
    const applied = applyFeeStructuresToStudents({
        students: args.students,
        feeStructures: args.feeStructures || [],
        existingInstallments: args.existingInstallments || [],
    })
    return {
        feeCategories: args.feeCategories || [],
        feeStructures: args.feeStructures || [],
        fineRules: args.fineRules || [],
        bankAccounts: args.bankAccounts || [],
        posTerminals: args.posTerminals || [],
        installments: applied.installments,
        approvals: [],
        meta: { ...applied.meta, demoFeeLedger: false },
    }
}

export const FEE_INSTALLMENT_UNPAID = FEE_INSTALLMENT_STATUSES.UNPAID
