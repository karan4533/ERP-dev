import React from 'react'
import SupportTicketsList from '../../Pages/ITSupportManager/SupportTickets/SupportTicketsList'

/**
 * Department inbox for multi-department tickets (shared campus ticket store).
 * defaultDepartment filters the list to that department's queue.
 */
const DepartmentTicketsPage = ({
    defaultDepartment = '',
    listBasePath = '/it-support-manager/support-tickets',
    title = 'Tickets',
}) => (
    <SupportTicketsList
        defaultDepartment={defaultDepartment}
        listBasePath={listBasePath}
        pageTitle={title}
    />
)

export default DepartmentTicketsPage
