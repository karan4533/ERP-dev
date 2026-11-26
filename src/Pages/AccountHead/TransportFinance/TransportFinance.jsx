import { useState } from 'react'
import { Download } from 'lucide-react'
import { IntegrationNotice, PageHeader } from '../../../Common/ui'
import AddVehicleModal from './Components/AddVehicleModal'
import LogDamageModal from './Components/LogDamageModal'
import FleetServiceTab from './Components/FleetServiceTab'
import MaintenanceDamageTab from './Components/MaintenanceDamageTab'
import ComplianceTab from './Components/ComplianceTab'
import FuelExpenseClaimsTab from './Components/FuelExpenseClaimsTab'
import StaffSalariesTab from './Components/StaffSalariesTab'
import {
    FLEET_VEHICLES,
    MAINTENANCE_RECORDS,
    TRANSPORT_ACADEMIC_YEARS,
    TRANSPORT_TABS,
} from './transportFinanceData'

const TransportFinance = () => {
    const [activeTab, setActiveTab] = useState('fleet-service')
    const [academicYear, setAcademicYear] = useState(TRANSPORT_ACADEMIC_YEARS[0])
    const [addVehicleModal, setAddVehicleModal] = useState(false)
    const [logDamageModal, setLogDamageModal] = useState(false)
    const [fleetVehicles, setFleetVehicles] = useState(FLEET_VEHICLES)
    const [maintenanceRecords, setMaintenanceRecords] = useState(MAINTENANCE_RECORDS)

    const addLocalVehicle = (vehicle) => {
        setFleetVehicles((current) => [{
            id: `V-${Date.now()}`,
            ...vehicle,
            lastService: 'Not recorded',
            nextServiceDue: 'Not scheduled',
            odometer: '0 km',
            status: 'Idle',
        }, ...current])
    }

    const addLocalMaintenanceRecord = (record) => {
        setMaintenanceRecords((current) => [{
            id: `MR-${Date.now()}`,
            ...record,
            status: 'Pending Approval',
        }, ...current])
    }

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Transport finance'
                description='Review fleet, maintenance, compliance, claims and payroll evidence without implying a connected transport, banking or document service.'
                context={`Academic year ${academicYear} · all routes · local workspace`}
                actions={(
                    <>
                        <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Academic year
                            <select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                {TRANSPORT_ACADEMIC_YEARS.map((year) => <option key={year}>{year}</option>)}
                            </select>
                        </label>
                        <button type='button' disabled title='Export requires the connected transport reporting API.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>
                            <Download aria-hidden='true' size={16} /> Export unavailable
                        </button>
                    </>
                )}
            />
            <IntegrationNotice state='demo' title='Browser-stored transport workspace' description='Seeded figures are sample reference data. Vehicles and maintenance records added here last only for this session; production requires transport master-data, approval, payroll, document, audit and reporting APIs.' />

            <div className='flex gap-2 overflow-x-auto border-b border-[var(--erp-line)]' role='tablist' aria-label='Transport finance views'>
                {TRANSPORT_TABS.map((tab) => (
                    <button key={tab.id} type='button' role='tab' aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${activeTab === tab.id ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]' : 'border-transparent text-[var(--erp-slate)]'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'fleet-service' && <FleetServiceTab fleetVehicles={fleetVehicles} onAddVehicle={() => setAddVehicleModal(true)} />}
            {activeTab === 'maintenance-damage' && <MaintenanceDamageTab maintenanceRecords={maintenanceRecords} onLogDamage={() => setLogDamageModal(true)} />}
            {activeTab === 'compliance' && <ComplianceTab />}
            {activeTab === 'fuel-expense-claims' && <FuelExpenseClaimsTab />}
            {activeTab === 'staff-salaries' && <StaffSalariesTab />}

            <AddVehicleModal isOpen={addVehicleModal} onClose={() => setAddVehicleModal(false)} onSave={addLocalVehicle} />
            <LogDamageModal isOpen={logDamageModal} onClose={() => setLogDamageModal(false)} onSave={addLocalMaintenanceRecord} />
        </section>
    )
}

export default TransportFinance
