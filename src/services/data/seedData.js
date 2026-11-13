/**
 * Realistic Mock Seed Data for All ERP Modules
 * Cross-referenced across Academic, Administrative, and Institutional roles.
 */

export const INITIAL_PRO_DATA = {
  correspondence: [
    {
      id: 'GOV-CORR-2026-001',
      direction: 'Inward',
      referenceNumber: 'DSE/CBSE-AFF/2026/8941',
      subject: 'Annual CBSE Secondary Section Affiliation Extension Order',
      governmentDepartment: 'Directorate of School Education',
      authorityOfficer: 'Dr. R. Shanmugam (Chief Educational Officer)',
      receivedOrDispatchedDate: '2026-02-10',
      statutoryDeadline: '2026-06-30',
      complianceStatus: 'Complied & Closed',
      fileRoomRefId: 'FILE-2026-003',
      financeChallanRef: 'CHLN-TREASURY-2026-8812',
      escalationLevel: 'Normal',
      nextActionNotes: 'Order received and filed in executive safe archive.',
      documentAttachments: [
        { id: 'DOC-01', name: 'CBSE_Extension_Order_2026.pdf', fileUrl: '/docs/cbse_ext_2026.pdf', uploadDate: '2026-02-11', size: '2.4 MB' }
      ]
    },
    {
      id: 'GOV-CORR-2026-002',
      direction: 'Outward',
      referenceNumber: 'QMIS/FIRE-NOC/RENEW/2026-14',
      subject: 'Application for Triennial Fire Safety NOC Renewal & Hydrant Audit',
      governmentDepartment: 'Tamil Nadu Fire & Rescue Services',
      authorityOfficer: 'Station Fire Officer, Division South',
      receivedOrDispatchedDate: '2026-03-01',
      statutoryDeadline: '2026-04-15',
      complianceStatus: 'Under Department Review',
      fileRoomRefId: 'FILE-2026-004',
      financeChallanRef: 'CHLN-FIRE-99014',
      escalationLevel: 'Urgent',
      nextActionNotes: 'Site inspection scheduled for coming Tuesday 10:00 AM.',
      documentAttachments: [
        { id: 'DOC-02', name: 'Fire_NOC_Application_Signed.pdf', fileUrl: '/docs/fire_noc_app.pdf', uploadDate: '2026-03-01', size: '1.8 MB' }
      ]
    },
    {
      id: 'GOV-CORR-2026-003',
      direction: 'Inward',
      referenceNumber: 'CORP/HLTH/IS10500/2026-77',
      subject: 'Annual Potable Water & Campus Sanitary Compliance Inspection Notice',
      governmentDepartment: 'Municipal Corporation Health Department',
      authorityOfficer: 'City Health Officer',
      receivedOrDispatchedDate: '2026-03-05',
      statutoryDeadline: '2026-03-25',
      complianceStatus: 'Pending Compliance',
      fileRoomRefId: 'FILE-2026-005',
      financeChallanRef: null,
      escalationLevel: 'Critical Escalated to JD/MD',
      nextActionNotes: 'Requires lab test report of RO plant output and kitchen swab tests.',
      documentAttachments: [
        { id: 'DOC-03', name: 'Health_Dept_Notice_Notice.pdf', fileUrl: '/docs/health_notice.pdf', uploadDate: '2026-03-05', size: '1.1 MB' }
      ]
    }
  ],
  affiliations: [
    {
      id: 'AFF-2026-001',
      boardAuthority: 'CBSE',
      affiliationCode: 'CBSE/AFF/1930882',
      sanctionedGrades: 'Pre-KG to Grade 12',
      validityStartDate: '2023-04-01',
      validityEndDate: '2028-03-31',
      renewalDueDate: '2027-09-30',
      status: 'Active / In-Force',
      fileRoomLocation: 'Admin Block, Room 101, Fireproof Locker 01',
      conditionsCompliance: [
        { id: 'CC-01', conditionText: 'Maintain 1:1.5 teacher-student ratio in Senior Secondary', deadline: '2026-06-30', status: 'Complied' },
        { id: 'CC-02', conditionText: 'Upgraded Composite Science Lab calibration audit', deadline: '2026-08-15', status: 'Complied' }
      ]
    },
    {
      id: 'AFF-2026-002',
      boardAuthority: 'Cambridge International CAIE',
      affiliationCode: 'CAIE-IN-882',
      sanctionedGrades: 'IGCSE Grade 9-10 & A-Levels Grade 11-12',
      validityStartDate: '2024-06-01',
      validityEndDate: '2029-05-31',
      renewalDueDate: '2028-11-30',
      status: 'Active / In-Force',
      fileRoomLocation: 'Admin Block, Room 101, Fireproof Locker 02',
      conditionsCompliance: []
    }
  ],
  permits: [
    {
      id: 'PERMIT-2026-001',
      permitType: 'Fire Safety Certificate & NOC',
      permitNumber: 'TNFRS/MD-DIV/NOC/2023-412',
      issuingAuthority: 'State Fire and Rescue Services Department',
      issueDate: '2023-04-10',
      expiryDate: '2026-04-09',
      renewalNoticeDays: 60,
      status: 'Renewal In-Progress',
      feePaymentReceipt: 'FIN-VOUCH-2026-1102',
      physicalFileRef: 'FILE-2026-004'
    },
    {
      id: 'PERMIT-2026-002',
      permitType: 'Building Structural Stability Certificate (Form A, B, C)',
      permitNumber: 'PWD/STRUC/CERT/2024-88',
      issuingAuthority: 'Executive Engineer, PWD Buildings Division',
      issueDate: '2024-06-15',
      expiryDate: '2027-06-14',
      renewalNoticeDays: 90,
      status: 'Valid',
      feePaymentReceipt: 'FIN-VOUCH-2024-4401',
      physicalFileRef: 'FILE-2026-006'
    },
    {
      id: 'PERMIT-2026-003',
      permitType: 'Public Health & Sanitary Certificate (IS 10500)',
      permitNumber: 'CORP/SANITARY/2025/109',
      issuingAuthority: 'City Health Officer, Corporation Public Health Wing',
      issueDate: '2025-03-20',
      expiryDate: '2026-03-19',
      renewalNoticeDays: 30,
      status: 'Renewal Due',
      feePaymentReceipt: 'FIN-VOUCH-2025-2311',
      physicalFileRef: 'FILE-2026-005'
    }
  ],
  inspections: [
    {
      id: 'INSP-2026-001',
      inspectionDate: '2026-01-20',
      inspectingBody: 'District Educational Office (DEO) Inspection Panel',
      inspectingOfficials: 'Mr. P. Sundaram (DEO) & 2 Assistant Education Officers',
      purpose: 'Routine Annual Inspection',
      observations: 'Attendance registers, teacher service records, and lab safety measures verified in order. Advised digital logging of library circulation.',
      deficienciesNoted: null,
      complianceSubmissionDeadline: null,
      status: 'Formally Cleared',
      reportAttachmentUrl: '/reports/deo_insp_2026.pdf'
    },
    {
      id: 'INSP-2026-002',
      inspectionDate: '2026-03-18',
      inspectingBody: 'Corporation Sanitary Inspectorate',
      inspectingOfficials: 'Dr. V. Malathi (Chief Sanitary Inspector)',
      purpose: 'Safety Compliance',
      observations: 'Dining hall food preparation standards satisfactory. Water test report submission required before certificate sign-off.',
      deficienciesNoted: 'Submit updated bacteriological water test certificate within 10 days.',
      complianceSubmissionDeadline: '2026-03-28',
      status: 'Action Required',
      reportAttachmentUrl: '/reports/sanitary_insp_2026.pdf'
    }
  ]
};

