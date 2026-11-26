import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getAnnouncementReadiness,
    resolveAnnouncementAudience,
    validateAnnouncementDraft,
} from '../../Announcement/announcementComposerState.js'

const validDraft = {
    title: 'Water interruption in Block B',
    category: 'Administrative Notice',
    message: 'Block B washrooms will be unavailable from 2:00 PM to 3:00 PM.',
    announcementDate: '2026-11-02',
    audienceGroup: 'operations',
    priority: 'Normal',
    requireAcknowledgement: true,
}

test('announcement validation requires message identity, date and an explicit audience', () => {
    const errors = validateAnnouncementDraft({
        ...validDraft,
        title: '',
        category: '',
        message: '',
        announcementDate: '',
        audienceGroup: '',
    })

    assert.deepEqual(errors, {
        title: 'Enter the announcement title.',
        category: 'Select an announcement category.',
        message: 'Enter the announcement message.',
        announcementDate: 'Select the publication date.',
        audienceGroup: 'Select the intended audience.',
    })
})

test('audience groups resolve to named role lists without duplicates', () => {
    const audience = resolveAnnouncementAudience('operations')

    assert.ok(audience.includes('housekeepingmanager'))
    assert.ok(audience.includes('canteenmanager'))
    assert.equal(new Set(audience).size, audience.length)
    assert.deepEqual(resolveAnnouncementAudience('unknown'), [])
})

test('announcement readiness distinguishes untouched, blocked and valid drafts', () => {
    assert.equal(getAnnouncementReadiness({ title: '', category: '', message: '', announcementDate: '', audienceGroup: '' }), 'Not assessed')
    assert.equal(getAnnouncementReadiness({ ...validDraft, message: '' }), 'Not assessed')
    assert.equal(getAnnouncementReadiness({ ...validDraft, title: 'A' }), 'Blocked')
    assert.equal(getAnnouncementReadiness(validDraft), 'Ready')
})
