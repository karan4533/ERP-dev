import test from 'node:test'
import assert from 'node:assert/strict'
import { canRoleDelete, ROLES_CAN_DELETE } from '../actionPermissions.js'

test('canRoleDelete authorizes only superadmin and admin', () => {
    assert.equal(canRoleDelete('superadmin'), true)
    assert.equal(canRoleDelete('SuperAdmin'), true)
    assert.equal(canRoleDelete('super-admin'), true)
    assert.equal(canRoleDelete('admin'), true)
    assert.equal(canRoleDelete('Admin'), true)
})

test('canRoleDelete denies unauthorized roles: teacher, coordinator, principal, driver, frontoffice', () => {
    assert.equal(canRoleDelete('teacher'), false)
    assert.equal(canRoleDelete('Teacher'), false)
    assert.equal(canRoleDelete('coordinator'), false)
    assert.equal(canRoleDelete('Coordinator'), false)
    assert.equal(canRoleDelete('principal'), false)
    assert.equal(canRoleDelete('Principal'), false)
    assert.equal(canRoleDelete('driver'), false)
    assert.equal(canRoleDelete('Driver'), false)
    assert.equal(canRoleDelete('frontoffice'), false)
    assert.equal(canRoleDelete('FrontOffice'), false)
    assert.equal(canRoleDelete('prm'), false)
    assert.equal(canRoleDelete('student'), false)
    assert.equal(canRoleDelete('parent'), false)
    assert.equal(canRoleDelete(''), false)
    assert.equal(canRoleDelete(null), false)
    assert.equal(canRoleDelete(undefined), false)
})
