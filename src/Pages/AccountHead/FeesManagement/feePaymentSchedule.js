/**
 * Build fee payment schedules from annual total + frequency.
 * ONE_TIME = one-shot (pay full amount once).
 * MONTHLY / QUARTERLY / TERM_WISE = equal split with due dates.
 */
import { DEFAULT_ACADEMIC_YEAR } from '../financeDomain/financeConstants'

const pad = (n) => String(n).padStart(2, '0')

const toIso = (year, monthIndex0, day) => {
    const lastDay = new Date(year, monthIndex0 + 1, 0).getDate()
    const safeDay = Math.min(Math.max(Number(day) || 10, 1), lastDay)
    return `${year}-${pad(monthIndex0 + 1)}-${pad(safeDay)}`
}

const parseYearStart = (academicYear, startDate) => {
    if (startDate) {
        const parsed = new Date(startDate)
        if (!Number.isNaN(parsed.getTime())) {
            return { year: parsed.getFullYear(), monthIndex0: parsed.getMonth() }
        }
    }
    const text = String(academicYear || DEFAULT_ACADEMIC_YEAR)
    const match = text.match(/(20\d{2})/)
    const startYear = match ? Number(match[1]) : new Date().getFullYear()
    // Typical Indian school year starts June
    return { year: startYear, monthIndex0: 5 }
}

const splitEqual = (total, parts) => {
    const cents = Math.round(Number(total) * 100)
    if (!parts || parts < 1) return [cents / 100]
    const base = Math.floor(cents / parts)
    const remainder = cents - base * parts
    return Array.from({ length: parts }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100)
}

const FREQUENCY_PLAN = {
    ONE_TIME: {
        id: 'ONE_TIME',
        label: 'One Time (one-shot)',
        help: 'Parent pays the full amount in a single installment (e.g. at admission / start of year).',
        count: 1,
        labels: ['Full payment'],
        monthOffsets: [0],
    },
    MONTHLY: {
        id: 'MONTHLY',
        label: 'Monthly',
        help: 'Total is split into 12 equal monthly dues across the academic year.',
        count: 12,
        labels: Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`),
        monthOffsets: Array.from({ length: 12 }, (_, i) => i),
    },
    QUARTERLY: {
        id: 'QUARTERLY',
        label: 'Quarterly',
        help: 'Total is split into 4 equal quarterly dues (Q1–Q4).',
        count: 4,
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        monthOffsets: [0, 3, 6, 9],
    },
    HALF_YEARLY: {
        id: 'HALF_YEARLY',
        label: 'Half Yearly',
        help: 'Total is split into 2 equal half-year dues.',
        count: 2,
        labels: ['Half 1', 'Half 2'],
        monthOffsets: [0, 6],
    },
    TERM_WISE: {
        id: 'TERM_WISE',
        label: 'Term Wise',
        help: 'Total is split into 3 equal term dues (Term 1–3).',
        count: 3,
        labels: ['Term 1', 'Term 2', 'Term 3'],
        monthOffsets: [0, 4, 8],
    },
    CUSTOM_INSTALLMENT: {
        id: 'CUSTOM_INSTALLMENT',
        label: 'Custom Installment',
        help: 'Treated like term-wise (3 parts) until custom due dates are configured.',
        count: 3,
        labels: ['Installment 1', 'Installment 2', 'Installment 3'],
        monthOffsets: [0, 4, 8],
    },
}

export const getFrequencyPlan = (frequency) => (
    FREQUENCY_PLAN[frequency] || FREQUENCY_PLAN.ONE_TIME
)

/**
 * @returns {{
 *  frequency, planLabel, help, totalAmount, parts: Array<{
 *    index, label, amount, dueDate, monthKey, shareLabel
 *  }>, nextDue
 * }}
 */
export const buildPaymentSchedule = ({
    amount,
    frequency = 'ONE_TIME',
    academicYear = DEFAULT_ACADEMIC_YEAR,
    startDate = '',
    dueDayOfMonth = 10,
} = {}) => {
    const totalAmount = Math.max(0, Number(amount) || 0)
    const plan = getFrequencyPlan(frequency)
    const amounts = splitEqual(totalAmount, plan.count)
    const { year, monthIndex0 } = parseYearStart(academicYear, startDate)

    const parts = amounts.map((partAmount, index) => {
        const offset = plan.monthOffsets[index] || 0
        const dueMonth = monthIndex0 + offset
        const dueYear = year + Math.floor(dueMonth / 12)
        const dueMonthIndex = ((dueMonth % 12) + 12) % 12
        const dueDate = toIso(dueYear, dueMonthIndex, dueDayOfMonth)
        const monthKey = dueDate.slice(0, 7)
        return {
            index,
            label: plan.labels[index] || `Part ${index + 1}`,
            amount: partAmount,
            dueDate,
            monthKey,
            shareLabel: `${index + 1} of ${plan.count}`,
        }
    })

    const today = new Date().toISOString().slice(0, 10)
    const nextDue = parts.find((part) => part.dueDate >= today) || parts[parts.length - 1] || null

    return {
        frequency: plan.id,
        planLabel: plan.label,
        help: plan.help,
        totalAmount,
        parts,
        nextDue,
    }
}

/** Map schedule parts → finance installment draft rows for one student. */
export const scheduleToInstallments = ({
    schedule,
    studentId,
    academicYear,
    structureId,
    feeCategoryId,
    feeHead,
}) => (schedule?.parts || []).map((part, index) => ({
    id: `INS-${structureId || 'FS'}-${studentId}-${index + 1}`,
    studentId,
    academicYear,
    feeStructureId: structureId,
    feeCategoryId,
    feeHead,
    installmentLabel: `${feeHead} — ${part.label}`,
    month: part.monthKey,
    dueDate: part.dueDate,
    feeAmount: part.amount,
    concessionAmount: 0,
    fineAmount: 0,
    netAmount: part.amount,
    paidAmount: 0,
    balanceAmount: part.amount,
    status: 'UNPAID',
    fineWaived: false,
    scheduleIndex: part.index,
    frequency: schedule.frequency,
}))
