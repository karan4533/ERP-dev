import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AUDIT_CONFIGURATION_PAGES, DEFAULT_AUDIT_CONFIG_PAGE } from './auditConfigurationData'

const AuditConfigurationPage = () => {
    const { pageKey } = useParams()
    const page = AUDIT_CONFIGURATION_PAGES[pageKey]

    if (!page) {
        return <Navigate to={`/joint-director-audit/audit-configuration/${DEFAULT_AUDIT_CONFIG_PAGE}`} replace />
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-8 text-center'>
                <h2 className='text-xl font-semibold text-black'>{page.title}</h2>
                <p className='text-sm text-[#667085] mt-2'>{page.description}</p>
            </div>
        </section>
    )
}

export default AuditConfigurationPage
