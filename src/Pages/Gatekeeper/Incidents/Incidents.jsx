import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Download, Plus } from "lucide-react";
import ExportModal from '../../../Common/CommonComponents/ExportModal';
import ListPagination, { PageSizeSelect } from '../../../Common/CommonComponents/ListPagination';
import { useListPagination } from '../../../Common/useListPagination';
import { filterListRows } from '../../../Common/listFiltering';
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal';
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal';
import { getIncidents, hydrateIncidentsFromApi } from '../../../Common/demoDomain/securityIncidents';

const Incidents = () => {
    const [incidents, setIncidents] = useState(() => getIncidents());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [exportModal, setExportModal] = useState(false);
    const [editRequestModal, setEditRequestModal] = useState(false);
    const [deleteRequestModal, setDeleteRequestModal] = useState(false);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        hydrateIncidentsFromApi().finally(() => setIncidents(getIncidents()))
    }, [])

    const statusOptions = useMemo(
        () => [...new Set(incidents.map((incident) => incident.status).filter(Boolean))].sort(),
        [incidents],
    );
    const filteredIncidents = useMemo(
        () => filterListRows(incidents, {
            search,
            searchKeys: ['id', 'incidentType', 'date', 'location', 'description', 'reportTo', 'status'],
            equals: { status },
            fromDate,
            toDate,
            dateKeys: ['date'],
        }),
        [incidents, search, status, fromDate, toDate],
    );
    const pagination = useListPagination(filteredIncidents, {
        resetKey: [search, status, fromDate?.getTime(), toDate?.getTime()].join('|'),
    });

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setFromDate(null);
        setToDate(null);
    };

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type="button" onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="search" className='text-base font-medium text-[#808080]'>Search</label>
                        <input id="search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Report ID, type, location..." className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="status" className='text-base font-medium text-[#808080]'>Status</label>
                        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            {statusOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>

                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />

                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>

                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable={true}
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />

                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>


            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>CSO / Gate Keeper</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to="/gate-keeper/add-incident" className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Add Incident
                        </NavLink>
                        <button onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <PageSizeSelect pagination={pagination} className='my-2' />
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr className='rounded-lg'>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Report ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Incident Type</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Time</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Location</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Description</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Report To</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredIncidents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-2 py-8 text-center text-[#667085]">
                                        {incidents.length
                                            ? 'No records match the filters.'
                                            : 'No incidents yet. Add one to publish to Gate Keeper Manager (`gate-incidents`).'}
                                    </td>
                                </tr>
                            ) : pagination.rows.map((incident) => (
                                <tr key={incident.id} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg">
                                    <td className="px-2 py-4 rounded-s-lg">{incident.id}</td>
                                    <td className="px-2 py-4">{incident.incidentType}</td>
                                    <td className="px-2 py-4">{incident.date}</td>
                                    <td className="px-2 py-4">{incident.time}</td>
                                    <td className="px-2 py-4">{incident.location}</td>
                                    <td className="px-2 py-4">{incident.description}</td>
                                    <td className="px-2 py-4">{incident.reportTo}</td>
                                    <td className="px-2 py-4 text-center rounded-e-lg">
                                        <NavLink to={`/gate-keeper/incidents/${incident.id}`} className="text-[#515DEF]">View</NavLink>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination pagination={pagination} />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='incidents'
                title='Incidents'
                rows={filteredIncidents}
                exportDescription={<>You are exporting {filteredIncidents.length} record(s).</>}
            />

            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />

            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />

        </section>
    )
}

export default Incidents
