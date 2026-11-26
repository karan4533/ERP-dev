import test from 'node:test'
import assert from 'node:assert/strict'
import { transportService } from '../../../../services/modules/transportService.js'
import { mockAdapter } from '../../../../services/api/mockAdapter.js'
import { transportManagerSidebarLinks } from '../../../../Common/CommonSidebar/Components/sidebarLinks.js'

test('Milestone 2 Transport Enhancements — Driver & Conductor NOC Suite', async (t) => {
    mockAdapter.resetDatabase()

    await t.test('1. NOC Handover Creation: Incomplete Checkpoints Start with Clearance In Progress', async () => {
        const createRes = await transportService.createNocClearance({
            staffType: 'Driver',
            staffId: 'EMP-DRV-099',
            staffName: 'K. Balakrishnan',
            licenseNo: 'TN-58-2016-004419',
            vehicleAssigned: 'BUS-12 (TN-58-EZ-9901)',
            clearances: {
                vehicleKeys: true,
                fuelCard: false,
                toolKit: true,
                firstAid: true,
                fastag: false,
                finesCleared: false,
                kmAuditVerified: true,
            },
            remarks: 'Resignation submitted; final settlements pending.',
        })

        assert.equal(createRes.success, true)
        assert.equal(createRes.data.nocStatus, 'Clearance In Progress')
        assert.equal(createRes.data.certificateNo, null)
        assert.equal(createRes.data.clearances.fuelCard, false)
        assert.equal(createRes.data.clearances.finesCleared, false)
    })

    await t.test('2. NOC Certificate Gating: Premature Issuance Fails Without Full Clearance', async () => {
        const createRes = await transportService.createNocClearance({
            staffType: 'Conductor',
            staffId: 'EMP-CND-044',
            staffName: 'P. Arulraj',
            licenseNo: 'CND-BADGE-2019-301',
            vehicleAssigned: 'BUS-14 (TN-58-AZ-1120)',
            clearances: {
                vehicleKeys: true,
                fuelCard: true,
                toolKit: false, // Incomplete item
                firstAid: true,
                fastag: true,
                finesCleared: true,
                kmAuditVerified: true,
            },
        })

        assert.equal(createRes.success, true)
        const nocId = createRes.data.id

        // Attempt issuance without clearing toolKit -> must fail
        const prematureIssue = await transportService.issueNocCertificate(nocId)
        assert.equal(prematureIssue.success, false)
        assert.match(prematureIssue.error, /7 checklist clearances/i)

        // Clear toolKit
        const updated = await transportService.updateNocClearance(nocId, {
            ...createRes.data,
            clearances: { ...createRes.data.clearances, toolKit: true },
        })
        assert.equal(updated.success, true)

        // Now issue -> must succeed!
        const validIssue = await transportService.issueNocCertificate(nocId, {
            issuedBy: 'A. David Raj (Transport Manager)',
            issuedDate: '2026-03-11',
        })
        assert.equal(validIssue.success, true)
        assert.equal(validIssue.data.nocStatus, 'Cleared / NOC Issued')
        assert.ok(validIssue.data.certificateNo)
        assert.match(validIssue.data.certificateNo, /^NOC\/TRP/i)
        assert.equal(validIssue.data.issuedBy, 'A. David Raj (Transport Manager)')
    })

    await t.test('3. Transport Manager Sidebar: Driver & Conductor NOC Route Registered', () => {
        const paths = transportManagerSidebarLinks.map((l) => l.to)
        assert.ok(
            paths.includes('/transport-manager/driver-conductor-noc'),
            'Missing /transport-manager/driver-conductor-noc link in transportManagerSidebarLinks'
        )
    })
})