export const INITIAL_FILE_ROOM_DATA = {
  files: [
    {
      id: 'FILE-2026-001',
      fileRefNo: 'EXAM/CBSE/X/2025-26/TAB-01',
      fileName: 'Grade 10 CBSE Board Tabulation Register & Mark Rosters 2025-26',
      category: 'Examination Tabulation & Result Sheets',
      ownerDepartment: 'Academics',
      academicYear: '2025-2026',
      storageLocation: {
        building: 'Administrative Block',
        room: 'Archive Room 102',
        rackNo: 'Rack A',
        shelfNo: 'Shelf 01',
        boxNo: 'Box 02'
      },
      confidentiality: 'Executive Confidential',
      designatedApproverRole: 'principal',
      retentionRule: 'Permanent Archival',
      currentLocationStatus: 'In File Room',
      heldByUserId: null,
      heldByUserName: null,
      heldByUserDept: null,
      digitalCopyUrl: '/docs/exam_tab_grade10.pdf',
      lastMovementDate: '2026-01-10'
    },
    {
      id: 'FILE-2026-002',
      fileRefNo: 'HR/STAFF/DOSSIER/SR-LEAD-001',
      fileName: 'Senior Leadership Dossiers & Police Verification Records',
      category: 'Staff Dossiers, Service Books & Police Verifications',
      ownerDepartment: 'HR',
      academicYear: 'Permanent',
      storageLocation: {
        building: 'Administrative Block',
        room: 'Executive Fireproof Vault 101',
        rackNo: 'Cupboard 04',
        shelfNo: 'Shelf S-1',
        boxNo: 'Locker 02'
      },
      confidentiality: 'Strictly Confidential',
      designatedApproverRole: 'director',
      retentionRule: 'Retirement + 10 Years',
      currentLocationStatus: 'In File Room',
      heldByUserId: null,
      heldByUserName: null,
      heldByUserDept: null,
      digitalCopyUrl: null,
      lastMovementDate: '2025-11-20'
    },
    {
      id: 'FILE-2026-003',
      fileRefNo: 'GOV/AFFIL/CBSE/EXT-2028',
      fileName: 'CBSE Affiliation Extension Sanction Deeds & Inspections',
      category: 'Government Affiliation & Statutory Permitting Files',
      ownerDepartment: 'PRO',
      academicYear: '2023-2028',
      storageLocation: {
        building: 'Administrative Block',
        room: 'Archive Room 102',
        rackNo: 'Rack B',
        shelfNo: 'Shelf 03',
        boxNo: 'Box 08'
      },
      confidentiality: 'General',
      designatedApproverRole: 'jointdirector',
      retentionRule: 'Permanent Archival',
      currentLocationStatus: 'In File Room',
      heldByUserId: null,
      heldByUserName: null,
      heldByUserDept: null,
      digitalCopyUrl: '/docs/cbse_ext_2026.pdf',
      lastMovementDate: '2026-02-11'
    },
    {
      id: 'FILE-2026-004',
      fileRefNo: 'LEGAL/FIRE-SAFETY/NOC-2026',
      fileName: 'Fire Safety Hydrant Clearances, Building Stability & NOC Master',
      category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
      ownerDepartment: 'Operations / Facilities',
      academicYear: '2026-2027',
      storageLocation: {
        building: 'Administrative Block',
        room: 'Archive Room 102',
        rackNo: 'Rack B',
        shelfNo: 'Shelf 02',
        boxNo: 'Box 05'
      },
      confidentiality: 'Restricted',
      designatedApproverRole: 'jointdirector',
      retentionRule: '10 Years',
      currentLocationStatus: 'Checked Out / Issued',
      heldByUserId: 'EMP-PRO-001',
      heldByUserName: 'R. K. Ramanathan (PRO)',
      heldByUserDept: 'PRO',
      digitalCopyUrl: '/docs/fire_noc_app.pdf',
      lastMovementDate: '2026-03-01'
    }
  ],
  inwardRegister: [
    {
      id: 'INW-2026-001',
      inwardDate: '2026-02-11T10:30:00Z',
      fileId: 'FILE-2026-003',
      fileName: 'CBSE Affiliation Extension Sanction Deeds & Inspections',
      receivedFrom: 'Directorate of School Education (Courier Regd Post)',
      department: 'PRO',
      receivedByCustodian: 'M. Gnanam (File Room In-charge)',
      documentCount: 28,
      physicalCondition: 'Mint',
      storageRackAssigned: 'Rack B / Shelf 03 / Box 08',
      remarks: 'Original sanction order signed by Secretary CBSE.'
    }
  ],
  outwardRegister: [
    {
      id: 'ISS-FILE-2026-001',
      fileId: 'FILE-2026-004',
      fileName: 'Fire Safety Hydrant Clearances, Building Stability & NOC Master',
      requestedById: 'EMP-PRO-001',
      requestedByName: 'R. K. Ramanathan',
      department: 'PRO',
      purpose: 'Required for on-site inspection by Divisional Fire Officer.',
      approvalRequired: 'Joint Director',
      approvalStatus: 'Approved',
      approvedBy: 'Dr. K. S. Sundaram (Joint Director)',
      approvalTimestamp: '2026-03-01T09:15:00Z',
      issuedByCustodian: 'M. Gnanam',
      issueDateTime: '2026-03-01T11:00:00Z',
      expectedReturnDate: '2026-03-10',
      actualReturnDate: null,
      receivingAcknowledgmentSigned: true,
      status: 'Overdue',
      returnCondition: null,
      custodianInspectionNotes: null
    }
  ]
};

