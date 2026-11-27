import * as XLSX from 'xlsx'
import {
    INDIVIDUAL_SOM_TEMPLATE_HEADERS,
    individualSomTemplateRows,
    previewIndividualSomImportCsv,
    previewIndividualSomImportRows,
} from './studentStarRatingsData'

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

export const downloadIndividualSomTemplateCsv = (filename, students, month) => {
    const rows = individualSomTemplateRows(students, month)
    const lines = [
        INDIVIDUAL_SOM_TEMPLATE_HEADERS.join(','),
        ...rows.map((row) => INDIVIDUAL_SOM_TEMPLATE_HEADERS.map((key) => {
            const value = String(row[key] ?? '')
            return `"${value.replace(/"/g, '""')}"`
        }).join(',')),
    ]
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, String(filename || 'som-individual-template').replace(/\.(csv|xlsx|xls)$/i, '') + '.csv')
}

export const downloadIndividualSomTemplateExcel = (filename, students, month) => {
    const rows = individualSomTemplateRows(students, month)
    const sheet = XLSX.utils.json_to_sheet(rows, { header: INDIVIDUAL_SOM_TEMPLATE_HEADERS })
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'SOM Individual')
    const data = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    triggerDownload(blob, String(filename || 'som-individual-template').replace(/\.(csv|xlsx|xls)$/i, '') + '.xlsx')
}

export const previewIndividualSomImportFile = async (file, students, existing) => {
    const name = String(file?.name || '').toLowerCase()
    if (name.endsWith('.csv') || name.endsWith('.txt') || file?.type === 'text/csv') {
        return previewIndividualSomImportCsv(await file.text(), students, existing)
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer()
        const book = XLSX.read(buffer, { type: 'array' })
        const sheet = book.Sheets[book.SheetNames[0]]
        if (!sheet) return { rows: [], errors: ['The workbook has no sheets.'], duplicates: [] }
        const tableRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
        return previewIndividualSomImportRows(tableRows, students, existing)
    }
    return {
        rows: [],
        errors: ['Upload a .csv or .xlsx file (download the sample template first).'],
        duplicates: [],
    }
}
