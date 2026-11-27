import React from 'react'
import RequestProductFromStore from '../../../Common/Store/RequestProductFromStore'
import RegisterPage from '../../../Common/demoDomain/RegisterPage'
import { MAINT_REQUEST_KEY } from '../maintenanceOpsData'

/** Maintenance department product requests → Store Requests & Approvals. */
const StoreRequests = () => (
    <div className='space-y-6'>
        <RequestProductFromStore
            department="Maintenance"
            requestedBy="Maintenance Manager"
            title="Request Product from Store"
            description="Request materials from Store for Maintenance repairs. Store Officer reviews and issues stock (JD/Finance for purchases separately)."
        />
        {/* Requests raised before the shared Store workflow lived in maint-requests; keep them visible. */}
        <RegisterPage
            title="Earlier Maintenance Store Requests"
            description="Read-only history of Maintenance store requests recorded before requests moved to the shared Store workflow."
            storageKey={MAINT_REQUEST_KEY}
            seed={[]}
            idPrefix="MRQ-2026-"
            readOnly
            statusKey="status"
            columns={[
                { key: 'id', label: 'Request' },
                { key: 'requestType', label: 'Type' },
                { key: 'item', label: 'Item' },
                { key: 'quantity', label: 'Qty' },
                { key: 'status', label: 'Status' },
                { key: 'approver', label: 'Approver' },
            ]}
            fields={[]}
        />
    </div>
)

export default StoreRequests
