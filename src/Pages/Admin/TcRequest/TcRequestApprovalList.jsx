import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ListPagination from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import { filterListRows } from '../../../Common/listFiltering'
import {
    TC_STATUSES,
    getAllTcRequests,
    getPendingSuperAdminCount,
    hydrateTcRequestsFromApi,
    statusBadgeColor,
} from '../../../Common/TcRequest/tcRequestData'
import { canUseTcApi } from '../../../services/tcApi'

const TcRequestApprovalList = ({ basePath = '/admin/tc-request-approval' }) => {
    const location = useLocation()
    const [requests, setRequests] = useState(() => (canUseTcApi() ? [] : getAllTcRequests()))
    const [statusFilter, setStatusFilter] = useState('')
    const [search, setSearch] = useState('')
    const [exportModal, setExportModal] = useState(false)

    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        if (!canUseTcApi()) return undefined
        let active = true
        hydrateTcRequestsFromApi()
            .then((rows) => {
                if (active) {
                    setRequests(rows)
                    setLoadError('')
                }
            })
            .catch((error) => {
                if (active) setLoadError(error?.message || 'TC requests could not be loaded.')
            })
        return () => {
            active = false
        }
    }, [location.key])

    const pendingCount = useMemo(() => getPendingSuperAdminCount(), [requests])

    const filteredRequests = useMemo(
        () => filterListRows(requests, {
            search,
            searchKeys: ['requestId', 'id', 'studentName', 'admissionNumber', 'classSection', 'transferTo', 'forwardedOn', 'status'],
            equals: { status: statusFilter },
        }),
        [requests, search, statusFilter],
    )
    const pagination = useListPagination(filteredRequests, { resetKey: `${search}|${statusFilter}` })

    return (
        <section className='space-y-6'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>TC Request Approval</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Final MD / Super Admin approval after manager NOCs and PRM forward. TC numbers are issued only on final approval.
                </p>
                {loadError ? <p className='text-sm text-[#B42318] mt-2'>{loadError}</p> : null}
            </div>

            {pendingCount > 0 ? (
                <button
                    type='button'
                    onClick={() => setStatusFilter(statusFilter === 'Pending Super Admin Approval' ? '' : 'Pending Super Admin Approval')}
                    className={`text-left w-full sm:w-auto rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                        statusFilter === 'Pending Super Admin Approval'
                            ? 'border-[#515DEF] bg-[#515DEF08] ring-2 ring-[#515DEF]'
                            : 'border-[#E4E7EC] hover:border-[#515DEF] bg-white'
                    }`}
                >
                    <p className='text-sm font-medium text-[#808080]'>Pending Super Admin approval</p>
                    <p className='text-2xl font-bold text-[#0C1E5B] mt-1'>{pendingCount}</p>
                </button>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Request ID, student name...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {TC_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex items-end'>
                        <button
                            type='button'
                            onClick={() => {
                                setSearch('')
                                setStatusFilter('')
                            }}
                            className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-xl font-medium text-black'>TC Requests</h2>
                    <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Request ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Transfer To</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Forwarded On</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>{emptyListMessage(requests.length)}</td>
                                </tr>
                            ) : null}
                            {pagination.rows.map((request) => (
                                <tr key={request.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{request.requestId}</td>
                                    <td className='px-2 py-4'>{request.studentName}</td>
                                    <td className='px-2 py-4'>{request.classSection}</td>
                                    <td className='px-2 py-4'>{request.transferTo}</td>
                                    <td className='px-2 py-4'>{request.forwardedOn || '—'}</td>
                                    <td className='px-2 py-4'>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink to={`${basePath}/view/${request.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Review</NavLink>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination pagination={pagination} showPageSize />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='tc-approvals'
                rows={filteredRequests.map((r) => ({
                    requestId: r.requestId,
                    studentName: r.studentName,
                    admissionNumber: r.admissionNumber,
                    status: r.status,
                    forwardedOn: r.forwardedOn,
                }))}
                exportDescription={<>You are exporting {filteredRequests.length} record{filteredRequests.length === 1 ? '' : 's'}.</>}
            />
        </section>
    )
}

export default TcRequestApprovalList
