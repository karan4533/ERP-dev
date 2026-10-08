export function openPrintDocument({ title, body, css = '' }) {
    const frame = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800')
    if (!frame) return false
    frame.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
        body{font-family:Arial,sans-serif;color:#1e1e1e;margin:16px}
        table{width:100%;border-collapse:collapse}
        td,th{border:1px solid #1e1e1e;padding:6px;vertical-align:top;font-size:12px}
        h1,h2,p{margin:0}
        ${css}
    </style></head><body>${body}</body></html>`)
    frame.document.close()
    frame.focus()
    frame.print()
    return true
}

export function downloadHtml(filename, html) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.html') ? filename : `${filename}.html`
    link.click()
    URL.revokeObjectURL(url)
}
