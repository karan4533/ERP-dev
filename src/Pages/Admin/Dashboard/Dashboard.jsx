import OperationalBriefing from '../../../Common/Governance/OperationalBriefing'

const metrics = [
    { label: 'Open admissions', value: '18', context: '6 awaiting document checks', icon: 'people' },
    { label: 'Pending approvals', value: '9', context: '3 due before end of day', icon: 'approvals' },
    { label: 'Attendance exceptions', value: '14', context: 'Students and employees combined', icon: 'risk' },
    { label: 'Documents incomplete', value: '22', context: 'Across active student records', icon: 'documents' },
]

const queues = [
    { title: 'Admission document verification', description: 'Review identity, guardian and prior-school evidence.', owner: 'Administration', sla: 'Today', status: 'Pending', to: '/admin/front-office/admission-list' },
    { title: 'Transfer certificate approvals', description: 'Validate clearance status before issuing certificates.', owner: 'Administrator', sla: '24 hours', status: 'In review', to: '/admin/tc-request-approval' },
    { title: 'Received leave decisions', description: 'Resolve requests waiting for an administrative decision.', owner: 'Administrator', sla: 'Today', status: 'Pending', to: '/admin/leave-request/received' },
]

const quickActions = [
    { label: 'Review admission enquiries', to: '/admin/front-office/admission-enquiry' },
    { label: 'Create a staff account', to: '/admin/rbac/user-creation/add' },
    { label: 'Manage role access', to: '/admin/rbac/roles' },
    { label: 'Assign a task', to: '/admin/task-management/assign-tasks/add' },
]

const Dashboard = () => (
    <OperationalBriefing
        title='Administration briefing'
        description='A focused view of admissions, records, approvals and access-control work that needs attention.'
        roleContext='Administrator workspace'
        metrics={metrics}
        queues={queues}
        quickActions={quickActions}
    />
)

export default Dashboard
