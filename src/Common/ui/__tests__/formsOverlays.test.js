import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const formsModule = await import('../formControl.js').catch(() => null)
const overlayModule = await import('../overlay.js').catch(() => null)

test('form controls receive stable label, hint and error relationships', () => {
    assert.ok(formsModule, 'the form-control helper should be importable')
    const { getFormControlProps } = formsModule

    assert.deepEqual(getFormControlProps({ id: 'fee-amount', hasHint: true, hasError: false }), {
        control: { id: 'fee-amount', 'aria-describedby': 'fee-amount-hint' },
        label: { htmlFor: 'fee-amount' },
        hintId: 'fee-amount-hint',
        errorId: 'fee-amount-error',
    })
    assert.deepEqual(getFormControlProps({ id: 'fee-amount', hasHint: true, hasError: true }).control, {
        id: 'fee-amount',
        'aria-describedby': 'fee-amount-hint fee-amount-error',
        'aria-invalid': true,
        'aria-errormessage': 'fee-amount-error',
    })
})

test('required controls expose native and assistive-technology requirements', () => {
    const { getFormControlProps } = formsModule

    assert.deepEqual(getFormControlProps({ id: 'admission-number', required: true }).control, {
        id: 'admission-number',
        required: true,
        'aria-required': true,
    })
})

test('dialog ids connect the accessible title and optional description', () => {
    assert.ok(overlayModule, 'the overlay helper should be importable')
    const { getOverlayA11yProps } = overlayModule

    assert.deepEqual(getOverlayA11yProps('receipt-details', true), {
        dialog: {
            'aria-labelledby': 'receipt-details-title',
            'aria-describedby': 'receipt-details-description',
        },
        titleId: 'receipt-details-title',
        descriptionId: 'receipt-details-description',
    })
    assert.equal(getOverlayA11yProps('receipt-details', false).dialog['aria-describedby'], undefined)
})

test('overlay dismissal respects Escape and backdrop configuration', () => {
    assert.ok(overlayModule, 'the overlay helper should be importable')
    const { shouldDismissOverlay } = overlayModule

    assert.equal(shouldDismissOverlay({ reason: 'escape' }), true)
    assert.equal(shouldDismissOverlay({ reason: 'escape', closeOnEscape: false }), false)
    assert.equal(shouldDismissOverlay({ reason: 'backdrop' }), true)
    assert.equal(shouldDismissOverlay({ reason: 'backdrop', closeOnBackdrop: false }), false)
})

test('focus-loop math wraps in both directions', () => {
    assert.ok(overlayModule, 'the overlay helper should be importable')
    const { getWrappedFocusIndex } = overlayModule

    assert.equal(getWrappedFocusIndex({ currentIndex: 2, count: 3, direction: 1 }), 0)
    assert.equal(getWrappedFocusIndex({ currentIndex: 0, count: 3, direction: -1 }), 2)
    assert.equal(getWrappedFocusIndex({ currentIndex: -1, count: 3, direction: 1 }), 0)
    assert.equal(getWrappedFocusIndex({ currentIndex: 0, count: 0, direction: 1 }), -1)
})

test('duplicated marks and audit confirmations delegate to the shared dialog contract', async () => {
    const wrappers = [
        '../../../Pages/Teacher/StudentEvaluation/MarkEntry/Components/SubmitMarksConfirmModal.jsx',
        '../../../Pages/Coordinator/StudentEvaluation/MarkEntry/Components/SubmitMarksConfirmModal.jsx',
        '../../../Pages/ProcessAuditor/AuditManagement/ExecuteAudit/Components/SubmitValidationModal.jsx',
        '../../../Pages/QualityAuditor/AuditManagement/ExecuteAudit/Components/SubmitValidationModal.jsx',
    ]
    const sources = await Promise.all(wrappers.map((file) => readFile(new URL(file, import.meta.url), 'utf8')))

    sources.forEach((source) => {
        assert.doesNotMatch(source, /fixed inset-0/)
        assert.match(source, /Common\/(StudentEvaluation\/SubmitMarksDialog|AuditReview\/AuditSubmissionDialog)/)
    })
})

test('shared request and export overlays use the accessible primitives', async () => {
    const components = [
        '../../CommonComponents/DeleteRequestModal.jsx',
        '../../CommonComponents/EditRequestModal.jsx',
        '../../CommonComponents/ExportModal.jsx',
    ]
    const sources = await Promise.all(components.map((file) => readFile(new URL(file, import.meta.url), 'utf8')))

    sources.forEach((source) => assert.doesNotMatch(source, /fixed inset-0/))
    assert.match(sources[0], /ConfirmAction/)
    assert.match(sources[1], /ConfirmAction/)
    assert.match(sources[2], /Dialog/)
})

test('shared workflow overlays do not ship independent fixed-position dialog shells', async () => {
    const components = [
        '../../Activities/MdApprovalSubmitModal.jsx',
        '../../Communication/Components/NewMessageModal.jsx',
        '../../Communication/Components/ChatPanel.jsx',
        '../../demoDomain/RegisterPage.jsx',
        '../../MeetingsCalendar/Components/EventModal.jsx',
        '../../RaiseItTicket/RaiseItTicketModal.jsx',
        '../../TaskManagement/Components/UpdateTaskStatusModal.jsx',
    ]
    const sources = await Promise.all(components.map((file) => readFile(new URL(file, import.meta.url), 'utf8')))

    sources.forEach((source) => {
        assert.doesNotMatch(source, /fixed inset-0/)
        assert.match(source, /ui\/Dialog/)
    })
})
