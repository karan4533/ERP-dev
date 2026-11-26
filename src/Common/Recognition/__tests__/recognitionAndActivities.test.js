import test from 'node:test'
import assert from 'node:assert/strict'
import {
    calculateAcademicStarOfYear,
    calculateNonAcademicStarOfYear,
    getAuthorizedClassesForUser,
    getAuthorizedDepartmentsForUser,
    CLASS_ASSIGNMENTS,
    NON_ACADEMIC_DEPARTMENTS,
    getAcademicSomRecords,
    getNonAcademicSomRecords
} from '../recognitionData.js'
import { getActivities } from '../../Activities/activitiesData.js'

test('Class Teacher scoping restricts access strictly to assigned class', () => {
    // Teacher logged in with teacher@school.com (or teacher role) must only see Grade 10-A
    const teacherClasses = getAuthorizedClassesForUser('teacher', 'teacher@school.com')
    assert.deepEqual(teacherClasses, ['Grade 10-A'])

    // Unknown or generic teacher defaults to Grade 10-A assigned demo class
    const genericTeacherClasses = getAuthorizedClassesForUser('teacher', 'unknown-teacher@school.com')
    assert.deepEqual(genericTeacherClasses, ['Grade 10-A'])
})

test('Academic Coordinator scoping exposes secondary and senior secondary wings (Grades 9 to 12)', () => {
    const coordClasses = getAuthorizedClassesForUser('coordinator', 'coordinator@school.com')
    assert.ok(coordClasses.length >= 4)
    assert.ok(coordClasses.includes('Grade 9-A'))
    assert.ok(coordClasses.includes('Grade 10-A'))
    assert.ok(coordClasses.includes('Grade 11-A'))
    assert.ok(coordClasses.includes('Grade 12-A'))
    // Primary classes should NOT be visible to Senior secondary coordinator
    assert.ok(!coordClasses.includes('Grade 5-A'))
})

test('Executive leadership (Principal, Director, SuperAdmin) can view all academic classes', () => {
    const principalClasses = getAuthorizedClassesForUser('principal', 'principal@school.com')
    const directorClasses = getAuthorizedClassesForUser('director', 'director@school.com')
    const superAdminClasses = getAuthorizedClassesForUser('super-admin', 'superadmin@school.com')

    const totalClasses = Object.keys(CLASS_ASSIGNMENTS).length
    assert.equal(principalClasses.length, totalClasses)
    assert.equal(directorClasses.length, totalClasses)
    assert.equal(superAdminClasses.length, totalClasses)
})

test('Non-academic department scoping restricts department heads to their own department', () => {
    const storesHOD = getAuthorizedDepartmentsForUser('stationery-store-manager')
    assert.deepEqual(storesHOD.map((d) => d.id), ['dept-stores'])

    const transportHOD = getAuthorizedDepartmentsForUser('transport-manager')
    assert.deepEqual(transportHOD.map((d) => d.id), ['dept-transport'])

    const hrHOD = getAuthorizedDepartmentsForUser('hr')
    assert.deepEqual(hrHOD.map((d) => d.id), ['dept-hr'])

    // Executive leadership can view all 8 departments
    const directorDepts = getAuthorizedDepartmentsForUser('director')
    assert.equal(directorDepts.length, NON_ACADEMIC_DEPARTMENTS.length)
})

test('Star of the Year formula calculates weighted score and enforces minimum 2 monthly wins', () => {
    const academicRankings = calculateAcademicStarOfYear('2025-2026')
    assert.ok(academicRankings.length > 0)

    // Top ranked student must have rank 1 and score <= 100
    const topCandidate = academicRankings[0]
    assert.equal(topCandidate.rank, 1)
    assert.ok(topCandidate.cumulativeScore >= 90)
    assert.ok(topCandidate.isEligible)
    assert.ok(topCandidate.somCount >= 2)

    // Formula validation:
    // winPoints = Math.min(35, somCount * 15)
    // perfPoints = avgScore * 0.45
    // attPoints = attendance * 0.20
    // total = Math.min(100, Math.round(winPoints + perfPoints + attPoints))
    const winPoints = Math.min(35, topCandidate.somCount * 15)
    const perfPoints = topCandidate.avgScore * 0.45
    const attPoints = topCandidate.attendance * 0.20
    const expectedScore = Math.min(100, Math.round(winPoints + perfPoints + attPoints))
    assert.equal(topCandidate.cumulativeScore, expectedScore)
})

test('Non-Academic Star of the Year operates on organizational departments and calculates top performers', () => {
    const nonAcadRankings = calculateNonAcademicStarOfYear('2025-2026')
    assert.ok(nonAcadRankings.length > 0)

    const leader = nonAcadRankings[0]
    assert.equal(leader.rank, 1)
    assert.ok(leader.somCount >= 2)
    assert.ok(leader.department)
    assert.ok(leader.employeeName)
    assert.ok(leader.cumulativeScore >= 90)
})

test('Centralized Activities repository contains enriched multi-category records', () => {
    const activities = getActivities()
    assert.ok(activities.length >= 6)

    const types = new Set(activities.map((a) => a.type))
    assert.ok(types.has('cultural'))
    assert.ok(types.has('sports'))
    assert.ok(types.has('competition'))
    assert.ok(types.has('academic'))
    assert.ok(types.has('administrative'))

    // Verify chess tournament contains detailed competitor standings
    const chess = activities.find((a) => String(a.eventName).toLowerCase().includes('chess'))
    assert.ok(chess)
    assert.ok(Array.isArray(chess.players))
    assert.ok(chess.players.length > 0)
    assert.equal(chess.players[0].result, 'Winner')
})
