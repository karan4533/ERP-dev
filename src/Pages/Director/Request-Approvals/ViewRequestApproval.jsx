import { useParams } from 'react-router-dom'
import ViewCampusApprovalPage from '../../../Common/Approvals/ViewCampusApprovalPage'
import { PURCHASE_REQUESTS, getApprovalStatusLabel, statusBadgeColor, formatAmount, BUDGET_THRESHOLD } from './requestApprovalData'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/** Demo-only purchase detail when opened without an API approval id. */
function DemoPurchaseView() {
    const navigate = useNavigate()
    const request = PURCHASE_REQUESTS.find((item) => item.requestId === 'REQ-2026-003') ?? PURCHASE_REQUESTS[0]

    return (
        <section className="space-y-6">
            <button
                type="button"
                onClick={() => navigate('/director/request-approvals')}
                className="inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer"
            >
                <ArrowLeft size={18} />
                Back to list
            </button>
            <div className="bg-white rounded-2xl shadow-md p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold text-black">{request.requestId}</h1>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusBadgeColor[request.status]}`}>
                        {request.status}
                    </span>
                </div>
                <p className="text-sm text-[#667085] mt-2">{request.purpose}</p>
                <p className="text-xs text-[#808080] mt-3">
                    Demo purchase row — sign in with API auth and open a live inbox item to approve or reject.
                </p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-[#808080]">Amount</span>
                    <p className="text-[#1E1E1E]">{formatAmount(request.requestedAmount)}</p>
                </div>
                <div>
                    <span className="text-[#808080]">{getApprovalStatusLabel(request.requestedAmount)}</span>
                    <p className="text-[#1E1E1E]">{request.status}</p>
                </div>
                <div>
                    <span className="text-[#808080]">Budget threshold</span>
                    <p className="text-[#1E1E1E]">{formatAmount(BUDGET_THRESHOLD)}</p>
                </div>
            </div>
        </section>
    )
}

export default function ViewRequestApproval() {
    const { id } = useParams()
    if (id) {
        return <ViewCampusApprovalPage listPath="/director/request-approvals" roleLabel="Director" />
    }
    return <DemoPurchaseView />
}