export const INITIAL_CCTV_DATA = {
  cameras: [
    {
      id: 'CAM-01',
      name: 'Main Gate 1 & Perimeter Security Cabin',
      zone: 'Campus Perimeter & Gates',
      cameraType: 'Outdoor Bullet',
      ipAddress: '192.168.10.101',
      nvrChannel: 'NVR-1 / CH-01',
      resolutionSpecs: '4K Ultra HD (30 FPS)',
      storageRetentionDays: 45,
      currentStatus: 'Online / Active',
      lastDailyCheck: '2026-03-10T06:30:00Z',
      linkedTicketId: null
    },
    {
      id: 'CAM-02',
      name: 'Senior Academic Wing Foyer & Reception',
      zone: 'Academic Blocks & Corridors',
      cameraType: 'Fixed Dome',
      ipAddress: '192.168.10.102',
      nvrChannel: 'NVR-1 / CH-02',
      resolutionSpecs: '1080p Full HD (25 FPS)',
      storageRetentionDays: 45,
      currentStatus: 'Online / Active',
      lastDailyCheck: '2026-03-10T06:30:00Z',
      linkedTicketId: null
    },
    {
      id: 'CAM-03',
      name: 'Composite Science Laboratories Hallway',
      zone: 'Science Laboratories Wing',
      cameraType: 'Fixed Dome',
      ipAddress: '192.168.10.103',
      nvrChannel: 'NVR-1 / CH-03',
      resolutionSpecs: '1080p Full HD (25 FPS)',
      storageRetentionDays: 45,
      currentStatus: 'Online / Active',
      lastDailyCheck: '2026-03-10T06:30:00Z',
      linkedTicketId: null
    },
    {
      id: 'CAM-04',
      name: 'Central Dining Hall & Kitchen Loading Bay',
      zone: 'Dining Hall & Cafeteria',
      cameraType: 'Panoramic Fisheye',
      ipAddress: '192.168.10.104',
      nvrChannel: 'NVR-1 / CH-04',
      resolutionSpecs: '4K 360-degree',
      storageRetentionDays: 45,
      currentStatus: 'Offline',
      lastDailyCheck: '2026-03-10T06:30:00Z',
      linkedTicketId: 'TKT-IT-2026-441'
    },
    {
      id: 'CAM-05',
      name: 'Hostel Block A Boys Quadrangle',
      zone: 'Hostel Blocks & Common Areas',
      cameraType: 'PTZ 360 Optical Zoom',
      ipAddress: '192.168.10.105',
      nvrChannel: 'NVR-2 / CH-01',
      resolutionSpecs: '1080p 20x Zoom',
      storageRetentionDays: 60,
      currentStatus: 'Online / Active',
      lastDailyCheck: '2026-03-10T06:30:00Z',
      linkedTicketId: null
    },
    {
      id: 'CAM-06',
      name: 'Bus Yard & Transport Maintenance Bay',
      zone: 'Transport Yard & Bus Bays',
      cameraType: 'Outdoor Bullet',
      ipAddress: '192.168.10.106',
      nvrChannel: 'NVR-2 / CH-02',
      resolutionSpecs: '4K Night Vision IR',
      storageRetentionDays: 45,
      currentStatus: 'Online / Active',
      lastDailyCheck: '2026-03-10T06:30:00Z',
      linkedTicketId: null
    }
  ],
  dailyChecks: [
    {
      id: 'CHK-CCTV-2026-001',
      checkDate: '2026-03-10',
      shift: 'Morning Shift (06:00 - 14:00)',
      inspectorId: 'EMP-CCTV-001',
      inspectorName: 'S. Selvakumar (Camera Room In-charge)',
      totalCamerasMonitored: 6,
      onlineCount: 5,
      offlineCount: 1,
      underMaintenanceCount: 0,
      nvrStorageBufferHealth: '100% OK',
      findingsAndAnomalies: [
        {
          cameraId: 'CAM-04',
          anomalyDescription: 'POE switch port 4 link dropped on Kitchen bay line.',
          actionTaken: 'High priority ticket TKT-IT-2026-441 dispatched to IT Network Team.',
          ticketRaised: true,
          rectifiedDate: null,
          rectifiedTime: null,
          rectifiedBy: null,
          resolutionNotes: null,
          isRectified: false
        }
      ],
      status: 'Requires Immediate Attention'
    },
    {
      id: 'CHK-CCTV-2026-002',
      checkDate: '2026-03-09',
      shift: 'Night Shift (22:00 - 06:00)',
      inspectorId: 'EMP-CCTV-002',
      inspectorName: 'M. Gnanam (Night Operator)',
      totalCamerasMonitored: 6,
      onlineCount: 6,
      offlineCount: 0,
      underMaintenanceCount: 0,
      nvrStorageBufferHealth: '100% OK',
      findingsAndAnomalies: [
        {
          cameraId: 'CAM-01',
          anomalyDescription: 'Main Gate IR night vision illuminator blinking.',
          actionTaken: 'Replaced 12V 2A DC power supply adaptor.',
          ticketRaised: true,
          rectifiedDate: '2026-03-10',
          rectifiedTime: '08:30 AM',
          rectifiedBy: 'S. Selvakumar',
          resolutionNotes: 'Power adaptor replaced, IR feed verified crisp in darkness.',
          isRectified: true
        }
      ],
      status: 'Completed'
    }
  ],
  footageRequests: [
    {
      id: 'REQ-CCTV-2026-001',
      incidentDate: '2026-03-08',
      timeWindowStart: '13:15',
      timeWindowEnd: '13:45',
      cameraIds: ['CAM-04'],
      requesterId: 'EMP-ADM-004',
      requesterName: 'P. Arumugam (Dining Supervisor)',
      requesterRole: 'canteenmanager',
      department: 'Canteen & Dining',
      reasonCategory: 'Staff Concern / Infrastructure Damage',
      justificationText: 'Vendor supplier vehicle damaged kitchen roll-up gate during midday grocery delivery.',
      attachmentFileName: 'Kitchen_Rollup_Damage_FIR_Stub.pdf',
      attachmentData: 'data:application/pdf;base64,JVBERi0xLjQK...',
      isSensitive: false,
      approvalChain: {
        deptHead: { approvedBy: 'P. Arumugam (Self/HOD)', status: 'Approved', timestamp: '2026-03-08T14:00:00Z', remarks: 'Recommended for vendor claim' },
        jointDirector: { approvedBy: 'Dr. K. S. Sundaram', status: 'Approved', timestamp: '2026-03-08T15:30:00Z', remarks: 'Sanctioned for insurance recovery' },
        managingDirector: { approvedBy: null, status: 'Not Required', timestamp: null, remarks: '' }
      },
      currentApprovalTier: 'Approved',
      clipDelivery: {
        clipPreparedBy: 'S. Selvakumar',
        clipPreparedTimestamp: '2026-03-08T16:15:00Z',
        clipDurationSeconds: 1800,
        fileSizeBytes: 420000000,
        watermarkText: 'EMP-ADM-004 / REQ-CCTV-2026-001 / CONFIDENTIAL',
        streamingUrl: 'https://cctv.school.internal/stream/clip-2026-001.mp4',
        downloadExpiryDate: '2026-03-12T16:15:00Z',
        retentionLockUntil: '2026-05-31'
      },
      auditLog: [
        { timestamp: '2026-03-08T13:55:00Z', action: 'REQUEST_SUBMITTED', actorId: 'EMP-ADM-004', actorName: 'P. Arumugam', ipAddress: '192.168.20.14' },
        { timestamp: '2026-03-08T15:30:00Z', action: 'JD_APPROVED', actorId: 'EMP-JD-001', actorName: 'Dr. K. S. Sundaram', ipAddress: '192.168.1.10' },
        { timestamp: '2026-03-08T16:15:00Z', action: 'CLIP_DELIVERED', actorId: 'EMP-CCTV-001', actorName: 'S. Selvakumar', ipAddress: '192.168.10.2' }
      ]
    }
  ],
  teachersLateReports: [
    {
      id: 'TL-2026-001',
      date: '2026-03-10',
      teacherId: 'EMP-TCH-004',
      teacherName: 'R. Sundaresan',
      department: 'Mathematics',
      shiftInTime: '08:00 AM',
      actualArrivalTime: '08:28 AM',
      lateMinutes: 28,
      gateNo: 'Gate 1 (Main Entrance)',
      cameraId: 'CAM-01',
      reason: 'Traffic congestion near railway overbridge bypass.',
      actionTaken: 'First late arrival of the month; verbal caution recorded.',
      status: 'Acknowledged'
    },
    {
      id: 'TL-2026-002',
      date: '2026-03-10',
      teacherId: 'EMP-TCH-012',
      teacherName: 'S. Ananya',
      department: 'Science & Biology',
      shiftInTime: '08:00 AM',
      actualArrivalTime: '08:18 AM',
      lateMinutes: 18,
      gateNo: 'Gate 1 (Main Entrance)',
      cameraId: 'CAM-01',
      reason: 'Vehicle flat tyre along Madurai Ring Road.',
      actionTaken: 'Gate entry slip issued; HOD informed.',
      status: 'Logged'
    },
    {
      id: 'TL-2026-003',
      date: '2026-03-09',
      teacherId: 'EMP-TCH-007',
      teacherName: 'M. Karthikeyan',
      department: 'Social Science',
      shiftInTime: '08:00 AM',
      actualArrivalTime: '08:35 AM',
      lateMinutes: 35,
      gateNo: 'Gate 2 (Faculty Gate)',
      cameraId: 'CAM-06',
      reason: 'Public transport bus delay.',
      actionTaken: 'Permission granted by Academic Coordinator.',
      status: 'Approved'
    }
  ],
  issues: [
    {
      id: 'ISSUE-CCTV-001',
      date: '2026-03-09',
      zone: 'Dining Hall & Cafeteria',
      assetId: 'CAM-04',
      assetName: 'Central Dining Hall & Kitchen Loading Bay',
      defectCategory: 'Network Signal Drop / POE Failure',
      severity: 'High',
      reportedBy: 'S. Selvakumar (Camera Room)',
      assignedTechnician: 'K. Ramesh (IT Network Team)',
      status: 'In Progress',
      rectifiedDate: null,
      rectifiedTime: null,
      notes: 'POE switch port 4 link dropped; cable testing and RJ45 recrimping in progress.'
    },
    {
      id: 'ISSUE-CCTV-002',
      date: '2026-03-08',
      zone: 'Campus Perimeter & Gates',
      assetId: 'CAM-01',
      assetName: 'Main Gate 1 & Perimeter Security Cabin',
      defectCategory: 'Power Surge / Adapter Fault',
      severity: 'Medium',
      reportedBy: 'M. Gnanam',
      assignedTechnician: 'P. Velu (Electrician)',
      status: 'Rectified',
      rectifiedDate: '2026-03-08',
      rectifiedTime: '16:00',
      notes: 'Replaced 12V 2A DC SMPS adapter and verified IR illumination.'
    },
    {
      id: 'ISSUE-CCTV-003',
      date: '2026-03-10',
      zone: 'Transport Yard & Bus Bays',
      assetId: 'NVR-2',
      assetName: 'NVR 2 (32-Channel Storage Server)',
      defectCategory: 'Hard Disk S.M.A.R.T Warning',
      severity: 'Critical',
      reportedBy: 'S. Selvakumar',
      assignedTechnician: 'K. Ramesh (IT Network Team)',
      status: 'Open',
      rectifiedDate: null,
      rectifiedTime: null,
      notes: 'Drive 3 in Bay 2 showing reallocated sector count > 50. Replacement 8TB surveillance drive requisitioned.'
    }
  ],
  paAnnouncements: [
    {
      id: 'PA-2026-001',
      date: '2026-03-10',
      time: '08:45 AM',
      category: 'Bell & Assembly',
      targetZones: ['Senior Academic Wing', 'Junior Wing', 'Quadrangle'],
      message: 'All students of Grades 9 to 12 are requested to assemble in the Main Auditorium for the Science Olympiad briefing.',
      announcedBy: 'S. Selvakumar (Control Room)',
      authorizedBy: 'Dr. K. S. Sundaram (Joint Director)',
      isEmergency: false
    },
    {
      id: 'PA-2026-002',
      date: '2026-03-10',
      time: '12:30 PM',
      category: 'General',
      targetZones: ['Dining Hall & Cafeteria', 'Playgrounds'],
      message: 'Lunch break has commenced. Teachers on canteen duty are requested to report to the Central Dining Hall.',
      announcedBy: 'Control Room Operator',
      authorizedBy: 'P. Arumugam (Dining Supervisor)',
      isEmergency: false
    },
    {
      id: 'PA-2026-003',
      date: '2026-03-09',
      time: '03:15 PM',
      category: 'Transport',
      targetZones: ['Transport Bay', 'All Classrooms', 'Corridors'],
      message: 'Buses 01 to 08 have lined up at the North Gate. Route 4 and Route 7 students may proceed for boarding.',
      announcedBy: 'S. Selvakumar (Control Room)',
      authorizedBy: 'A. David Raj (Transport Manager)',
      isEmergency: false
    },
    {
      id: 'PA-2026-004',
      date: '2026-03-05',
      time: '11:15 AM',
      category: 'Emergency',
      targetZones: ['All Zones (Campus-wide)'],
      message: 'Fire evacuation drill: All staff and students must exit via secondary fire stairwells to the assembly grounds.',
      announcedBy: 'S. Selvakumar (Control Room)',
      authorizedBy: 'Principal / Safety Committee',
      isEmergency: true
    }
  ],
  gpsHalts: [
    {
      id: 'HALT-2026-001',
      date: '2026-03-10',
      busNo: 'BUS-04',
      routeCode: 'ROUTE-04',
      driverName: 'K. Murugan',
      haltLocation: 'Near District Collectorate Junction (Old Bypass)',
      scheduledTime: '07:50 AM',
      arrivalTime: '08:12 AM',
      haltDurationMinutes: 22,
      delayReason: 'Unscheduled tyre pressure check & bypass traffic diversion.',
      speedAlert: false
    },
    {
      id: 'HALT-2026-002',
      date: '2026-03-10',
      busNo: 'BUS-02',
      routeCode: 'ROUTE-02',
      driverName: 'M. Velraj',
      haltLocation: 'Mattuthavani Integrated Bus Terminal Road',
      scheduledTime: '07:30 AM',
      arrivalTime: '07:46 AM',
      haltDurationMinutes: 16,
      delayReason: 'State transport breakdown blocking arterial 2-lane road.',
      speedAlert: false
    },
    {
      id: 'HALT-2026-003',
      date: '2026-03-09',
      busNo: 'BUS-07',
      routeCode: 'ROUTE-07',
      driverName: 'R. Periasamy',
      haltLocation: 'Vilangudi Bye-pass Bridge',
      scheduledTime: '08:05 AM',
      arrivalTime: '08:15 AM',
      haltDurationMinutes: 10,
      delayReason: 'Water logging near underpass.',
      speedAlert: true
    }
  ],
  busLastDrops: [
    {
      id: 'BLD-2026-001',
      date: '2026-03-09',
      busNo: 'BUS-04',
      routeNo: 'ROUTE-04',
      driverName: 'K. Murugan',
      conductorName: 'M. Selvam',
      totalStudentsDropped: 30,
      lastStopName: 'School Campus Main Gate',
      scheduledTime: '04:30 PM',
      actualDropTime: '04:38 PM',
      emptyBusVerified: true,
      remarks: 'All students safely handed over at designated drop points; bus cabin inspected and locked.'
    },
    {
      id: 'BLD-2026-002',
      date: '2026-03-09',
      busNo: 'BUS-02',
      routeNo: 'ROUTE-02',
      driverName: 'M. Velraj',
      conductorName: 'S. Alagarsamy',
      totalStudentsDropped: 34,
      lastStopName: 'Teppakulam West Bank',
      scheduledTime: '04:45 PM',
      actualDropTime: '04:52 PM',
      emptyBusVerified: true,
      remarks: 'Full dispersal confirmed with parent acknowledgement stubs.'
    },
    {
      id: 'BLD-2026-003',
      date: '2026-03-10',
      busNo: 'BUS-07',
      routeNo: 'ROUTE-07',
      driverName: 'R. Periasamy',
      conductorName: 'C. Muniyandi',
      totalStudentsDropped: 28,
      lastStopName: 'Koodal Nagar Railway Colony',
      scheduledTime: '04:40 PM',
      actualDropTime: '04:45 PM',
      emptyBusVerified: true,
      remarks: 'Conductor physically checked all rows; no backpacks or belongings left.'
    }
  ],
  busCameraAudits: [
    {
      id: 'BCAM-2026-001',
      date: '2026-03-10',
      busNo: 'BUS-04',
      frontCameraStatus: 'Online / Working',
      cabinCameraStatus: 'Online / Working',
      rearCameraStatus: 'Online / Working',
      recordingHealth: 'Normal',
      footageQuality: '1080p Clear',
      safetyObservation: 'Driver wore seatbelt, speed maintained within 40 km/h limit, conductor seated near rear door.',
      incidentReported: false,
      inspectorName: 'S. Selvakumar'
    },
    {
      id: 'BCAM-2026-002',
      date: '2026-03-10',
      busNo: 'BUS-07',
      frontCameraStatus: 'Online / Working',
      cabinCameraStatus: 'Offline / Degraded',
      rearCameraStatus: 'Online / Working',
      recordingHealth: 'Degraded',
      footageQuality: 'Blurred Feed on Cabin Channel',
      safetyObservation: 'Cabin camera dome cover scratched. Lens adjustment required.',
      incidentReported: true,
      inspectorName: 'S. Selvakumar'
    },
    {
      id: 'BCAM-2026-003',
      date: '2026-03-09',
      busNo: 'BUS-02',
      frontCameraStatus: 'Online / Working',
      cabinCameraStatus: 'Online / Working',
      rearCameraStatus: 'Online / Working',
      recordingHealth: 'Normal',
      footageQuality: '1080p Clear',
      safetyObservation: 'Cabin discipline maintained, emergency door clear of luggage.',
      incidentReported: false,
      inspectorName: 'M. Gnanam'
    }
  ]
};

