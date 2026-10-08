import { VEHICLES } from '../VehicleManagement/vehicleManagementData'

export const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque']

export const VEHICLE_OPTIONS = VEHICLES.map((vehicle) => ({
    id: vehicle.id,
    label: vehicle.vehicleNumber,
    driverName: vehicle.driverName,
}))

export const FUEL_STATIONS = [
    'Indian Oil — Anna Nagar',
    'HP Petrol Pump — Velachery',
    'Bharat Petroleum — Guindy',
    'Reliance Fuel Station — Tambaram',
    'Shell — Adyar',
]

export const SERVICE_TYPES = [
    'Periodic Maintenance',
    'Oil Change',
    'Tyre Replacement',
    'Brake Inspection',
    'Engine Overhaul',
    'AC Service',
    'Battery Replacement',
]

export const SERVICE_CENTERS = [
    'Chennai Automotive Service — Velachery',
    'TN Transport Works — Guindy',
    'Royal Motors Service — Adyar',
    'City Fleet Care — Tambaram',
    'Metro Vehicle Solutions — Porur',
]

export const OTHER_EXPENSE_TYPES = [
    'Toll',
    'Parking',
    'Permit Renewal',
    'Cleaning',
    'Misc Repair',
    'Insurance Premium',
    'Accessories',
]

export const FUEL_EXPENSES = [
    {
        id: 'FE-1001',
        expenseId: 'FE-1001',
        vehicleNumber: 'TN-09-AB-4521',
        driverName: 'Sandy Selva',
        fuelDate: '09-06-2026',
        fuelStation: 'Indian Oil — Anna Nagar',
        fuelQuantity: '120 L',
        amount: '₹12,480',
        paymentMode: 'UPI',
    },
    {
        id: 'FE-1002',
        expenseId: 'FE-1002',
        vehicleNumber: 'TN-09-CD-8834',
        driverName: 'Rajesh K. Kumar',
        fuelDate: '08-06-2026',
        fuelStation: 'HP Petrol Pump — Velachery',
        fuelQuantity: '150 L',
        amount: '₹15,600',
        paymentMode: 'Card',
    },
    {
        id: 'FE-1003',
        expenseId: 'FE-1003',
        vehicleNumber: 'TN-09-EF-2210',
        driverName: 'Priya M. Venkatesh',
        fuelDate: '07-06-2026',
        fuelStation: 'Bharat Petroleum — Guindy',
        fuelQuantity: '100 L',
        amount: '₹10,400',
        paymentMode: 'Cash',
    },
    {
        id: 'FE-1004',
        expenseId: 'FE-1004',
        vehicleNumber: 'TN-09-GH-5567',
        driverName: 'Mohan R. Das',
        fuelDate: '06-06-2026',
        fuelStation: 'Reliance Fuel Station — Tambaram',
        fuelQuantity: '140 L',
        amount: '₹14,560',
        paymentMode: 'Bank Transfer',
    },
    {
        id: 'FE-1005',
        expenseId: 'FE-1005',
        vehicleNumber: 'TN-09-IJ-3344',
        driverName: 'Kumaravel S.',
        fuelDate: '05-06-2026',
        fuelStation: 'Shell — Adyar',
        fuelQuantity: '90 L',
        amount: '₹9,360',
        paymentMode: 'UPI',
    },
]

