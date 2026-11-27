import * as XLSX from 'xlsx'
import { checklistTemplateHeaders, checklistTemplateRows, previewSomImport, previewSomImportRows } from './somChecklist'

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

export const downloadSomTemplateCsv = (filename, context, students, subs) => {
    const rows = checklistTemplateRows(context, students, subs)
    const lines = [
        checklistTemplateHeaders.join(','),
        ...rows.map((row) => checklistTemplateHeaders.map((key) => {
            const value = String(row[key] ?? '')
            return `"${value.replace(/"/g, '""')}"`
        }).join(',')),
    ]
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, String(filename || 'som-template').replace(/\.(csv|xlsx|xls)$/i, '') + '.csv')
}

export const downloadSomTemplateExcel = (filename, context, students, subs) => {
    const rows = checklistTemplateRows(context, students, subs)
    const sheet = XLSX.utils.json_to_sheet(rows, { header: checklistTemplateHeaders })
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'SOM Ratings')
    const data = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    triggerDownload(blob, String(filename || 'som-template').replace(/\.(csv|xlsx|xls)$/i, '') + '.xlsx')
}

/** Read CSV or Excel into a SOM import preview. */
export const previewSomImportFile = async (file, context, students, subs, existingRatings) => {
    const name = String(file?.name || '').toLowerCase()
    if (name.endsWith('.csv') || name.endsWith('.txt') || file?.type === 'text/csv') {
        const text = await file.text()
        return previewSomImport(text, context, students, subs, existingRatings)
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer()
        const book = XLSX.read(buffer, { type: 'array' })
        const sheet = book.Sheets[book.SheetNames[0]]
        if (!sheet) return { rows: [], errors: ['The workbook has no sheets.'], duplicates: [] }
        const tableRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
        return previewSomImportRows(tableRows, context, students, subs, existingRatings)
    }
    return {
        rows: [],
        errors: ['Upload a .csv or .xlsx file (download the sample template first).'],
        duplicates: [],
    }
}