export const INITIAL_HOSTEL_DATA = {
  blocks: [
    {
      id: 'HOSTEL-BLK-A',
      name: 'Block A - Boys Senior Wing',
      gender: 'Boys',
      wardenName: 'Mr. M. Kumar',
      wardenContact: '+91 98401 23456',
      totalRooms: 20,
      totalBeds: 60,
      occupiedBeds: 45
    },
    {
      id: 'HOSTEL-BLK-B',
      name: 'Block B - Girls Junior & Senior Wing',
      gender: 'Girls',
      wardenName: 'Mrs. L. Vasantha',
      wardenContact: '+91 98401 65432',
      totalRooms: 20,
      totalBeds: 60,
      occupiedBeds: 40
    }
  ],
  rooms: [
    {
      id: 'ROOM-A-201',
      blockId: 'HOSTEL-BLK-A',
      roomNumber: 'A-201',
      floor: 'Floor 2',
      capacity: 3,
      beds: [
        { bedNumber: 'B1', occupied: true, studentId: 'STU-001', studentName: 'Aarav Sharma' },
        { bedNumber: 'B2', occupied: true, studentId: 'STU-002', studentName: 'Kavya Patel' },
        { bedNumber: 'B3', occupied: false, studentId: null, studentName: null }
      ]
    },
    {
      id: 'ROOM-A-202',
      blockId: 'HOSTEL-BLK-A',
      roomNumber: 'A-202',
      floor: 'Floor 2',
      capacity: 3,
      beds: [
        { bedNumber: 'B1', occupied: true, studentId: 'STU-003', studentName: 'Rohan Verma' },
        { bedNumber: 'B2', occupied: false, studentId: null, studentName: null },
        { bedNumber: 'B3', occupied: false, studentId: null, studentName: null }
      ]
    }
  ],
  enrolments: [
    {
      id: 'HSTL-ENR-2026-001',
      studentId: 'STU-001',
      studentName: 'Aarav Sharma',
      gender: 'Male',
      grade: 'Grade 10',
      section: 'A',
      hostelBlockId: 'HOSTEL-BLK-A',
      hostelBlockName: 'Block A - Boys Senior Wing',
      roomNumber: 'A-201',
      bedNumber: 'B1',
      checkInDate: '2025-06-05',
      academicYear: '2025-2026',
      term: 'Annual',
      wardenName: 'Mr. M. Kumar',
      status: 'Active',
      linkedFeeInvoiceId: 'INV-2026-HSTL-001',
      annualHostelFee: 75000,
      feePaymentStatus: 'Paid'
    }
  ]
};

