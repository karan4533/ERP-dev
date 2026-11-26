import test from 'node:test'
import assert from 'node:assert/strict'

import { validateAttachment } from '../../TaskManagement/attachmentValidation.js'

test('accepts supported task evidence at or below the configured size limit', () => {
    assert.deepEqual(validateAttachment({ type: 'application/pdf', size: 5 * 1024 * 1024 }), { valid: true, error: '' })
})

test('rejects unsupported task evidence formats with a useful message', () => {
    assert.deepEqual(validateAttachment({ type: 'text/plain', size: 20 }), {
        valid: false,
        error: 'Choose a PDF, JPG or PNG file.',
    })
})

test('rejects task evidence larger than the configured limit', () => {
    assert.deepEqual(validateAttachment({ type: 'image/png', size: (5 * 1024 * 1024) + 1 }), {
        valid: false,
        error: 'Choose a file no larger than 5 MB.',
    })
})
