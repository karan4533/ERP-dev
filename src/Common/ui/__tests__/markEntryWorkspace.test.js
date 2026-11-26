import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../MarkEntryApproval/MarkEntryPage.jsx', import.meta.url), 'utf8')

test('mark entry does not expose simulated import or export actions', () => {
    assert.doesNotMatch(source, /alert\s*\(/)
    assert.match(source, /Import unavailable/)
    assert.match(source, /Export unavailable/)
    assert.match(source, /IntegrationNotice/)
})

test('mark entry row controls are named for their student', () => {
    assert.match(source, /aria-label={`Marks for \${student\.name}`}/)
    assert.match(source, /aria-label={`Mark \${student\.name} absent`}/)
    assert.match(source, /aria-label={`Remarks for \${student\.name}`}/)
})