export const INITIAL_FEE_DATA = {
  feeHeads: [
    { id: 'FH-TUIT', code: 'TUIT', name: 'Tuition Fee', defaultAmount: 65000, category: 'Academic' },
    { id: 'FH-LAB', code: 'LAB', name: 'Science & Computer Lab Fee', defaultAmount: 15000, category: 'Academic' },
    { id: 'FH-TRN', code: 'TRN', name: 'Transport Route Fee', defaultAmount: 24000, category: 'Facilities' },
    { id: 'FH-HSTL', code: 'HSTL', name: 'Hostel & Boarding Fee', defaultAmount: 75000, category: 'Facilities' },
    { id: 'FH-CAUT', code: 'CAUT', name: 'Refundable Caution Deposit', defaultAmount: 10000, category: 'Deposit' }
  ],
  invoices: [
    {
      id: 'INV-2026-001',
      invoiceNumber: 'INV/2025-26/1001',
      studentId: 'STU-001',
      studentName: 'Aarav Sharma',
      grade: 'Grade 10',
      section: 'A',
      academicYear: '2025-2026',
      issueDate: '2025-06-01',
      dueDate: '2025-06-30',
      items: [
        { feeHeadId: 'FH-TUIT', name: 'Tuition Fee Term 1', amount: 32500 },
        { feeHeadId: 'FH-LAB', name: 'Science Lab Fee Term 1', amount: 7500 },
        { feeHeadId: 'FH-HSTL', name: 'Hostel Fee Term 1', amount: 37500 }
      ],
      totalAmount: 77500,
      concessionAmount: 0,
      paidAmount: 77500,
      balanceAmount: 0,
      status: 'Paid',
      receipts: ['REC-2026-001']
    },
    {
      id: 'INV-2026-002',
      invoiceNumber: 'INV/2025-26/1002',
      studentId: 'STU-002',
      studentName: 'Kavya Patel',
      grade: 'Grade 10',
      section: 'A',
      academicYear: '2025-2026',
      issueDate: '2025-06-01',
      dueDate: '2025-06-30',
      items: [
        { feeHeadId: 'FH-TUIT', name: 'Tuition Fee Term 1', amount: 32500 },
        { feeHeadId: 'FH-LAB', name: 'Science Lab Fee Term 1', amount: 7500 }
      ],
      totalAmount: 40000,
      concessionAmount: 5000,
      paidAmount: 20000,
      balanceAmount: 15000,
      status: 'Partially Paid',
      receipts: ['REC-2026-002']
    }
  ],
  payments: [
    {
      id: 'REC-2026-001',
      receiptNumber: 'REC/2025-26/5001',
      invoiceId: 'INV-2026-001',
      studentId: 'STU-001',
      paymentDate: '2025-06-15',
      amount: 77500,
      paymentMethod: 'Bank Transfer / NEFT',
      transactionRef: 'NEFT-HDFC-991208',
      collectedBy: 'EMP-ACC-001 (Account Head)',
      status: 'Cleared'
    },
    {
      id: 'REC-2026-002',
      receiptNumber: 'REC/2025-26/5002',
      invoiceId: 'INV-2026-002',
      studentId: 'STU-002',
      paymentDate: '2025-06-20',
      amount: 20000,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-ICICI-441092',
      collectedBy: 'EMP-ACC-001',
      status: 'Cleared'
    }
  ],
  refundRequests: [
    {
      id: 'REFUND-REQ-2026-001',
      refundVoucherNumber: 'REF-VOUCH-2026-01',
      studentId: 'STU-003',
      studentName: 'Rohan Verma',
      invoiceId: 'INV-2026-001',
      paymentReceiptId: 'REC-2026-001',
      refundCategory: 'Caution Deposit Refund',
      refundAmount: 10000,
      reason: 'Student transfer to international school; clearance obtained from Library, Lab, and Hostel.',
      beneficiaryBankDetails: {
        accountHolder: 'Mr. Sunil Verma (Father)',
        accountNumber: '5010023419028',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234'
      },
      status: 'Pending JD Approval',
      auditHistory: [
        { stage: 'Requested', role: 'parent', user: 'Sunil Verma', timestamp: '2026-03-01T10:00:00Z', notes: 'TC application submitted' },
        { stage: 'Accounts Verification', role: 'accounthead', user: 'Finance Officer', timestamp: '2026-03-03T11:30:00Z', notes: 'No outstanding dues verified' }
      ]
    }
  ]
};

