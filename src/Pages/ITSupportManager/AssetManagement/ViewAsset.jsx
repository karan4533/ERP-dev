import React, { useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { addServiceRecord, getAssetById, getServiceHistory, getTransfers, statusBadgeColor, transferAsset } from './assetData'
import { getTicketsForAsset } from '../SupportTickets/supportTicketsData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const ViewAsset = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [version, setVersion] = useState(0)
    const asset = getAssetById(id)
    const services = asset && version >= 0 ? getServiceHistory(asset.assetId) : []
    const tickets = asset ? getTicketsForAsset(asset.assetId) : []
    const transfers = asset && version >= 0 ? getTransfers(asset.assetId) : []

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button type='button' onClick={() => navigate('/it-support-manager/asset-management')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!asset ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Asset not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                            <div>
                                <h1 className='text-2xl font-semibold text-black'>{asset.assetName}</h1>
                                <p className='text-sm text-[#667085] mt-1'>{asset.assetId} · {asset.category}</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap w-fit ${statusBadgeColor[asset.status]}`}>
                                {asset.status}
                            </span>
                        </div>
                    </div>

                    <Section title='Asset Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Asset ID' value={asset.assetId} />
                            <Field label='Asset Name' value={asset.assetName} />
                            <Field label='Category' value={asset.category} />
                            <Field label='Brand' value={asset.brand} />
                            <Field label='Model' value={asset.model} />
                            <Field label='Serial Number' value={asset.serialNumber} />
                            <Field label='Asset Tag Number' value={asset.assetTagNumber} />
                        </div>
                    </Section>

                    <Section title='Purchase Details'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Vendor Name' value={asset.vendorName} />
                            <Field label='Purchase Date' value={asset.purchaseDate} />
                            <Field label='Purchase Cost' value={asset.purchaseCost} />
                            <Field label='Invoice Number' value={asset.invoiceNumber} />
                        </div>
                    </Section>

                    <Section title='Warranty'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Warranty Start Date' value={asset.warrantyStartDate} />
                            <Field label='Warranty End Date' value={asset.warrantyEndDate} />
                        </div>
                    </Section>

                    <Section title='Current Assignment'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                            <Field label='Department' value={asset.department || '—'} />
                            <Field label='Custodian' value={asset.custodian || '—'} />
                        </div>
                    </Section>

                    <Section title='Service History'>
                        <ServiceForm assetId={asset.assetId} onSaved={() => setVersion((value) => value + 1)} />
                        <HistoryTable
                            empty='No service records for this asset.'
                            headers={['Service ID', 'Date', 'Type', 'Issue', 'Provider', 'Outside / Internal', 'Cost', 'Status', 'Completed']}
                            rows={services.map((item) => [item.id, item.serviceDate, item.serviceType, item.issue, item.provider, item.location, item.cost, item.status, item.completedDate])}
                        />
                    </Section>

                    <Section title='Ticket History'>
                        <HistoryTable
                            empty='No tickets are linked to this asset.'
                            headers={['Ticket ID', 'Raised Date', 'Issue', 'Raised By', 'Priority', 'Status', 'Last Updated']}
                            rows={tickets.map((item) => [item.ticketId, item.createdDate, item.subject, item.requesterName, item.priority, item.status, item.updatedDate || item.createdDate])}
                            linkIndex={0}
                            linkTo={(ticketId) => `/it-support-manager/support-tickets/view-ticket/${ticketId}`}
                        />
                    </Section>

                    <Section title='Transfer Asset'>
                        <TransferForm asset={asset} onSaved={() => setVersion((value) => value + 1)} />
                    </Section>

                    <Section title='Transfer History'>
                        <HistoryTable
                            empty='No transfers recorded.'
                            headers={['Transfer ID', 'From Department', 'From Custodian', 'To Department', 'To Custodian', 'Date', 'Reason', 'Status']}
                            rows={transfers.map((item) => [item.id, item.fromDepartment, item.fromCustodian, item.toDepartment, item.toCustodian, item.transferDate, item.reason, item.status])}
                        />
                    </Section>
                </>
            )}
        </section>
    )
}

const inputClass = 'border border-[#D9D9D9] rounded-md px-2 py-2 text-sm'

const HistoryTable = ({ headers, rows, empty, linkIndex = -1, linkTo }) => (
    <div className='overflow-x-auto'>
        <table className='w-full text-sm text-left'>
            <thead className='bg-[#EDEEF5]'><tr>{headers.map((header) => <th key={header} className='px-2 py-2'>{header}</th>)}</tr></thead>
            <tbody>
                {rows.length === 0 && <tr><td className='px-2 py-3 text-[#667085]' colSpan={headers.length}>{empty}</td></tr>}
                {rows.map((row) => (
                    <tr key={row[0]} className='border-b border-[#f2f4f7]'>
                        {row.map((cell, index) => (
                            <td key={headers[index]} className='px-2 py-2'>
                                {index === linkIndex && linkTo ? <NavLink className='text-[#515DEF]' to={linkTo(cell)}>{cell}</NavLink> : cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

const ServiceForm = ({ assetId, onSaved }) => {
    const [open, setOpen] = useState(false)
    const save = (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        addServiceRecord({
            assetId,
            serviceDate: data.get('serviceDate'),
            serviceType: data.get('serviceType'),
            issue: data.get('issue'),
            provider: data.get('provider'),
            location: data.get('location'),
            cost: data.get('cost'),
            status: data.get('status'),
            completedDate: data.get('completedDate'),
            remarks: data.get('remarks'),
            createdBy: 'IT Support',
        })
        setOpen(false)
        onSaved()
    }
    if (!open) return <button type='button' onClick={() => setOpen(true)} className='mb-3 text-sm bg-[#515DEF] text-white px-3 py-2 rounded-md cursor-pointer'>Add Service Record</button>
    return (
        <form onSubmit={save} className='grid md:grid-cols-3 gap-3 mb-4'>
            <input name='serviceDate' type='date' required className={inputClass} />
            <input name='serviceType' required placeholder='Service type' className={inputClass} />
            <input name='issue' required placeholder='Issue / reason' className={inputClass} />
            <input name='provider' placeholder='Provider / vendor' className={inputClass} />
            <select name='location' className={inputClass}><option>Internal</option><option>Outside</option></select>
            <input name='cost' placeholder='Cost' className={inputClass} />
            <select name='status' className={inputClass}><option>Open</option><option>Completed</option></select>
            <input name='completedDate' type='date' className={inputClass} />
            <input name='remarks' placeholder='Remarks' className={inputClass} />
            <button type='submit' className='bg-[#515DEF] text-white text-sm rounded-md cursor-pointer'>Save service record</button>
        </form>
    )
}

const TransferForm = ({ asset, onSaved }) => {
    const save = (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        transferAsset(asset, {
            toDepartment: data.get('toDepartment'),
            toCustodian: data.get('toCustodian'),
            transferDate: data.get('transferDate'),
            reason: data.get('reason'),
            remarks: data.get('remarks'),
        })
        event.currentTarget.reset()
        onSaved()
    }
    return (
        <form onSubmit={save} className='grid md:grid-cols-3 gap-3'>
            <input name='toDepartment' required placeholder='Target department' className={inputClass} />
            <input name='toCustodian' placeholder='Target employee' className={inputClass} />
            <input name='transferDate' type='date' required className={inputClass} />
            <input name='reason' required placeholder='Reason' className={inputClass} />
            <input name='remarks' placeholder='Remarks' className={inputClass} />
            <button type='submit' className='bg-[#515DEF] text-white text-sm rounded-md cursor-pointer'>Confirm transfer</button>
        </form>
    )
}

export default ViewAsset