export const SERVICE_EXPENSES = [
    {
        id: 'SE-1001',
        expenseId: 'SE-1001',
        vehicleNumber: 'TN-09-AB-4521',
        serviceType: 'Periodic Maintenance',
        serviceDate: '02-05-2026',
        serviceCenter: 'Chennai Automotive Service — Velachery',
        amount: '₹12,500',
        invoiceNumber: 'INV-SRV-2026-0142',
        remarks: 'Includes oil filter and air filter replacement.',
    },
    {
        id: 'SE-1002',
        expenseId: 'SE-1002',
        vehicleNumber: 'TN-09-CD-8834',
        serviceType: 'Brake Inspection',
        serviceDate: '18-04-2026',
        serviceCenter: 'TN Transport Works — Guindy',
        amount: '₹8,200',
        invoiceNumber: 'INV-SRV-2026-0098',
        remarks: 'Rear brake pads replaced; test drive completed.',
    },
    {
        id: 'SE-1003',
        expenseId: 'SE-1003',
        vehicleNumber: 'TN-09-EF-2210',
        serviceType: 'Oil Change',
        serviceDate: '25-05-2026',
        serviceCenter: 'Royal Motors Service — Adyar',
        amount: '₹4,800',
        invoiceNumber: 'INV-SRV-2026-0156',
        remarks: 'Synthetic engine oil used as per manufacturer spec.',
    },
    {
        id: 'SE-1004',
        expenseId: 'SE-1004',
        vehicleNumber: 'TN-09-GH-5567',
        serviceType: 'AC Service',
        serviceDate: '10-06-2026',
        serviceCenter: 'City Fleet Care — Tambaram',
        amount: '₹6,750',
        invoiceNumber: 'INV-SRV-2026-0171',
        remarks: 'AC gas refill and compressor check done.',
    },
    {
        id: 'SE-1005',
        expenseId: 'SE-1005',
        vehicleNumber: 'TN-09-IJ-3344',
        serviceType: 'Tyre Replacement',
        serviceDate: '28-03-2026',
        serviceCenter: 'Metro Vehicle Solutions — Porur',
        amount: '₹18,400',
        invoiceNumber: 'INV-SRV-2026-0067',
        remarks: 'All four tyres replaced with MRF school bus tyres.',
    },
]

export const OTHER_EXPENSES = [
    {
        id: 'OE-1001',
        expenseId: 'OE-1001',
        vehicleNumber: 'TN-09-AB-4521',
        expenseType: 'Toll',
        expenseDate: '09-06-2026',
        amount: '₹850',
        paidTo: 'NHAI Toll Plaza — Koyambedu',
        paymentMode: 'Fastag',
        description: 'Daily toll for North Campus route — June week 1',
    },
    {
        id: 'OE-1002',
        expenseId: 'OE-1002',
        vehicleNumber: 'TN-09-CD-8834',
        expenseType: 'Parking',
        expenseDate: '08-06-2026',
        amount: '₹200',
        paidTo: 'School Parking Facility',
        paymentMode: 'Cash',
        description: 'Overnight parking during inter-school event',
    },
    {
        id: 'OE-1003',
        expenseId: 'OE-1003',
        vehicleNumber: 'TN-09-EF-2210',
        expenseType: 'Permit Renewal',
        expenseDate: '01-06-2026',
        amount: '₹3,500',
        paidTo: 'RTO Chennai South',
        paymentMode: 'Bank Transfer',
        description: 'Annual school transport permit renewal',
    },
    {
        id: 'OE-1004',
        expenseId: 'OE-1004',
        vehicleNumber: 'TN-09-GH-5567',
        expenseType: 'Cleaning',
        expenseDate: '07-06-2026',
        amount: '₹1,200',
        paidTo: 'Sparkle Fleet Wash — Pallavaram',
        paymentMode: 'UPI',
        description: 'Deep interior cleaning after sports day trip',
    },
    {
        id: 'OE-1005',
        expenseId: 'OE-1005',
        vehicleNumber: 'TN-09-IJ-3344',
        expenseType: 'Accessories',
        expenseDate: '04-06-2026',
        amount: '₹2,450',
        paidTo: 'Auto Parts Hub — Chrompet',
        paymentMode: 'Card',
        description: 'First-aid kit and fire extinguisher replacement',
    },
]

export const getFuelExpenseById = (id) => FUEL_EXPENSES.find((item) => item.id === id) ?? null

export const getServiceExpenseById = (id) => SERVICE_EXPENSES.find((item) => item.id === id) ?? null

export const getOtherExpenseById = (id) => OTHER_EXPENSES.find((item) => item.id === id) ?? null