export const INITIAL_ACADEMIC_DATA = {
  examSessions: [
    { id: 'EXAM-2025-T1', name: 'Term 1 Mid-Term Assessments', academicYear: '2025-2026', term: 'Term 1', startDate: '2025-09-15', endDate: '2025-09-26' },
    { id: 'EXAM-2025-T2', name: 'Term 2 Final Comprehensive Examination', academicYear: '2025-2026', term: 'Term 2', startDate: '2026-02-20', endDate: '2026-03-05' }
  ],
  marks: [
    {
      id: 'MRK-STU-001-ENG',
      examId: 'EXAM-2025-T2',
      studentId: 'STU-001',
      grade: 'Grade 10',
      section: 'A',
      subjectId: 'SUB-ENG',
      subjectName: 'English Communicative',
      maxMarks: 100,
      theoryMarks: 68,
      practicalMarks: 24,
      totalMarks: 92,
      percentage: 92.0,
      gradeAwarded: 'A1',
      gradePoint: 10.0
    },
    {
      id: 'MRK-STU-001-MAT',
      examId: 'EXAM-2025-T2',
      studentId: 'STU-001',
      grade: 'Grade 10',
      section: 'A',
      subjectId: 'SUB-MAT',
      subjectName: 'Mathematics Standard',
      maxMarks: 100,
      theoryMarks: 72,
      practicalMarks: 19,
      totalMarks: 91,
      percentage: 91.0,
      gradeAwarded: 'A1',
      gradePoint: 10.0
    },
    {
      id: 'MRK-STU-001-SCI',
      examId: 'EXAM-2025-T2',
      studentId: 'STU-001',
      grade: 'Grade 10',
      section: 'A',
      subjectId: 'SUB-SCI',
      subjectName: 'Integrated Science',
      maxMarks: 100,
      theoryMarks: 65,
      practicalMarks: 22,
      totalMarks: 87,
      percentage: 87.0,
      gradeAwarded: 'A2',
      gradePoint: 9.0
    },
    {
      id: 'MRK-STU-001-SOC',
      examId: 'EXAM-2025-T2',
      studentId: 'STU-001',
      grade: 'Grade 10',
      section: 'A',
      subjectId: 'SUB-SOC',
      subjectName: 'Social Science',
      maxMarks: 100,
      theoryMarks: 70,
      practicalMarks: 18,
      totalMarks: 88,
      percentage: 88.0,
      gradeAwarded: 'A2',
      gradePoint: 9.0
    }
  ],
  studentDossiers: [
    {
      studentId: 'STU-001',
      admissionNumber: 'ADM-2021-0492',
      fullName: 'Aarav Sharma',
      gender: 'Male',
      dateOfBirth: '2010-05-14',
      bloodGroup: 'O+',
      grade: 'Grade 10',
      section: 'A',
      classTeacher: 'Mrs. S. Meenakshi',
      attendancePercentage: 96.5,
      scholasticRank: 2,
      parentDetails: {
        fatherName: 'Mr. Rajesh Sharma',
        fatherPhone: '+91 98400 11223',
        motherName: 'Mrs. Ananya Sharma',
        motherPhone: '+91 98400 11224',
        emergencyContact: '+91 98400 11223',
        residenceAddress: '42, Garden View Avenue, Anna Nagar, Madurai'
      },
      transportInfo: {
        routeId: 'ROUTE-04',
        routeName: 'Anna Nagar -> Bypass -> Campus',
        stopName: 'Anna Nagar Roundtana',
        busNumber: 'BUS-04',
        driverName: 'K. Murugan'
      },
      hostelInfo: {
        isHostelResident: true,
        blockName: 'Block A - Boys Senior Wing',
        roomNumber: 'A-201',
        bedNumber: 'B1'
      },
      coScholasticRatings: [
        { domain: 'Work Education / IT Skills', grade: 'A' },
        { domain: 'Art & Cultural Education', grade: 'A' },
        { domain: 'Health & Physical Education', grade: 'A' },
        { domain: 'Discipline & Conduct', grade: 'A' }
      ]
    }
  ]
};

