import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Download, Plus } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { toast } from 'react-toastify'
import ReactECharts from 'echarts-for-react'
import {
    deleteTransportExpense,
    getFuelExpenses,
    getServiceExpenses,
    getOtherExpenses,
    hydrateTransportExpensesFromApi,
    PAYMENT_MODES,
    SERVICE_TYPES,
    OTHER_EXPENSE_TYPES,
} from './transportExpensesData'
import { hydrateBudgetRequestsFromApi, transportBudgetOverview } from './transportBudget'

const TABS = [
    { id: 1, label: 'Fuel Management', key: 'fuel' },
    { id: 2, label: 'Service Expenses', key: 'service' },
    { id: 3, label: 'Other Expenses', key: 'other' },
]

const ADD_BUTTONS = {
    1: { to: '/transport-manager/transport-expenses/add/fuel', label: 'Add Fuel Expense' },
    2: { to: '/transport-manager/transport-expenses/add/service', label: 'Add Service Expense' },
    3: { to: '/transport-manager/transport-expenses/add/other', label: 'Add Other Expense' },
}

const TransportExpenses = () => {
    const [fuelExpenses, setFuelExpenses] = useState(() => getFuelExpenses())
    const [serviceExpenses, setServiceExpenses] = useState(() => getServiceExpenses())
    const [otherExpenses, setOtherExpenses] = useState(() => getOtherExpenses())
    const [budget, setBudget] = useState(() => transportBudgetOverview())
    const [loadingLive, setLoadingLive] = useState(true)

    const refreshExpenses = () => {
        setFuelExpenses(getFuelExpenses())
        setServiceExpenses(getServiceExpenses())
        setOtherExpenses(getOtherExpenses())
        setBudget(transportBudgetOverview())
    }

    useEffect(() => {
        let cancelled = false
        setLoadingLive(true)
        Promise.all([
            hydrateTransportExpensesFromApi(),
            hydrateBudgetRequestsFromApi(),
        ]).finally(() => {
            if (!cancelled) {
                refreshExpenses()
                setLoadingLive(false)
            }
        })
        return () => { cancelled = true }
    }, [])

    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [activeTab, setActiveTab] = useState(1)
    const [exportModal, setExportModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const openDelete = (expenseId) => {
        setPendingDeleteId(expenseId)
        setDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!pendingDeleteId || deleting) return
        setDeleting(true)
        const result = await deleteTransportExpense(pendingDeleteId)
        setDeleting(false)
        setDeleteModal(false)
        setPendingDeleteId(null)
        if (result?.success === false) {
            toast.error(result.message || 'Could not delete expense.')
            return
        }
        refreshExpenses()
        toast.success(result?.api ? 'Expense deleted from campus API.' : 'Expense deleted.')
    }

    const budgetOption = {
        tooltip: { trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: [
                `Previous (${budget.previousYear || '—'})`,
                `Current (${budget.currentYear || '—'})`,
                'Actual Expenses',
            ],
        },
        yAxis: { type: 'value' },
        series: [{
            type: 'bar',
            data: [budget.previous, budget.current, budget.actual],
            itemStyle: { color: '#515DEF' },
        }],
    }
    const activeRows = activeTab === 1
        ? fuelExpenses
        : activeTab === 2
            ? serviceExpenses
            : otherExpenses
    const activeCount = activeRows.length
    const emptyLabel = activeTab === 1
        ? 'No fuel expenses yet. Add one or wait for Principal-approved fuel claims.'
        : activeTab === 2
            ? 'No service expenses yet. Add one or wait for Principal-approved maintenance.'
            : 'No other expenses yet.'

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input type='text' id='search' placeholder='Expense ID, vehicle, driver...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    {activeTab === 1 && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='payment-mode-filter' className='text-base font-medium text-[#808080]'>Payment Mode</label>
                            <select id='payment-mode-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                <option value=''>All</option>
                                {PAYMENT_MODES.map((mode) => (
                                    <option key={mode} value={mode}>{mode}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeTab === 2 && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='service-type-filter' className='text-base font-medium text-[#808080]'>Service Type</label>
                            <select id='service-type-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                <option value=''>All</option>
                                {SERVICE_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeTab === 3 && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='expense-type-filter' className='text-base font-medium text-[#808080]'>Expense Type</label>
                            <select id='expense-type-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                <option value=''>All</option>
                                {OTHER_EXPENSE_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black mb-4'>Transport Budget Overview</h2>
                <p className='text-xs text-[#667085] mb-3'>
                    {loadingLive
                        ? 'Loading campus budget & expenses…'
                        : budget.apiLive
                            ? 'Live from campus budget requests + fuel / service / other expense rows (no demo seed).'
                            : 'Offline mode — figures stay empty until ops API is connected.'}
                </p>
                {!loadingLive && !budget.hasCurrent && !budget.hasPrevious && (
                    <p className='text-sm text-[#B45309] bg-[#FFF7ED] border border-[#FDBA74] rounded-md px-3 py-2 mb-3'>
                        No approved transport budget requests on campus yet. Actual expenses still update from the tables below.
                    </p>
                )}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-sm'>
                    <p>Previous Budget: ₹{budget.previous.toLocaleString('en-IN')}</p>
                    <p>Current Budget: ₹{budget.current.toLocaleString('en-IN')}</p>
                    <p>Actual Expenses: ₹{budget.actual.toLocaleString('en-IN')}</p>
                    <p>Balance: ₹{budget.balance.toLocaleString('en-IN')}</p>
                </div>
                <ReactECharts option={budgetOption} style={{ height: 260 }} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Transport Expenses</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={ADD_BUTTONS[activeTab].to}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            {ADD_BUTTONS[activeTab].label}
                        </NavLink>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>

                <div className='flex gap-6 overflow-x-auto no-scrollbar my-6'>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap px-2 pb-2 text-sm md:text-lg font-medium cursor-pointer transition-all duration-200 ${activeTab === tab.id
                                ? 'text-[#515DEF] border-b-2 border-[#515DEF] font-semibold'
                                : 'text-[#808080]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 1 && (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Expense ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle Number</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Fuel Date</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Fuel Station</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Fuel Quantity</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Amount</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Payment Mode</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fuelExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>{emptyLabel}</td>
                                    </tr>
                                )}
                                {fuelExpenses.map((expense) => (
                                    <tr key={expense.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{expense.expenseId || expense.id}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{expense.vehicleNumber}</td>
                                        <td className='px-2 py-4'>{expense.driverName}</td>
                                        <td className='px-2 py-4'>{expense.fuelDate}</td>
                                        <td className='px-2 py-4'>{expense.fuelStation}</td>
                                        <td className='px-2 py-4'>{expense.fuelQuantity}</td>
                                        <td className='px-2 py-4'>{expense.amount}</td>
                                        <td className='px-2 py-4'>{expense.paymentMode}</td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/transport-manager/transport-expenses/view/fuel/${expense.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                                <NavLink
                                                    to={`/transport-manager/transport-expenses/edit/fuel/${expense.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </NavLink>
                                                <button type='button' onClick={() => openDelete(expense.id)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                    Delete
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 2 && (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Expense ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle Number</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Service Type</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Service Date</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Service Center</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Amount</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Invoice Number</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>{emptyLabel}</td>
                                    </tr>
                                )}
                                {serviceExpenses.map((expense) => (
                                    <tr key={expense.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{expense.expenseId || expense.id}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{expense.vehicleNumber}</td>
                                        <td className='px-2 py-4'>{expense.serviceType}</td>
                                        <td className='px-2 py-4'>{expense.serviceDate}</td>
                                        <td className='px-2 py-4'>{expense.serviceCenter}</td>
                                        <td className='px-2 py-4'>{expense.amount}</td>
                                        <td className='px-2 py-4'>{expense.invoiceNumber}</td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/transport-manager/transport-expenses/view/service/${expense.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                                <NavLink
                                                    to={`/transport-manager/transport-expenses/edit/service/${expense.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </NavLink>
                                                <button type='button' onClick={() => openDelete(expense.id)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                    Delete
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 3 && (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Expense ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle Number</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Expense Type</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Expense Date</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Amount</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Paid To</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Payment Mode</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otherExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>{emptyLabel}</td>
                                    </tr>
                                )}
                                {otherExpenses.map((expense) => (
                                    <tr key={expense.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{expense.expenseId || expense.id}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{expense.vehicleNumber}</td>
                                        <td className='px-2 py-4'>{expense.expenseType}</td>
                                        <td className='px-2 py-4'>{expense.expenseDate}</td>
                                        <td className='px-2 py-4'>{expense.amount}</td>
                                        <td className='px-2 py-4'>{expense.paidTo}</td>
                                        <td className='px-2 py-4'>{expense.paymentMode}</td>
                                        <td className='px-2 py-4 max-w-xs'>{expense.description}</td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/transport-manager/transport-expenses/view/other/${expense.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                                <NavLink
                                                    to={`/transport-manager/transport-expenses/edit/other/${expense.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </NavLink>
                                                <button type='button' onClick={() => openDelete(expense.id)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                    Delete
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {activeCount} of {activeCount} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <DeleteRequestModal
                deleteRequestModal={deleteModal}
                setDeleteRequestModal={setDeleteModal}
                onConfirm={handleConfirmDelete}
                title='Delete Expense?'
                message='This will permanently remove this expense. This action cannot be undone.'
                confirmLabel={deleting ? 'Deleting…' : 'Delete'}
            />
        </section>
    )
}

export default TransportExpenses
