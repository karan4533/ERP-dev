import React from 'react'

const formatWhen = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

/** Server-recorded TC request history (audit trail), including administrator NOC overrides. */
const TcRequestHistory = ({ history = [], title = 'Request history' }) => {
    const rows = Array.isArray(history) ? history : []
    if (!rows.length) return null

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
            <ol className='space-y-3'>
                {rows.map((item, index) => (
                    <li
                        key={`${item.action}-${item.at}-${index}`}
                        className={`border-l-4 pl-3 ${item.action === 'TC_NOC_OVERRIDDEN' ? 'border-[#6941C6]' : 'border-[#D0D5DD]'}`}
                    >
                        <p className='text-sm font-medium text-[#1E1E1E]'>{item.label || item.action}</p>
                        <p className='text-xs text-[#667085]'>
                            {formatWhen(item.at)}
                            {item.actorEmail ? ` · ${item.actorEmail}` : ''}
                            {item.actorRole ? ` (${item.actorRole})` : ''}
                        </p>
                        {item.action === 'TC_NOC_OVERRIDDEN' && item.override ? (
                            <p className='text-sm text-[#667085] mt-1 whitespace-pre-wrap'>
                                {item.override.roleLabel || item.override.roleCode} NOC — reason: {item.override.reason || '—'}
                                {item.override.activeClearingUserExisted ? '' : ' (no active clearing user existed)'}
                            </p>
                        ) : item.details ? (
                            <p className='text-sm text-[#667085] mt-1 whitespace-pre-wrap'>{item.details}</p>
                        ) : null}
                    </li>
                ))}
            </ol>
        </div>
    )
}

export default TcRequestHistory
