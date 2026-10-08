import noProfile from '../../../../assets/images/no-profile.png'
import { CLASS_LEVEL_OPTIONS } from '../../Class/ClassDetails/classDetailsOptions'

const STORAGE_KEY = 'schoolerp-admin-admission-enquiries'
export const ROUTE_BASE = '/admin/front-office/admission-enquiry'
export const FRONT_OFFICE_ROUTE_BASE = '/front-office/admission-enquiry'

export const getEnquiryRouteBase = (pathname = '') =>
    pathname.startsWith('/front-office') ? FRONT_OFFICE_ROUTE_BASE : ROUTE_BASE

export const getAddAdmissionPath = (pathname = '') =>
    pathname.startsWith('/front-office')
        ? '/front-office/add-admission'
        : '/admin/front-office/add-admission'

export const getAdmissionListPath = (pathname = '') =>
    pathname.startsWith('/front-office')
        ? '/front-office/admission-list'
        : '/admin/front-office/admission-list'

export const isAdminFrontOfficePath = (pathname = '') =>
    pathname.startsWith('/admin/front-office')

export const GENDER_OPTIONS = ['Male', 'Female', 'Others']

export const SOURCE_OPTIONS = [
    'Advertisement',
    'Website',
    'Referral',
    'Walk-in',
    'Social Media',
    'School Event',
]

export const REFERENCE_OPTIONS = [
    'Parent',
    'Teacher',
    'Alumni',
    'Friend',
    'Agent',
    'Other',
]

export const STATUS_OPTIONS = ['Active', 'Success', 'In Active']

export const CLASS_OPTIONS = CLASS_LEVEL_OPTIONS

export const statusBadgeColor = {
    Success: 'bg-[#4CAF5033] text-[#4CAF50]',
    Active: 'bg-[#FF980033] text-[#FF9800]',
    'In Active': 'bg-[#FF000033] text-[#FF0000]',
}

export const DEFAULT_ENQUIRY_FORM = {
    name: '',
    mobileNumber: '',
    email: '',
    gender: '',
    address: '',
    description: '',
    note: '',
    enquiryDate: null,
    nextFollowUpDate: null,
    assignedTo: '',
    reference: '',
    source: '',
    className: '',
    numberOfChild: '',
    city: '',
    state: '',
    profileImage: '',
    status: 'Active',
}

const formatDate = (date) => {
    if (!date) return ''
    const value = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(value.getTime())) return ''
    const day = String(value.getDate()).padStart(2, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const year = value.getFullYear()
    return `${day}-${month}-${year}`
}

const parseStoredDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return value
    const [day, month, year] = String(value).split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const loadEnquiries = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return Array.isArray(parsed) ? parsed : []
        }
    } catch {
        /* ignore */
    }
    return []
}

const saveEnquiries = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getAllAdmissionEnquiries = () => loadEnquiries()

export const getAdmissionEnquiryById = (id) =>
    loadEnquiries().find((item) => item.id === id) ?? null

export const generateEnquiryId = () => {
    const records = loadEnquiries()
    const max = records.reduce((acc, item) => {
        const numeric = Number(String(item.id).replace(/\D/g, ''))
        return Number.isNaN(numeric) ? acc : Math.max(acc, numeric)
    }, 0)
    return `AE-${String(max + 1).padStart(4, '0')}`
}

export const createAdmissionEnquiry = (payload) => {
    const name = String(payload.name || '').trim()
    const mobileNumber = String(payload.mobileNumber || '').trim()

    if (!name) return { success: false, message: 'Name is required.' }
    if (!mobileNumber) return { success: false, message: 'Mobile number is required.' }
    if (!payload.className) return { success: false, message: 'Class is required.' }

    const records = loadEnquiries()
    const record = {
        id: generateEnquiryId(),
        name,
        mobileNumber,
        email: String(payload.email || '').trim(),
        gender: payload.gender || '',
        address: String(payload.address || '').trim(),
        description: String(payload.description || '').trim(),
        note: String(payload.note || '').trim(),
        enquiryDate: formatDate(payload.enquiryDate || new Date()),
        nextFollowUpDate: formatDate(payload.nextFollowUpDate),
        assignedTo: String(payload.assignedTo || '').trim(),
        reference: payload.reference || '',
        source: payload.source || '',
        className: payload.className || '',
        numberOfChild: String(payload.numberOfChild || '').trim(),
        city: String(payload.city || '').trim(),
        state: String(payload.state || '').trim(),
        profileImage: payload.profileImage || '',
        status: STATUS_OPTIONS.includes(payload.status) ? payload.status : 'Active',
        createdAt: new Date().toISOString(),
    }

    saveEnquiries([record, ...records])
    return { success: true, record }
}

