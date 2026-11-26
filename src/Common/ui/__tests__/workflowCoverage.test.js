import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routeFiles = [
    '../../../Routes/DirectorRoutes.jsx',
    '../../../Routes/CoordinatorRoutes.jsx',
    '../../../Routes/TeacherRoutes.jsx',
]

test('known student-allocation routes explain unavailable workflows instead of silently opening a dashboard', async () => {
    const sources = await Promise.all(
        routeFiles.map((file) => readFile(new URL(file, import.meta.url), 'utf8')),
    )

    sources.forEach((source) => {
        assert.doesNotMatch(
            source,
            /path=["']\/[^"']+\/student-allocation[^"']*["']\s+element=\{<Navigate\s+to=["'][^"']+\/dashboard/,
        )
        assert.match(source, /UnavailableWorkflowPage/)
    })
})
