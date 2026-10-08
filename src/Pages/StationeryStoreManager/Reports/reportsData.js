export const REPORT_TYPES = [
    'Stock Movement Report',
    'Consumption Report',
    'Expense Report',
    'Low Stock Report',
]

export const STOCK_MOVEMENT_REPORT = [
    { item: 'Blue Ballpoint Pen', openingStock: 470, issued: 120, returned: 15, closingStock: 365 },
    { item: 'A4 Paper Ream (500 sheets)', openingStock: 48, issued: 42, returned: 2, closingStock: 8 },
    { item: 'Spiral Notebook — 200 pages', openingStock: 120, issued: 85, returned: 10, closingStock: 45 },
    { item: 'HP 803 Black Ink Cartridge', openingStock: 30, issued: 8, returned: 2, closingStock: 24 },
    { item: 'Whiteboard Marker — Black', openingStock: 50, issued: 18, returned: 0, closingStock: 32 },
]

export const CONSUMPTION_REPORT = [
    { item: 'Blue Ballpoint Pen', quantityUsed: 120, department: 'Mathematics', period: 'June 2026' },
    { item: 'A4 Paper Ream (500 sheets)', quantityUsed: 42, department: 'Administration', period: 'June 2026' },
    { item: 'Whiteboard Marker — Black', quantityUsed: 18, department: 'Science', period: 'June 2026' },
    { item: 'Stapler Pins (Box of 1000)', quantityUsed: 8, department: 'Front Office', period: 'June 2026' },
    { item: 'Spiral Notebook — 200 pages', quantityUsed: 75, department: 'Class 10-A', period: 'June 2026' },
]

export const EXPENSE_REPORT = [
    { invoiceNo: 'INV-OM-8821', productName: 'A4 Paper Ream', vendor: 'Office Mart India', amount: '₹5,400', date: '15-03-2026' },
    { invoiceNo: 'INV-PP-4412', productName: 'Blue Ballpoint Pen', vendor: 'PaperPro Supplies', amount: '₹2,240', date: '02-05-2026' },
    { invoiceNo: 'INV-PT-1109', productName: 'HP 803 Black Ink Cartridge', vendor: 'PrintTech Solutions', amount: '₹20,400', date: '10-01-2026' },
    { invoiceNo: 'INV-CW-3301', productName: 'Spiral Notebook — 200 pages', vendor: 'Classmate Wholesale', amount: '₹48,750', date: '08-06-2026' },
    { invoiceNo: 'INV-CS-7701', productName: 'Whiteboard Marker — Black', vendor: 'Creative Stationers', amount: '₹1,260', date: '01-06-2026' },
]

export const LOW_STOCK_REPORT = [
    { item: 'A4 Paper Ream (500 sheets)', currentQty: 8, reorderLevel: 20 },
    { item: 'Stapler Pins (Box of 1000)', currentQty: 5, reorderLevel: 15 },
    { item: 'Spiral Notebook — 200 pages', currentQty: 0, reorderLevel: 50 },
    { item: 'Blue Ballpoint Pen', currentQty: 45, reorderLevel: 100 },
]