export const updateAdmissionEnquiry = (id, payload) => {
    const records = loadEnquiries()
    const index = records.findIndex((item) => item.id === id)
    if (index < 0) return { success: false, message: 'Enquiry not found.' }

    const name = String(payload.name || '').trim()
    const mobileNumber = String(payload.mobileNumber || '').trim()

    if (!name) return { success: false, message: 'Name is required.' }
    if (!mobileNumber) return { success: false, message: 'Mobile number is required.' }
    if (!payload.className) return { success: false, message: 'Class is required.' }

    records[index] = {
        ...records[index],
        name,
        mobileNumber,
        email: String(payload.email || '').trim(),
        gender: payload.gender || '',
        address: String(payload.address || '').trim(),
        description: String(payload.description || '').trim(),
        note: String(payload.note || '').trim(),
        enquiryDate: formatDate(payload.enquiryDate || new Date()),
        nextFollowUpDate: formatDate(payload.nextFollowUpDate),
        assignedTo: String(payload.assignedTo || '').trim(),
        reference: payload.reference || '',
        source: payload.source || '',
        className: payload.className || '',
        numberOfChild: String(payload.numberOfChild || '').trim(),
        city: String(payload.city || '').trim(),
        state: String(payload.state || '').trim(),
        profileImage: payload.profileImage || '',
        status: STATUS_OPTIONS.includes(payload.status) ? payload.status : records[index].status,
        updatedAt: new Date().toISOString(),
    }

    saveEnquiries(records)
    return { success: true, record: records[index] }
}

export const updateAdmissionEnquiryStatus = (id, status) => {
    if (!STATUS_OPTIONS.includes(status)) {
        return { success: false, message: 'Invalid status.' }
    }
    const records = loadEnquiries()
    const index = records.findIndex((item) => item.id === id)
    if (index < 0) return { success: false, message: 'Enquiry not found.' }

    records[index] = { ...records[index], status }
    saveEnquiries(records)
    return { success: true, record: records[index] }
}

export const deleteAdmissionEnquiry = (id) => {
    const records = loadEnquiries().filter((item) => item.id !== id)
    saveEnquiries(records)
    return { success: true }
}

export const filterAdmissionEnquiries = (records, { search = '', status = '' } = {}) => {
    const query = search.trim().toLowerCase()
    return records.filter((item) => {
        const matchesStatus = !status || item.status === status
        if (!matchesStatus) return false
        if (!query) return true
        return [
            item.name,
            item.mobileNumber,
            item.email,
            item.className,
            item.source,
            item.assignedTo,
            item.city,
            item.state,
            item.id,
        ].some((value) => String(value || '').toLowerCase().includes(query))
    })
}

export const getEnquiryProfileImage = (record) => record?.profileImage || noProfile

export const toFormState = (record) => ({
    ...DEFAULT_ENQUIRY_FORM,
    ...record,
    enquiryDate: parseStoredDate(record?.enquiryDate) || new Date(),
    nextFollowUpDate: parseStoredDate(record?.nextFollowUpDate),
})

/** Map enquiry record fields into Add Admission form prefill */
export const mapEnquiryToAdmissionPrefill = (enquiry) => ({
    firstName: enquiry?.name || '',
    mobileNumber: enquiry?.mobileNumber || '',
    email: enquiry?.email || '',
    address: enquiry?.address || '',
    className: enquiry?.className || '',
    gender: enquiry?.gender || '',
    city: enquiry?.city || '',
    state: enquiry?.state || '',
})
