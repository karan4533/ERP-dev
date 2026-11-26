import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../../../App.jsx', import.meta.url), 'utf8')
const parentChildSource = readFileSync(new URL('../../../Pages/Parent/ChildSelection.jsx', import.meta.url), 'utf8')
const transportDashboardSource = readFileSync(new URL('../../../Pages/TransportManager/Dashboard/Dashboard.jsx', import.meta.url), 'utf8')

test('authenticated role layouts are split behind lazy imports and one suspense fallback', () => {
    const lazyLayouts = [...appSource.matchAll(/lazy\(\(\) => import\("\.\/Layout\/[^"]+Layout"\)\)/g)]

    assert.equal(lazyLayouts.length, 26)
    assert.match(appSource, /<Suspense fallback=\{<LayoutLoading \/>\}>/)
    assert.doesNotMatch(appSource, /import\s+(?!AuthLayout\b)\w+Layout\s+from\s+["']\.\/Layout\//)
})

test('lazy-layout fallback exposes an accessible loading state', () => {
    assert.match(appSource, /kind='loading'/)
    assert.match(appSource, /Loading role workspace/)
})

test('role home screens expose a main landmark and a visible dashboard heading', () => {
    assert.match(parentChildSource, /<main\b/)
    assert.match(transportDashboardSource, /<PageHeader\b/)
    assert.doesNotMatch(transportDashboardSource, /=>\s*null/)
})
