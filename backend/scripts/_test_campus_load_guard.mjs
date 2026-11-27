/**
 * Node unit tests for src/services/campusLoadGuard.js.
 * Run: node --test backend/scripts/_test_campus_load_guard.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    canReplaceCollection,
    createLoadTracker,
    LOAD_STATUS,
} from '../../src/services/campusLoadGuard.js'

describe('campus load guard', () => {
    it('blocks replace before any load (cold open / slow API)', () => {
        const t = createLoadTracker()
        assert.equal(t.get('k'), LOAD_STATUS.IDLE)
        assert.equal(canReplaceCollection(t.get('k')), false)
        t.markLoading('k')
        assert.equal(t.get('k'), LOAD_STATUS.LOADING)
        assert.equal(canReplaceCollection(t.get('k')), false)
    })

    it('blocks replace after a failed first load and keeps the error', () => {
        const t = createLoadTracker()
        t.markLoading('k')
        t.markFailed('k', 'HTTP 500')
        assert.equal(t.get('k'), LOAD_STATUS.FAILED)
        assert.equal(t.error('k'), 'HTTP 500')
        assert.equal(canReplaceCollection(t.get('k')), false)
    })

    it('allows replace once loaded, including an empty server list', () => {
        const t = createLoadTracker()
        t.markLoading('k')
        t.markLoaded('k')
        assert.equal(canReplaceCollection(t.get('k')), true)
    })

    it('keeps a loaded collection trusted when a later refresh fails', () => {
        const t = createLoadTracker()
        t.markLoaded('k')
        t.markLoading('k')
        assert.equal(t.get('k'), LOAD_STATUS.LOADED)
        t.markFailed('k', 'network')
        assert.equal(t.get('k'), LOAD_STATUS.LOADED)
        assert.equal(t.error('k'), 'network')
    })

    it('tracks keys independently and clears on logout', () => {
        const t = createLoadTracker()
        t.markLoaded('a')
        assert.equal(t.get('b'), LOAD_STATUS.IDLE)
        t.clear()
        assert.equal(t.get('a'), LOAD_STATUS.IDLE)
    })
})
