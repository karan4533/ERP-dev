/**
 * Client-side table export helpers used by ExportModal.
 * Excel is a real .xlsx (SheetJS, loaded on demand); PDF opens a print-friendly HTML table.
 */

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

const escapeHtml = (value) =>
    String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const normalizeRows = (rows, columns) => {
    const list = Array.isArray(rows) ? rows.filter((row) => row && typeof row === 'object') : []
    if (!list.length) return { headers: [], body: [] }
    const headers = Array.isArray(columns) && columns.length
        ? columns.map((col) => (typeof col === 'string' ? col : col.key))
        : Object.keys(list[0])
    const labels = Array.isArray(columns) && columns.length
        ? columns.map((col) => (typeof col === 'string' ? col : col.label || col.key))
        : headers
    const body = list.map((row) =>
        headers.map((key) => {
            const raw = row[key]
            if (raw == null) return ''
            if (typeof raw === 'object') return JSON.stringify(raw)
            return String(raw)
        }),
    )
    return { headers: labels, body }
}

const baseName = (filename) => String(filename || 'export').replace(/\.(csv|xlsx|xls|pdf)$/i, '')

const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

/** Kept for the HR CSV helper re-export; ExportModal offers Excel and PDF only. */
export const downloadTableCsv = (filename, rows, columns) => {
    const { headers, body } = normalizeRows(rows, columns)
    if (!headers.length) return false
    const lines = [
        headers.map(escapeCsv).join(','),
        ...body.map((cells) => cells.map(escapeCsv).join(',')),
    ]
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, `${baseName(filename)}.csv`)
    return true
}

export const downloadTableExcel = async (filename, rows, columns) => {
    const { headers, body } = normalizeRows(rows, columns)
    if (!headers.length) return false
    const XLSX = await import('xlsx')
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...body])
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Export')
    const bytes = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    triggerDownload(blob, `${baseName(filename)}.xlsx`)
    return true
}

export const openTablePdf = (title, rows, columns) => {
    const { headers, body } = normalizeRows(rows, columns)
    if (!headers.length) return false
    const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
    const trs = body.map((cells) => `<tr>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')
    const safeTitle = escapeHtml(title || 'Export')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#1e1e1e}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5}</style>
</head><body><h1>${safeTitle}</h1><table><thead><tr>${head}</tr></thead><tbody>${trs}</tbody></table></body></html>`
    // 'noopener' makes window.open return null, so the window could never be written to.
    const frame = window.open('', '_blank', 'width=960,height=720')
    if (!frame) return false
    frame.opener = null
    frame.document.write(html)
    frame.document.close()
    frame.focus()
    frame.print()
    return true
}

export const runTableExport = async (format, { filename = 'export', rows = [], columns, title } = {}) => {
    if (!Array.isArray(rows) || rows.length === 0) return { ok: false, reason: 'empty' }
    if (format === 'pdf') return { ok: openTablePdf(title || filename, rows, columns), reason: 'pdf' }
    if (format === 'excel') return { ok: await downloadTableExcel(filename, rows, columns), reason: 'excel' }
    return { ok: false, reason: 'unsupported' }
}
