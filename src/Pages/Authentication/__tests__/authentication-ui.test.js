import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const authModule = await import('../authUi.js').catch(() => null)
const enterpriseDirectory = await import('../enterpriseUserDirectory.js').catch(() => null)

test('OTP input keeps only the first six digits', () => {
    assert.ok(authModule, 'the authentication UI helper should be importable')
    assert.equal(authModule.normalizeOtp(' 12a34-567 '), '123456')
    assert.equal(authModule.isOtpComplete('123456'), true)
    assert.equal(authModule.isOtpComplete('12345'), false)
})

test('return routes are accepted only inside the authenticated role scope', () => {
    const { getSafeReturnPath } = authModule

    assert.equal(getSafeReturnPath({ requestedPath: '/teacher/unit-tests?tab=draft', role: 'teacher', homePath: '/teacher/dashboard' }), '/teacher/unit-tests?tab=draft')
    assert.equal(getSafeReturnPath({ requestedPath: '/admin/settings', role: 'teacher', homePath: '/teacher/dashboard' }), '/teacher/dashboard')
    assert.equal(getSafeReturnPath({ requestedPath: 'https://evil.example', role: 'admin', homePath: '/admin/dashboard' }), '/admin/dashboard')
    assert.equal(getSafeReturnPath({ requestedPath: '/front-office/admission-enquiry', role: 'prm', homePath: '/front-office/admission-enquiry' }), '/front-office/admission-enquiry')
})

test('enterprise directory resolves users by email, employee ID, and username', () => {
    assert.ok(enterpriseDirectory, 'enterpriseUserDirectory should be importable')
    const { findUserByIdentifier } = enterpriseDirectory

    const directorByEmail = findUserByIdentifier('director@school.com')
    assert.equal(directorByEmail?.role, 'director')
    assert.equal(directorByEmail?.name, 'Dr. Arthur Pendelton')

    const directorById = findUserByIdentifier('EMP-DIR-001')
    assert.equal(directorById?.role, 'director')

    const teacherById = findUserByIdentifier('EMP-TCH-014')
    assert.equal(teacherById?.role, 'teacher')
    assert.equal(teacherById?.department, 'Department of Mathematics')

    const adminByEmail = findUserByIdentifier('admin@school.com')
    assert.equal(adminByEmail?.role, 'admin')

    const studentById = findUserByIdentifier('STU-2024-0142')
    assert.equal(studentById?.role, 'student')

    const nonExistent = findUserByIdentifier('nobody@school.com')
    assert.equal(nonExistent, null)
})

test('centralized authentication UI includes enterprise security controls', async () => {
    const [app, context, signIn, signUp] = await Promise.all([
        readFile(new URL('../../../App.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../../../context/AuthContext.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../SignIn.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../SignUp.jsx', import.meta.url), 'utf8'),
    ])

    assert.match(context, /isSessionReady/)
    assert.match(context, /\[ROLES\.ADMIN\]: '\/admin\/dashboard'/)
    assert.match(context, /\[ROLES\.STUDENT\]: '\/student\/dashboard'/)
    assert.match(context, /\[ROLES\.LIBRARIAN\]: '\/librarian\/dashboard'/)
    assert.match(context, /\[ROLES\.PRINCIPAL\]: '\/principal\/dashboard'/)
    assert.match(context, /\[ROLES\.DIRECTOR\]: '\/director\/dashboard'/)
    assert.match(context, /findUserByIdentifier/)
    assert.match(app, /if \(!isSessionReady\)/)
    assert.match(signIn, /role=['"]alert['"]/)
    assert.match(signIn, /Remember this device/)
    assert.match(signIn, /login-identifier/)
    assert.match(signIn, /login-password/)
    assert.match(signIn, /Forgot password/)
    assert.match(signUp, /FeedbackState/)
})
