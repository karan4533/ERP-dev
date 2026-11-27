/**
 * Inventory of every <ExportModal> in src/: how its rows are supplied and whether it is usable.
 * Run: node backend/scripts/_export_inventory.mjs [--json out.json]
 *
 * Classes:
 *   disabled-sample   unavailableReason set: page has no live dataset, export refused with a message
 *   custom-handler    onExport callback builds the file itself
 *   live-columns      rows from page state/props with explicit columns (current API data)
 *   live-auto-columns rows from page state/props; columns derived from the first row
 *   constant-rows     rows bound directly to an UPPER_CASE constant (likely demo data) — needs review
 *   no-rows           ExportModal rendered without rows
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const walk = (dir) => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : /\.(jsx|js)$/.test(name) ? [path] : []
})

const rows = []
for (const file of walk(join(root, 'src'))) {
    if (file.endsWith('ExportModal.jsx')) continue
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/<ExportModal\b([\s\S]*?)\/>/g)) {
        const props = match[1]
        const rowsExpr = (props.match(/\brows=\{([^}]*(?:\}[^}]*)?)\}/) || [])[1]?.trim() || ''
        let kind
        if (/unavailableReason=/.test(props)) kind = 'disabled-sample'
        else if (/onExport=/.test(props)) kind = 'custom-handler'
        else if (!rowsExpr) kind = 'no-rows'
        else if (/^[A-Z][A-Z0-9_]+$/.test(rowsExpr)) kind = 'constant-rows'
        else if (/columns=/.test(props)) kind = 'live-columns'
        else kind = 'live-auto-columns'
        rows.push({
            file: relative(root, file).replace(/\\/g, '/'),
            kind,
            rows: rowsExpr.slice(0, 80),
            dateRange: /enableDateRange/.test(props),
        })
    }
}

const counts = rows.reduce((acc, row) => ({ ...acc, [row.kind]: (acc[row.kind] || 0) + 1 }), {})
console.log(JSON.stringify({ total: rows.length, counts }, null, 2))
for (const row of rows.filter((r) => r.kind === 'constant-rows' || r.kind === 'no-rows')) {
    console.log(`${row.kind.padEnd(14)} ${row.file}  rows=${row.rows}`)
}
const outIndex = process.argv.indexOf('--json')
if (outIndex > 0) writeFileSync(process.argv[outIndex + 1], JSON.stringify({ counts, rows }, null, 2))
