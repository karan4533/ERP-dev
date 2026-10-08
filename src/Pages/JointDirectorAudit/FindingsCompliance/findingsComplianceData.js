export const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']

export const FINDING_STATUSES = ['Open', 'In Progress', 'Closed']

export const COMPLIANCE_STATUSES = ['Pending', 'Complied', 'Overdue']

export const DEPARTMENTS = [
    'Operations',
    'HR',
    'Academic',
    'Finance',
    'Transport',
    'IT Support',
    'Canteen',
    'Housekeeping',
    'Stationery Store',
]

export const FINDINGS = [
    {
        id: 'FND-2026-041',
        auditId: 'AUD-2026-021',
        department: 'IT Support',
        title: 'Network switch failure — Block C labs offline',
        severity: 'Critical',
        responsiblePerson: 'Karthik Rajan',
        dueDate: '12-06-2026',
        status: 'In Progress',
        complianceStatus: 'Overdue',
        observation:
            'Core network switch in Block C computer labs failed, disrupting connectivity for 4 labs and 480 students during internal assessments.',
        correctiveAction:
            'Replace failed switch unit, restore backup configuration, and validate lab connectivity before 12-06-2026 exam sessions.',
        actionTaken:
            'Replacement parts ordered on 10-06-2026. IT team staged temporary VLAN routing for 2 labs. Full switch replacement pending vendor delivery.',
        closureNotes: 'Pending hardware installation and post-replacement network validation sign-off.',
        raisedDate: '09-06-2026',
        auditTitle: 'IT Access Control & Backup Audit',
    },
    {
        id: 'FND-2026-038',
        auditId: 'AUD-2026-020',
        department: 'Transport',
        title: 'Route 5 bus brake inspection overdue',
        severity: 'Critical',
        responsiblePerson: 'Suresh Iyer',
        dueDate: '14-06-2026',
        status: 'Open',
        complianceStatus: 'Pending',
        observation:
            'Safety inspection flagged critical brake wear on Route 5 bus (TN-09-AB-4521). Vehicle grounded but maintenance documentation incomplete.',
        correctiveAction:
            'Complete brake system replacement, update maintenance log, and obtain safety clearance before returning vehicle to service.',
        actionTaken: 'Vehicle grounded on 08-06-2026. Workshop quotation approved. Repair work scheduled for 13-06-2026.',
        closureNotes: 'Awaiting workshop completion certificate and post-repair road test report.',
        raisedDate: '08-06-2026',
        auditTitle: 'Transport Fleet Maintenance Review',
    },
    {
        id: 'FND-2026-035',
        auditId: 'AUD-2026-022',
        department: 'Finance',
        title: 'Unsupported petty cash reimbursements',
        severity: 'High',
        responsiblePerson: 'Finance Controller',
        dueDate: '18-06-2026',
        status: 'In Progress',
        complianceStatus: 'Pending',
        observation:
            'Two petty cash vouchers totalling ₹4,200 lack supporting receipts and approver signatures in Q2 reconciliation sample.',
        correctiveAction:
            'Obtain missing receipts or initiate recovery from responsible staff. Update petty cash policy acknowledgment for all handlers.',
        actionTaken: 'Finance team contacted voucher submitters on 15-06-2026. One receipt recovered; second under review.',
        closureNotes: 'Partial remediation — one of two vouchers resolved.',
        raisedDate: '14-06-2026',
        auditTitle: 'Finance Petty Cash Reconciliation',
    },
    {
        id: 'FND-2026-032',
        auditId: 'AUD-2026-019',
        department: 'Canteen',
        title: 'Refrigeration unit below safe temperature',
        severity: 'High',
        responsiblePerson: 'Ravi Menon',
        dueDate: '13-06-2026',
        status: 'In Progress',
        complianceStatus: 'Overdue',
        observation:
            'Secondary kitchen refrigeration unit recorded below 4°C safe threshold for perishable storage on 11-06-2026.',
        correctiveAction:
            'Repair or replace refrigeration unit, discard affected stock, and implement daily temperature logging.',
        actionTaken: 'Affected stock discarded. Maintenance vendor engaged. Temporary cold storage arranged from main kitchen unit.',
        closureNotes: 'Temperature logs resumed daily from 12-06-2026. Awaiting repair completion report.',
        raisedDate: '11-06-2026',
        auditTitle: 'Canteen Food Safety Process Audit',
    },
    {
        id: 'FND-2026-029',
        auditId: 'AUD-2026-016',
        department: 'Housekeeping',
        title: 'Sanitation supply stock below reorder level',
        severity: 'High',
        responsiblePerson: 'Anitha Nair',
        dueDate: '20-06-2026',
        status: 'Open',
        complianceStatus: 'Pending',
        observation:
            'Industrial disinfectant and floor cleaner stock depleted across zones. Exam-week deep cleaning schedule at risk.',
        correctiveAction:
            'Emergency procurement of sanitation supplies and redistribution to all campus zones before exam week.',
        actionTaken: 'Emergency purchase order raised on 09-06-2026. Partial delivery received for Zone A and B.',
        closureNotes: 'Awaiting full delivery and zone-wise stock confirmation.',
        raisedDate: '09-06-2026',
        auditTitle: 'Staff Attendance & HR Compliance',
    },
    {
        id: 'FND-2026-024',
        auditId: 'AUD-2026-011',
        department: 'Academic',
        title: 'Grade entry discrepancy — Class 10 Maths',
        severity: 'Medium',
        responsiblePerson: 'Academic Coordinator',
        dueDate: '05-06-2026',
        status: 'Closed',
        complianceStatus: 'Complied',
        observation:
            'Moderation records showed 3 grade entry mismatches between teacher mark sheets and ERP grade book for Class 10 Maths.',
        correctiveAction:
            'Reconcile mark sheets with ERP entries and obtain HOD sign-off on corrected grades.',
        actionTaken: 'All 3 discrepancies corrected in ERP on 04-06-2026. HOD verification completed same day.',
        closureNotes: 'Closed on 05-06-2026 with signed moderation reconciliation sheet on file.',
        raisedDate: '03-06-2026',
        auditTitle: 'Academic Assessment Quality Review',
    },
    {
        id: 'FND-2026-021',
        auditId: 'AUD-2026-016',
        department: 'HR',
        title: 'Missing leave policy acknowledgment forms',
        severity: 'Medium',
        responsiblePerson: 'HR Coordinator',
        dueDate: '22-06-2026',
        status: 'In Progress',
        complianceStatus: 'Pending',
        observation:
            '12 non-teaching staff files missing signed leave policy acknowledgment forms as required by HR compliance checklist.',
        correctiveAction:
            'Collect signed acknowledgment forms from all affected staff and update personnel files within audit timeline.',
        actionTaken: 'HR circulated reminder on 19-06-2026. 8 of 12 forms collected and filed.',
        closureNotes: '4 outstanding forms pending collection from contract staff on leave.',
        raisedDate: '18-06-2026',
        auditTitle: 'Staff Attendance & HR Compliance',
    },
    {
        id: 'FND-2026-018',
        auditId: 'AUD-2026-019',
        department: 'Canteen',
        title: 'Incomplete kitchen hygiene checklist',
        severity: 'Low',
        responsiblePerson: 'Kitchen Supervisor',
        dueDate: '17-06-2026',
        status: 'Open',
        complianceStatus: 'Pending',
        observation:
            'Daily kitchen hygiene checklist incomplete for 4 of 7 days in the current audit week.',
        correctiveAction:
            'Reinstate daily checklist completion with supervisor sign-off and weekly audit spot checks.',
        actionTaken: 'Checklist template updated with mandatory end-of-shift sign-off field. Training reminder issued to kitchen staff.',
        closureNotes: 'Monitoring daily completion from 12-06-2026 onward.',
        raisedDate: '12-06-2026',
        auditTitle: 'Canteen Food Safety Process Audit',
    },
]

export const getFindingById = (id) => FINDINGS.find((item) => item.id === id) ?? null

export const severityBadgeColor = {
    Low: 'bg-[#66708533] text-[#667085]',
    Medium: 'bg-[#2196F333] text-[#2196F3]',
    High: 'bg-[#FF980033] text-[#FF9800]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

export const statusBadgeColor = {
    Open: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#515DEF33] text-[#515DEF]',
    Closed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const complianceBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Complied: 'bg-[#4CAF5033] text-[#4CAF50]',
    Overdue: 'bg-[#FF000033] text-[#FF0000]',
}
