import { statusClass } from './statusClass'

export function StatusBadge({ status }) {
    if (!status) return <span className='text-[#667085]'>—</span>
    return (
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusClass(status)}`}>
            {status}
        </span>
    )
}
