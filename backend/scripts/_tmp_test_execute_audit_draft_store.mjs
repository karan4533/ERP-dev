/**
 * Regression checks for object vs array execute-audit draft storage helpers.
 * Run: node backend/scripts/_tmp_test_execute_audit_draft_store.mjs
 */
import {
    coerceCampusRows,
    draftRecordId,
    findDraftInStore,
    normalizeDraftList,
    upsertDraftInStore,
} from '../../src/Common/auditDomain/executeAuditDraftStore.js'

let failed = 0
const assert = (cond, msg) => {
    if (!cond) {
        failed += 1
        console.error('FAIL:', msg)
    } else {
        console.log('PASS:', msg)
    }
}

const objectDraft = {
    header: { auditId: 'A1', auditNumber: 'AUD-1', campus: 'Main', building: 'B1', area: 'R1', auditDate: '12-11-2026' },
    responses: { p1: { response: 'No' } },
}

assert(normalizeDraftList(objectDraft).length === 1, 'normalize wraps object as one-item array')
assert(normalizeDraftList(JSON.stringify(objectDraft)).length === 1, 'normalize parses JSON string object')
assert(normalizeDraftList([objectDraft, { header: { auditId: 'A2' } }]).length === 2, 'normalize keeps arrays')
assert(coerceCampusRows(objectDraft)[0].id === 'A1', 'coerceCampusRows preserves object draft with id')
assert(Array.isArray(coerceCampusRows(objectDraft)), 'coerceCampusRows returns array for object')
assert(coerceCampusRows(null).length === 0, 'coerceCampusRows null -> []')
assert(coerceCampusRows([{ id: 'x' }])[0].id === 'x', 'coerceCampusRows keeps arrays')

const { list, payload } = upsertDraftInStore([], { ...objectDraft, responses: { p1: { response: 'Yes' } } })
assert(list.length === 1 && payload.id === 'A1', 'upsert creates keyed draft')
const again = upsertDraftInStore(list, {
    header: { auditId: 'A1', campus: 'North' },
    responses: { p1: { response: 'Error' } },
})
assert(again.list.length === 1, 'upsert replaces same auditId')
assert(again.list[0].header.campus === 'North', 'upsert updates campus field')

const found = findDraftInStore(again.list, 'A1')
assert(found?.header?.campus === 'North', 'findDraftInStore by auditId')
assert(findDraftInStore(objectDraft, 'A1')?.header?.building === 'B1', 'findDraftInStore accepts legacy object')
assert(draftRecordId(objectDraft) === 'A1', 'draftRecordId from header.auditId')

// Simulate prior bug: double JSON.parse on object throws
let doubleParseRecovered = false
try {
    JSON.parse(objectDraft)
} catch {
    doubleParseRecovered = true
}
assert(doubleParseRecovered, 'double JSON.parse on object throws (legacy bug)')
assert(findDraftInStore(objectDraft, 'A1') != null, 'helpers avoid double-parse and still load object drafts')

if (failed) {
    console.error(`\n${failed} assertion(s) failed`)
    process.exit(1)
}
console.log('\nAll execute-audit draft store regressions passed')
