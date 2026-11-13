import TransportRegister from '../../../Common/operations/TransportRegister'
import { deriveDutyState } from '../../../Common/operations/transportState'
import { StatusBadge } from '../../../Common/ui'
import { DUTIES } from './assignDutyData'

const records = DUTIES.map((duty) => ({ ...duty, operationalState: deriveDutyState(duty) }))

const columns = [
    { key: 'dutyId', label: 'Duty ID', required: true },
    {
        key: 'driverName',
        label: 'Driver',
        required: true,
        render: (duty) => (
            <div>
                <p className='font-semibold text-[var(--erp-ink)]'>{duty.driverName}</p>
                <p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{duty.driverId}</p>
            </div>
        ),
    },
    { key: 'vehicleNumber', label: 'Vehicle', required: true },
    { key: 'routeName', label: 'Route', required: true },
    { key: 'dutyDate', label: 'Duty date' },
    { key: 'shift', label: 'Shift' },
    { key: 'window', label: 'Duty window', render: (duty) => `${duty.startTime}–${duty.endTime}` },
    { key: 'operationalState', label: 'Schedule state', required: true, render: (duty) => <StatusBadge status={duty.operationalState} /> },
]

const AssignDuty = () => (
    <TransportRegister
        records={records}
        columns={columns}
        caption='Driver duty schedule register'
        title='Duty schedule'
        description='Published driver, vehicle and route assignments. Elapsed schedules are not presented as completed trips because live dispatch and arrival evidence is unavailable.'
        secondaryFilterKey='shift'
        secondaryFilterLabel='Shift'
        createPath='/transport-manager/assign-duty/add'
        createLabel='Assign duty'
        getRowActions={(duty) => [{ label: 'View', to: `/transport-manager/assign-duty/view/${duty.id}` }]}
    />
)

export default AssignDuty
