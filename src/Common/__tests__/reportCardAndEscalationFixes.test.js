import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('ReportCardGenerator exports valid data and CBSE sample student models', async () => {
    const reportCardCode = await readFile(
        new URL('../Academic/ReportCardGenerator.jsx', import.meta.url),
        'utf8'
    )
    assert.match(reportCardCode, /export const SAMPLE_STUDENTS =/)
    assert.match(reportCardCode, /QMIS202510A02/)
    assert.match(reportCardCode, /QMIS20251A01/)
    assert.match(reportCardCode, /getApprovedMarksForStudent/)
    assert.match(reportCardCode, /getGradeFromPercentage/)
    assert.match(reportCardCode, /export default ReportCardGenerator/)
})

test('Sidebar links contain Report Card for authorized roles (Teacher, Coordinator, Student, Parent, Principal, Director, Admin)', async () => {
    const sidebarModule = await import('../CommonSidebar/Components/sidebarLinks.js')

    // Teacher
    const teacherLinks = sidebarModule.teacherSidebarLinks
    const teacherStudentGroup = teacherLinks.find((l) => l.title === 'Student')
    assert.ok(teacherStudentGroup, 'Teacher sidebar should have Student group')
    const teacherReportCard = teacherStudentGroup.subLinks.find((s) => s.to === '/teacher/student-evaluation/report-cards')
    assert.ok(teacherReportCard, 'Teacher sidebar should have Report Card link')

    // Coordinator
    const coordinatorLinks = sidebarModule.coordinatorSidebarLinks
    const coordStudentGroup = coordinatorLinks.find((l) => l.title === 'Student')
    assert.ok(coordStudentGroup, 'Coordinator sidebar should have Student group')
    const coordReportCard = coordStudentGroup.subLinks.find((s) => s.to === '/coordinator/student-evaluation/report-cards')
    assert.ok(coordReportCard, 'Coordinator sidebar should have Report Card link')

    // Student
    const studentLinks = sidebarModule.studentSidebarLinks
    const studentEvalGroup = studentLinks.find((l) => l.title === 'Student Evaluation')
    assert.ok(studentEvalGroup, 'Student sidebar should have Student Evaluation group')
    const studentReportCard = studentEvalGroup.subLinks.find((s) => s.to === '/student/student-evaluation/report-cards')
    assert.ok(studentReportCard, 'Student sidebar should have Report Card link')

    // Parent
    const parentLinks = sidebarModule.parentSidebarLinks
    const parentEvalGroup = parentLinks.find((l) => l.title === 'Student Evaluation')
    assert.ok(parentEvalGroup, 'Parent sidebar should have Student Evaluation group')
    const parentReportCard = parentEvalGroup.subLinks.find((s) => s.to === '/parent/student-evaluation/report-cards')
    assert.ok(parentReportCard, 'Parent sidebar should have Report Card link')

    // Principal
    const principalLinks = sidebarModule.principalSidebarLinks
    const principalEvalGroup = principalLinks.find((l) => l.title === 'Student Evaluation' || l.subLinks?.some(s => s.to?.includes('report-cards')))
    assert.ok(principalEvalGroup, 'Principal sidebar should have report cards in navigation')

    // Director
    const directorLinks = sidebarModule.directorSidebarLinks
    const directorReportCard = directorLinks.find((l) => l.to === '/director/student-evaluation/report-cards')
    assert.ok(directorReportCard, 'Director sidebar should have Progress Report Cards link')

    // Admin
    const adminLinks = sidebarModule.adminSidebarLinks
    const adminDocsGroup = adminLinks.find((l) => l.title === 'Documents')
    assert.ok(adminDocsGroup, 'Admin sidebar should have Documents group')
    const adminReportCard = adminDocsGroup.subLinks.find((s) => s.to === '/admin/student-evaluation/report-cards')
    assert.ok(adminReportCard, 'Admin sidebar should have Progress Report Cards link')
})

test('StudentPortalRoutes mounts Report Card and passes proper portalRole to escalation routes', async () => {
    const studentRoutesCode = await readFile(
        new URL('../../Routes/StudentPortalRoutes.jsx', import.meta.url),
        'utf8'
    )

    assert.match(studentRoutesCode, /student-evaluation\/report-cards/)
    assert.match(studentRoutesCode, /ReportCardGenerator/)
    assert.match(studentRoutesCode, /routePrefix\.replace\('\/', ''\) === 'parent' \? 'parent' : 'student'/)
})

test('Admin, Director, Teacher, and Coordinator routes mount ReportCardGenerator', async () => {
    const [adminCode, directorCode, teacherCode, coordCode] = await Promise.all([
        readFile(new URL('../../Routes/AdminRoutes.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../../Routes/DirectorRoutes.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../../Routes/TeacherRoutes.jsx', import.meta.url), 'utf8'),
        readFile(new URL('../../Routes/CoordinatorRoutes.jsx', import.meta.url), 'utf8'),
    ])

    assert.match(adminCode, /\/admin\/student-evaluation\/report-cards/)
    assert.match(directorCode, /\/director\/student-evaluation\/report-cards/)
    assert.match(teacherCode, /\/teacher\/student-evaluation\/report-cards/)
    assert.match(coordCode, /\/coordinator\/student-evaluation\/report-cards/)
})

test('Escalation configuration includes Parent role mapping and populates recipients without page refresh', async () => {
    const escalationUsersModule = await import('../EscalationManagement/escalationUsersData.js')
    const { ESCALATION_ROLE_TO_APP_ROLE, getEscalationRecipients } = escalationUsersModule

    assert.ok(ESCALATION_ROLE_TO_APP_ROLE.parent, 'parent role must be mapped in ESCALATION_ROLE_TO_APP_ROLE')

    const teacherRecipients = getEscalationRecipients('teacher')
    assert.ok(Array.isArray(teacherRecipients) && teacherRecipients.length > 0, 'Should return available teacher recipients')

    const principalRecipients = getEscalationRecipients('principal')
    assert.ok(Array.isArray(principalRecipients) && principalRecipients.length > 0, 'Should return available principal recipients')
})

test('Favicon is updated with QMIS branding and cache-busting v=2 in index.html', async () => {
    const indexHtml = await readFile(new URL('../../../index.html', import.meta.url), 'utf8')
    assert.match(indexHtml, /href="\/favicon\.png\?v=2"/)
    assert.match(indexHtml, /href="\/favicon\.svg\?v=2"/)
})