export const INITIAL_PURCHASE_DATA = {
  requisitions: [
    {
      id: 'REQ-STORE-2026-001',
      department: 'Science & Laboratories',
      requestedBy: 'Dr. V. Raman (HOD Science)',
      academicYear: '2025-2026',
      items: [
        { itemName: 'Borosilicate Beakers 250ml', quantity: 50, estimatedCost: 7500 },
        { itemName: 'Digital Analytical Balance 0.001g', quantity: 2, estimatedCost: 36000 }
      ],
      totalEstimatedCost: 43500,
      status: 'Approved for Quotation',
      approvedBy: 'Dr. K. S. Sundaram (Joint Director)'
    }
  ],
  comparativeQuotes: [
    {
      id: 'COMP-QUOTE-2026-001',
      requisitionId: 'REQ-STORE-2026-001',
      quotes: [
        { vendorId: 'VEND-01', vendorName: 'Apex Scientific Instruments', quoteRef: 'APEX/2026/041', subtotal: 39500, gstPercent: 18, totalAmount: 46610, warrantyMonths: 24, deliveryDays: 7 },
        { vendorId: 'VEND-02', vendorName: 'Madurai Lab Supplies & Glassware', quoteRef: 'MLS/QT-88', subtotal: 41200, gstPercent: 18, totalAmount: 48616, warrantyMonths: 12, deliveryDays: 5 },
        { vendorId: 'VEND-03', vendorName: 'Southern Educational Equipment Co.', quoteRef: 'SEEC/902', subtotal: 44000, gstPercent: 18, totalAmount: 51920, warrantyMonths: 12, deliveryDays: 10 }
      ],
      selectedVendorId: 'VEND-01',
      selectionJustification: 'Lowest commercial bid with superior 24-month comprehensive manufacturer warranty.',
      evaluationDate: '2026-02-15',
      evaluators: ['Store Officer', 'HOD Science', 'Joint Director']
    }
  ],
  purchaseOrders: [
    {
      id: 'PO-2026-001',
      poNumber: 'PO/2025-26/STORE-019',
      requisitionId: 'REQ-STORE-2026-001',
      vendorId: 'VEND-01',
      vendorName: 'Apex Scientific Instruments',
      vendorContact: 'sales@apexscientific.com',
      orderDate: '2026-02-20',
      expectedDeliveryDate: '2026-03-01',
      paymentTerms: '100% on Goods Receipt & Inspection Clearance',
      lineItems: [
        { itemName: 'Borosilicate Beakers 250ml', quantity: 50, unitPrice: 150, subtotal: 7500, gstPercent: 18, gstAmount: 1350, total: 8850 },
        { itemName: 'Digital Analytical Balance 0.001g', quantity: 2, unitPrice: 16000, subtotal: 32000, gstPercent: 18, gstAmount: 5760, total: 37760 }
      ],
      subtotal: 39500,
      totalGst: 7110,
      grandTotal: 46610,
      status: 'Approved',
      approvedBy: 'Dr. K. S. Sundaram (Joint Director)',
      approvalDate: '2026-02-21',
      linkedFinanceLiabilityVoucherId: 'VOUCH-LIAB-2026-042',
      grnNumber: 'GRN-2026-015',
      grnDate: '2026-02-28'
    }
  ],
  financeLiabilities: [
    {
      id: 'VOUCH-LIAB-2026-042',
      voucherNumber: 'AP/2026/042',
      poId: 'PO-2026-001',
      poNumber: 'PO/2025-26/STORE-019',
      payeeName: 'Apex Scientific Instruments',
      payeeCategory: 'Vendor / Stores Supplier',
      amountDue: 46610,
      dueDate: '2026-03-31',
      liabilityAccount: 'Accounts Payable - Laboratory Stores',
      status: 'Pending Payment',
      generatedDate: '2026-02-21'
    }
  ]
};

export const INITIAL_INVENTORY_DATA = {
  catalog: [
    { id: 'INV-ITM-001', code: 'SCI-GLS-001', name: 'Borosilicate Beakers 250ml', category: 'Science Lab Equipment', currentStock: 85, minStockLevel: 25, unitOfMeasure: 'Pieces', unitPrice: 150, location: 'Store Room 01 / Shelf B-2' },
    { id: 'INV-ITM-002', code: 'STA-PAP-A4', name: 'Executive A4 Copier Paper 75GSM (Ream of 500)', category: 'Office Stationery', currentStock: 120, minStockLevel: 40, unitOfMeasure: 'Reams', unitPrice: 320, location: 'Store Room 01 / Shelf A-1' },
    { id: 'INV-ITM-003', code: 'SPT-BB-SZ7', name: 'Competition Basketball Size 7', category: 'Sports Equipment', currentStock: 18, minStockLevel: 10, unitOfMeasure: 'Pieces', unitPrice: 1450, location: 'Sports Pavilion Store' }
  ],
  transactions: [
    { id: 'TX-INV-001', itemId: 'INV-ITM-001', transactionType: 'IN', quantity: 50, referenceNo: 'GRN-2026-015', timestamp: '2026-02-28T11:00:00Z', performedBy: 'Store Officer' },
    { id: 'TX-INV-002', itemId: 'INV-ITM-002', transactionType: 'OUT', quantity: 15, referenceNo: 'ISS-2026-081', timestamp: '2026-03-02T14:30:00Z', performedBy: 'Store Officer' }
  ],
  issueRegister: [
    {
      id: 'ISSUE-2026-001',
      itemId: 'INV-ITM-003',
      itemName: 'Competition Basketball Size 7',
      issuedToId: 'EMP-PE-002',
      issuedToName: 'S. Rajendran (PE Teacher)',
      department: 'Physical Education & Sports',
      quantity: 5,
      issueDate: '2026-03-05',
      isReturnable: true,
      expectedReturnDate: '2026-03-06',
      actualReturnDate: '2026-03-06T17:00:00Z',
      status: 'Returned & Checked In',
      returnCondition: 'Good'
    }
  ]
};

export const INITIAL_LOST_FOUND_DATA = {
  items: [
    {
      id: 'LF-2026-001',
      type: 'FOUND',
      title: 'Titan Fastrack Digital Wristwatch (Black Strap)',
      category: 'Electronics & Watches',
      location: 'Basketball Court Player Bench',
      dateReported: '2026-03-08',
      photoUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80',
      description: 'Found black digital watch with red dial accents after evening practice session.',
      custodialLocker: 'Security Gate 1 Custody Safe',
      custodianName: 'Head Gatekeeper',
      status: 'Under Review',
      claimantDetails: {
        claimantId: 'STU-001',
        claimantName: 'Aarav Sharma',
        claimantContact: '+91 98400 11223',
        proofDescription: 'Minor scratch near top button; backlight is amber tone.',
        claimDate: '2026-03-09'
      }
    },
    {
      id: 'LF-2026-002',
      type: 'LOST',
      title: 'Parker Blue Metal Fountain Pen in Velvet Case',
      category: 'Stationery & Books',
      location: 'Central Library Reading Hall 2',
      dateReported: '2026-03-09',
      photoUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300&q=80',
      description: 'Engraved with initials "K.P." on pocket clip.',
      custodialLocker: null,
      custodianName: null,
      status: 'Reported Lost',
      claimantDetails: null
    }
  ]
};

