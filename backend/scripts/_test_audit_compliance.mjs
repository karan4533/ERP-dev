/**
 * Node unit tests for audit compliance + component option helpers (src/Common/auditDomain).
 * Run: node --test backend/scripts/_test_audit_compliance.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    buildComplianceReport,
    compliancePercent,
    parseAuditDate,
    scoreDraft,
} from '../../src/Common/auditDomain/complianceFromAudits.js'
import {
    auditReferenceOptions,
    componentOptionsFor,
    componentsForStream,
    rubricsOf,
} from '../../src/Common/auditDomain/auditComponentOptions.js'
import { recipientFields, recipientForRole } from '../../src/Common/auditDomain/auditRecipients.js'

const section = (params) => ({ id: 'S1', title: 'Section', parameters: params })
const draft = (auditNumber, department, auditDate, answers, extra = {}) => ({
    header: { auditNumber, department, auditDate, ...extra },
    sections: [section(Object.keys(answers).map((id) => ({ id, responseType: 'yes_no' })))],
    responses: Object.fromEntries(Object.entries(answers).map(([id, response]) => [id, { response }])),
})

const drafts = [
    draft('AUD-PA-1', 'Canteen', '10-11-2026', { p1: 'Yes', p2: 'Yes', p3: 'No', p4: '' }),
    draft('AUD-PA-2', 'Canteen', '12-11-2026', { p1: 'Yes', p2: 'Error' }),
    draft('AUD-PA-3', 'Transport', '2026-11-13', { p1: 'Yes', p2: 'Yes' }),
]
const observations = [
    { id: 'O1', department: 'Canteen', status: 'Open', auditReference: 'AUD-PA-1', createdDate: '10-11-2026' },
    { id: 'O2', department: 'Canteen', status: 'Closed', auditReference: 'AUD-PA-2', createdDate: '12-11-2026' },
    { id: 'O3', department: 'Transport', status: 'Assigned', auditReference: 'AUD-PA-3', createdDate: '13-11-2026' },
    { id: 'O4', department: 'Transport', status: 'Draft', auditReference: 'AUD-PA-3', createdDate: '13-11-2026' },
]
const schedules = [{ scheduleId: 'SCH-PA-1', auditId: 'AUD-PA-1' }, { scheduleId: 'SCH-PA-3', auditId: 'AUD-PA-3' }]

describe('compliance report', () => {
    it('is empty with no audit data (no demo fallback)', () => {
        const report = buildComplianceReport({})
        assert.deepEqual(report.departments, [])
        assert.equal(report.totals.overall, null)
        assert.equal(report.totals.totalAudits, 0)
    })

    it('computes compliance from answered checklist items only', () => {
        assert.deepEqual(scoreDraft(drafts[0]), { passed: 2, failed: 1, partial: 0, na: 1 })
        assert.equal(compliancePercent({ passed: 2, failed: 1 }), 67)
        assert.equal(compliancePercent({ passed: 0, failed: 0 }), null)
    })

    it('aggregates per department and totals match the source rows', () => {
        const report = buildComplianceReport({ drafts, observations, schedules })
        const canteen = report.departments.find((row) => row.department === 'Canteen')
        const transport = report.departments.find((row) => row.department === 'Transport')
        assert.deepEqual(
            { audits: canteen.totalAudits, passed: canteen.passed, failed: canteen.failed, pct: canteen.compliance, pending: canteen.pendingFindings, closed: canteen.closedFindings },
            { audits: 2, passed: 3, failed: 2, pct: 60, pending: 1, closed: 1 },
        )
        assert.equal(transport.compliance, 100)
        assert.equal(transport.pendingFindings, 1)
        assert.equal(report.totals.totalAudits, drafts.length)
        assert.equal(report.totals.passed, 5)
        assert.equal(report.totals.failed, 2)
        assert.equal(report.totals.overall, 71)
        // Unknown statuses are neither pending nor closed.
        assert.equal(report.totals.pendingFindings + report.totals.closedFindings, 3)
    })

    it('filters by department, schedule and date range', () => {
        assert.deepEqual(
            buildComplianceReport({ drafts, observations, filters: { department: 'Transport' } }).departments.map((row) => row.department),
            ['Transport'],
        )
        const bySchedule = buildComplianceReport({ drafts, observations, schedules, filters: { scheduleId: 'SCH-PA-1' } })
        assert.equal(bySchedule.totals.totalAudits, 1)
        assert.equal(bySchedule.totals.overall, 67)
        assert.equal(bySchedule.totals.pendingFindings, 1)
        const byDate = buildComplianceReport({ drafts, observations, filters: { fromDate: new Date(2026, 10, 11), toDate: '2026-11-12' } })
        assert.equal(byDate.totals.totalAudits, 1)
        assert.equal(byDate.totals.closedFindings, 1)
    })

    it('parses dd-mm-yyyy and ISO dates', () => {
        assert.equal(parseAuditDate('05-11-2026').getDate(), 5)
        assert.equal(parseAuditDate('2026-11-05T10:00:00Z').getMonth(), 10)
        assert.equal(parseAuditDate(''), null)
    })
})

describe('component options', () => {
    const components = [
        { id: 'AC-0001', component: 'Process walkthrough', stream: 'PROCESS', rubric1: 'A', rubric2: 'B', rubric3: 'C', rubric4: 'D' },
        { id: 'AC-0002', component: 'Lesson Plan', stream: 'QUALITY' },
        { id: 'AC-0003', component: 'Stores register', stream: 'PROCESS', active: 'No' },
        { id: 'AC-0004', component: 'Kitchen hygiene', stream: 'PROCESS' },
    ]

    it('lists only active components of the stream', () => {
        assert.deepEqual(componentsForStream(components, 'PROCESS').map((row) => row.id), ['AC-0001', 'AC-0004'])
        assert.deepEqual(componentsForStream([], 'PROCESS'), [])
    })

    it('limits options to the component linked to the selected schedule', () => {
        const scheduleRows = [{ scheduleId: 'SCH-1', auditId: 'AUD-1', componentId: 'AC-0004', componentName: 'Kitchen hygiene' }]
        const linked = componentOptionsFor({ components, schedules: scheduleRows, auditReference: 'AUD-1', stream: 'PROCESS' })
        assert.deepEqual(linked.map((option) => option.componentId), ['AC-0004'])
        const all = componentOptionsFor({ components, schedules: scheduleRows, auditReference: '', stream: 'PROCESS' })
        assert.deepEqual(all.map((option) => option.componentId), ['AC-0001', 'AC-0004'])
    })

    it('keeps the four rubric levels separate', () => {
        assert.deepEqual(rubricsOf(components[0]), { rubric1: 'A', rubric2: 'B', rubric3: 'C', rubric4: 'D' })
    })

    it('audit references come from saved schedules plus the current value', () => {
        const options = auditReferenceOptions([{ auditId: 'AUD-1', auditName: 'Cash' }], 'AUD-OLD')
        assert.deepEqual(options.map((option) => option.value), ['AUD-OLD', 'AUD-1'])
    })
})

describe('recipients', () => {
    it('maps a department head role to recipient fields and clears on empty', () => {
        assert.equal(recipientForRole('HousekeepingManager').department, 'Housekeeping')
        assert.equal(recipientFields('transportmanager').recipientRole, 'transportmanager')
        assert.equal(recipientFields('').recipientRole, '')
        assert.equal(recipientForRole('Mr. Ramesh Iyer'), null)
    })
})
