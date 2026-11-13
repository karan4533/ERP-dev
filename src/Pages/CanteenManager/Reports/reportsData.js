export const SUMMARY_CARDS = [
    { label: 'Total Sales Today', value: '₹18,450', sub: '126 orders' },
    { label: 'Total Sales This Month', value: '₹4,82,600', sub: 'June 2026' },
    { label: 'Inventory Consumption Cost', value: '₹1,24,800', sub: 'This month' },
    { label: 'Wastage Cost', value: '₹8,350', sub: 'This month' },
    { label: 'Pending Vendor Bills', value: '₹62,000', sub: '2 invoices' },
    { label: 'Top Selling Menu Item', value: 'Veg Biryani', sub: '348 orders' },
    { label: 'Report Categories', value: '5', sub: 'Sales, Inventory, Wastage, Vendor, Orders' },
]

export const REPORT_CATEGORIES = [
    'Sales Report',
    'Inventory Consumption Report',
    'Wastage Report',
    'Vendor Purchase Report',
    'Order Summary Report',
]

export const SALES_REPORT = [
    { orderId: 'ORD-1042', customerName: 'Rahul Sharma', customerType: 'Student', orderDate: '10-06-2026', amount: '₹85', paymentMethod: 'Wallet', status: 'Preparing' },
    { orderId: 'ORD-1041', customerName: 'Priya Nair', customerType: 'Student', orderDate: '10-06-2026', amount: '₹120', paymentMethod: 'Cash', status: 'Completed' },
    { orderId: 'ORD-1040', customerName: 'Anita Verma', customerType: 'Staff', orderDate: '10-06-2026', amount: '₹60', paymentMethod: 'Wallet', status: 'Ready' },
    { orderId: 'ORD-1039', customerName: 'Meena Devi', customerType: 'Student', orderDate: '09-06-2026', amount: '₹55', paymentMethod: 'Wallet', status: 'Cancelled' },
    { orderId: 'ORD-1038', customerName: 'John Milton', customerType: 'Staff', orderDate: '09-06-2026', amount: '₹145', paymentMethod: 'Cash', status: 'Completed' },
]

export const INVENTORY_CONSUMPTION_REPORT = [
    { itemName: 'Basmati Rice', openingStock: '25', consumedQuantity: '8', remainingStock: '17', unit: 'kg', consumptionDate: '10-06-2026' },
    { itemName: 'Cooking Oil', openingStock: '15', consumedQuantity: '4', remainingStock: '11', unit: 'L', consumptionDate: '10-06-2026' },
    { itemName: 'Fresh Vegetables', openingStock: '40', consumedQuantity: '18', remainingStock: '22', unit: 'kg', consumptionDate: '10-06-2026' },
    { itemName: 'Chicken (Fresh)', openingStock: '12', consumedQuantity: '5', remainingStock: '7', unit: 'kg', consumptionDate: '09-06-2026' },
]

export const WASTAGE_REPORT = [
    { itemName: 'Masala Dosa Batter', wastedQuantity: '3', unit: 'kg', reason: 'Expired — not used within shelf life', recordedBy: 'Rajesh Kumar', date: '10-06-2026' },
    { itemName: 'Fresh Fruit Juice', wastedQuantity: '2', unit: 'L', reason: 'Spillage during prep', recordedBy: 'Priya Sharma', date: '09-06-2026' },
    { itemName: 'Bread Slices', wastedQuantity: '1.5', unit: 'kg', reason: 'Stale — end of day discard', recordedBy: 'Rajesh Kumar', date: '08-06-2026' },
]

export const VENDOR_PURCHASE_REPORT = [
    { purchaseId: 'PUR-2026-014', vendor: 'Green Farm Supplies', itemCount: 12, purchaseAmount: '₹62,000', invoiceNo: 'INV-GFS-4521', purchaseDate: '02-06-2026' },
    { purchaseId: 'PUR-2026-011', vendor: 'Metro Dairy Products', itemCount: 6, purchaseAmount: '₹28,400', invoiceNo: 'INV-MDP-8892', purchaseDate: '28-05-2026' },
    { purchaseId: 'PUR-2026-009', vendor: 'Kitchen Pro Equipment', itemCount: 1, purchaseAmount: '₹28,500', invoiceNo: 'INV-KPE-1104', purchaseDate: '05-06-2026' },
]

export const orderStatusBadgeColor = {
    Preparing: 'bg-[#2196F333] text-[#2196F3]',
    Ready: 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Cancelled: 'bg-[#FF000033] text-[#FF0000]',
}