export const INITIAL_AWARDS_DATA = {
  somNominations: [
    {
      id: 'SOM-2026-02-001',
      month: 'February 2026',
      category: 'ACADEMIC',
      nomineeId: 'STU-001',
      nomineeName: 'Aarav Sharma',
      grade: 'Grade 10',
      section: 'A',
      nominatedById: 'EMP-TCH-001',
      nominatedByName: 'Mrs. S. Meenakshi (Class Teacher)',
      checklistScores: {
        punctuality: 5,
        classroomHygiene: 5,
        peerMentoring: 5,
        homeworkCompletion: 5,
        valuesAndEthics: 5
      },
      totalScore: 25,
      reviewRemarks: 'Demonstrated outstanding peer mentoring during pre-board mathematics revisions.',
      status: 'Announced Winner',
      announcedDate: '2026-02-28'
    },
    {
      id: 'SOM-2026-01-001',
      month: 'January 2026',
      category: 'ACADEMIC',
      nomineeId: 'STU-001',
      nomineeName: 'Aarav Sharma',
      grade: 'Grade 10',
      section: 'A',
      nominatedById: 'EMP-TCH-001',
      nominatedByName: 'Mrs. S. Meenakshi',
      checklistScores: {
        punctuality: 5,
        classroomHygiene: 4,
        peerMentoring: 5,
        homeworkCompletion: 5,
        valuesAndEthics: 5
      },
      totalScore: 24,
      reviewRemarks: 'Represented school at State Science Olympiad, securing 1st place.',
      status: 'Announced Winner',
      announcedDate: '2026-01-31'
    }
  ],
  soyNominations: [
    {
      id: 'SOY-2025-26-001',
      academicYear: '2025-2026',
      nomineeId: 'STU-001',
      nomineeName: 'Aarav Sharma',
      grade: 'Grade 10',
      eligibilityVerification: {
        somWinsCount: 2, // Meets minimum 2 SOM wins requirement
        minimumSomWinsMet: true,
        cumulativeGpa: 9.6,
        attendancePercentage: 96.5,
        zeroDisciplinaryInfractions: true,
        stateOrNationalAchievements: 'Gold Medal in State Science Olympiad 2026',
        isEligible: true
      },
      committeeEvaluation: {
        score: 95.5,
        remarks: 'Exemplary scholastic consistency, active hostel student council leadership, and flawless conduct.',
        recommendedBy: 'Executive Committee Panel (Principal, Joint Director, Academic Coordinator)'
      },
      managingDirectorApproval: {
        approved: true,
        mdRemarks: 'Approved for annual institutional citation and Star of the Year rolling trophy.',
        timestamp: '2026-03-01T14:00:00Z'
      },
      citation: 'In recognition of outstanding academic brilliance, peer leadership, and sterling character.',
      status: 'Approved & Selected'
    }
  ]
};

export const INITIAL_TRANSPORT_DATA = {
  vehicles: [
    {
      id: 'VEH-04',
      vehicleNumber: 'BUS-04',
      registrationNumber: 'TN-58-BZ-4190',
      model: 'Ashok Leyland 42-Seater School Bus',
      capacity: 42,
      assignedDriverId: 'EMP-DRV-004',
      assignedDriverName: 'K. Murugan',
      fuelLevelPercent: 78,
      fitnessCertificateExpiry: '2026-11-30',
      insuranceExpiry: '2026-09-15',
      statePermitExpiry: '2027-04-10',
      status: 'Active'
    }
  ],
  routes: [
    {
      id: 'ROUTE-04',
      name: 'Route 4: Anna Nagar -> Collectorate -> Campus',
      vehicleId: 'VEH-04',
      busNumber: 'BUS-04',
      driverId: 'EMP-DRV-004',
      driverName: 'K. Murugan',
      driverContact: '+91 98402 33445',
      stops: [
        { stopId: 'STP-401', stopName: 'Anna Nagar Roundtana', morningPickupTime: '07:35 AM', eveningDropTime: '04:15 PM', studentCount: 8 },
        { stopId: 'STP-402', stopName: 'District Collectorate Junction', morningPickupTime: '07:50 AM', eveningDropTime: '04:00 PM', studentCount: 12 },
        { stopId: 'STP-403', stopName: 'KK Nagar Arch', morningPickupTime: '08:05 AM', eveningDropTime: '03:45 PM', studentCount: 10 },
        { stopId: 'STP-404', stopName: 'School Campus Main Gate', morningPickupTime: '08:25 AM', eveningDropTime: '03:30 PM', studentCount: 0 }
      ]
    }
  ],
  passengerManifest: [
    {
      studentId: 'STU-001',
      studentName: 'Aarav Sharma',
      grade: 'Grade 10-A',
      stopId: 'STP-401',
      stopName: 'Anna Nagar Roundtana',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
      parentEmergencyContact: '+91 98400 11223',
      feeStatus: 'Paid',
      boardingStatus: 'Boarded'
    },
    {
      studentId: 'STU-002',
      studentName: 'Kavya Patel',
      grade: 'Grade 10-A',
      stopId: 'STP-402',
      stopName: 'District Collectorate Junction',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
      parentEmergencyContact: '+91 98400 55667',
      feeStatus: 'Pending',
      boardingStatus: 'Absent'
    }
  ],
  nocClearances: [
    {
      id: 'NOC-TRP-2026-001',
      staffType: 'Driver',
      staffId: 'EMP-DRV-008',
      staffName: 'T. Shanmugam',
      licenseNo: 'TN-58-2015-004921',
      vehicleAssigned: 'BUS-08 (TN-58-CZ-3310)',
      clearances: {
        vehicleKeys: true,
        fuelCard: true,
        toolKit: true,
        firstAid: true,
        fastag: true,
        finesCleared: true,
        kmAuditVerified: true
      },
      remarks: 'All vehicle tools, stepney tyre, and BPCL fleet fuel card reconciled. Zero pending traffic challans on Parivahan portal.',
      nocStatus: 'Cleared / NOC Issued',
      issuedDate: '2026-03-05',
      issuedBy: 'A. David Raj (Transport Manager)',
      certificateNo: 'NOC/TRP/2026/001'
    },
    {
      id: 'NOC-TRP-2026-002',
      staffType: 'Conductor',
      staffId: 'EMP-CND-003',
      staffName: 'V. Murugesan',
      licenseNo: 'CND-BADGE-2018-881',
      vehicleAssigned: 'BUS-03 (TN-58-BZ-2104)',
      clearances: {
        vehicleKeys: true,
        fuelCard: true,
        toolKit: true,
        firstAid: true,
        fastag: true,
        finesCleared: true,
        kmAuditVerified: true
      },
      remarks: 'Student passenger register handed over, emergency exit hammer accounted for.',
      nocStatus: 'Cleared / NOC Issued',
      issuedDate: '2026-03-08',
      issuedBy: 'A. David Raj (Transport Manager)',
      certificateNo: 'NOC/TRP/2026/002'
    },
    {
      id: 'NOC-TRP-2026-003',
      staffType: 'Driver',
      staffId: 'EMP-DRV-011',
      staffName: 'P. Balakrishnan',
      licenseNo: 'TN-59-2018-009941',
      vehicleAssigned: 'BUS-11 (TN-58-DZ-1102)',
      clearances: {
        vehicleKeys: true,
        fuelCard: false,
        toolKit: true,
        firstAid: true,
        fastag: true,
        finesCleared: false,
        kmAuditVerified: true
      },
      remarks: 'Pending clearance: Fuel card balance receipt mismatch (Rs. 1,450) and 1 over-speeding e-challan pending on Madurai Ring Road.',
      nocStatus: 'On Hold / Penalty Pending',
      issuedDate: null,
      issuedBy: null,
      certificateNo: null
    }
  ]
};
