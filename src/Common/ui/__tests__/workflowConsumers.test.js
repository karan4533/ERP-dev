import test from 'node:test'
import assert from 'node:assert/strict'

import { getCommunicationRoleConfig } from '../../Communication/communicationRoleConfig.js'

test('coordinator messaging uses a coordinator identity and route scope', () => {
    const config = getCommunicationRoleConfig('coordinator')

    assert.equal(config.roleLabel, 'Coordinator')
    assert.equal(config.routeBase, '/coordinator/communication')
    assert.equal(config.currentUser.role, 'Coordinator')
})
