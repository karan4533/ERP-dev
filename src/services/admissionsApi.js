import { apiRequest } from './apiClient'
import { fileDownloadUrl, resolveProfileImageFileId } from './filesApi'

const toIsoDate = (value) => {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 10)
}

/** API enquiry → frontend camelCase shape used by existing screens */
export const mapEnquiryFromApi = (row) => ({
    id: String(row.id),
    enquiryCode: row.enquiry_code,
    name: row.name || '',
    mobileNumber: row.mobile_number || '',
    email: row.email || '',
    gender: row.gender || '',
    address: row.address || '',
    description: row.description || '',
    note: row.note || '',
    enquiryDate: row.enquiry_date || '',
    nextFollowUpDate: row.next_follow_up_date || '',
    assignedTo: row.assigned_to || '',
    reference: row.reference || '',
    source: row.source || '',
    className: row.class_name || '',
    numberOfChild: row.number_of_child || '',
    city: row.city || '',
    state: row.state || '',
    profileImageFileId: row.profile_image_file_id ?? null,
    profileImage: fileDownloadUrl(row.profile_image_url) || '',
    status: row.status || 'Active',
    convertedAdmissionId: row.converted_admission_id,
    createdAt: row.created_at,
})

export const mapAdmissionFromApi = (row) => ({
    id: String(row.id),
    admissionNumber: row.admission_code,
    fromEnquiryId: row.enquiry_id != null ? String(row.enquiry_id) : '',
    admissionDate: row.admission_date || '',
    className: row.class_name || '',
    registrationFees: row.registration_fees || '',
    batchStartYear: row.batch_start_year || '',
    batchEndYear: row.batch_end_year || '',
    firstName: row.first_name || '',
    middleName: row.middle_name || '',
    lastName: row.last_name || '',
    gender: row.gender || '',
    religion: row.religion || '',
    caste: row.caste || '',
    address: row.address || '',
    dateOfBirth: row.date_of_birth || '',
    country: row.country || '',
    state: row.state || '',
    city: row.city || '',
    zipCode: row.zip_code || '',
    mobileNumber: row.mobile_number || '',
    altMobileNumber: row.alt_mobile_number || '',
    email: row.email || '',
    previousSchool: row.previous_school || '',
    bloodGroup: row.blood_group || '',
    height: row.height || '',
    weight: row.weight || '',
    medicalHistory: row.medical_history || '',
    profileImageFileId: row.profile_image_file_id ?? null,
    profileImage: fileDownloadUrl(row.profile_image_url) || '',
    modeOfTransport: row.mode_of_transport || '',
    route: row.route || '',
    busStop: row.bus_stop || '',
    fatherName: row.father_name || '',
    motherName: row.mother_name || '',
    fatherOccupation: row.father_occupation || '',
    motherOccupation: row.mother_occupation || '',
    fatherIncome: row.father_income || '',
    motherIncome: row.mother_income || '',
    siblings: row.siblings || '',
    parentAddress: row.parent_address || '',
    parentCountry: row.parent_country || '',
    parentState: row.parent_state || '',
    parentCity: row.parent_city || '',
    parentZipCode: row.parent_zip_code || '',
    parentMobileNumber: row.parent_mobile_number || '',
    parentAltMobileNumber: row.parent_alt_mobile_number || '',
    parentEmail: row.parent_email || '',
    parentAccountEmail: row.parent_account_email || '',
    feesGroup: row.fees_group || '',
    status: row.status || 'Active',
    enrolledStudentId: row.enrolled_student_id != null ? String(row.enrolled_student_id) : '',
    enrolledAt: row.enrolled_at || '',
    rollNumber: '',
})

export const enquiryFormToApi = (form) => ({
    name: String(form.name || '').trim(),
    mobile_number: String(form.mobileNumber || '').trim(),
    email: form.email || null,
    gender: form.gender || null,
    address: form.address || null,
    description: form.description || null,
    note: form.note || null,
    enquiry_date: toIsoDate(form.enquiryDate),
    next_follow_up_date: toIsoDate(form.nextFollowUpDate),
    assigned_to: form.assignedTo || null,
    reference: form.reference || null,
    source: form.source || null,
    class_name: form.className || '',
    number_of_child: form.numberOfChild ? String(form.numberOfChild) : null,
    city: form.city || null,
    state: form.state || null,
    profile_image_file_id: form.profileImageFileId ?? null,
    status: form.status || 'Active',
})

export const admissionFormToApi = (form) => ({
    enquiry_id: form.fromEnquiryId ? String(form.fromEnquiryId) : null,
    admission_date: toIsoDate(form.admissionDate),
    class_name: form.className || '',
    registration_fees: form.registrationFees || null,
    batch_start_year: form.batchStartYear
        ? Number(form.batchStartYear instanceof Date ? form.batchStartYear.getFullYear() : form.batchStartYear)
        : null,
    batch_end_year: form.batchEndYear
        ? Number(form.batchEndYear instanceof Date ? form.batchEndYear.getFullYear() : form.batchEndYear)
        : null,
    first_name: String(form.firstName || '').trim(),
    middle_name: form.middleName || null,
    last_name: form.lastName || null,
    gender: form.gender || null,
    religion: form.religion || null,
    caste: form.caste || null,
    address: form.address || null,
    date_of_birth: toIsoDate(form.dateOfBirth),
    country: form.country || null,
    state: form.state || null,
    city: form.city || null,
    zip_code: form.zipCode || null,
    mobile_number: String(form.mobileNumber || '').trim(),
    alt_mobile_number: form.altMobileNumber || null,
    email: form.email || null,
    previous_school: form.previousSchool || null,
    blood_group: form.bloodGroup || null,
    height: form.height || null,
    weight: form.weight || null,
    medical_history: form.medicalHistory || null,
    mode_of_transport: form.modeOfTransport || null,
    route: form.route || null,
    bus_stop: form.busStop || null,
    father_name: form.fatherName || null,
    mother_name: form.motherName || null,
    father_occupation: form.fatherOccupation || null,
    mother_occupation: form.motherOccupation || null,
    father_income: form.fatherIncome || null,
    mother_income: form.motherIncome || null,
    siblings: form.siblings || null,
    parent_address: form.parentAddress || null,
    parent_country: form.parentCountry || null,
    parent_state: form.parentState || null,
    parent_city: form.parentCity || null,
    parent_zip_code: form.parentZipCode || null,
    parent_mobile_number: form.parentMobileNumber || null,
    parent_alt_mobile_number: form.parentAltMobileNumber || null,
    parent_email: form.parentEmail || null,
    parent_account_email: form.parentAccountEmail || null,
    parent_account_password: form.parentAccountPassword || null,
    fees_group: form.feesGroup || null,
    profile_image_file_id: form.profileImageFileId ?? null,
    status: form.status || 'Active',
})

const withUploadedProfile = async (form, resourceType) => {
    const profileImageFileId = await resolveProfileImageFileId(form, resourceType)
    return { ...form, profileImageFileId }
}

export const listEnquiriesApi = async (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const rows = await apiRequest(`/admissions/enquiries${query}`)
    return rows.map(mapEnquiryFromApi)
}

export const getEnquiryApi = async (id) => mapEnquiryFromApi(await apiRequest(`/admissions/enquiries/${id}`))

export const createEnquiryApi = async (form) => {
    const ready = await withUploadedProfile(form, 'admission_enquiry')
    return mapEnquiryFromApi(
        await apiRequest('/admissions/enquiries', { method: 'POST', body: enquiryFormToApi(ready) }),
    )
}

export const updateEnquiryApi = async (id, form) => {
    const ready = await withUploadedProfile(form, 'admission_enquiry')
    return mapEnquiryFromApi(
        await apiRequest(`/admissions/enquiries/${id}`, { method: 'PATCH', body: enquiryFormToApi(ready) }),
    )
}

export const convertEnquiryApi = async (id) =>
    mapAdmissionFromApi(await apiRequest(`/admissions/enquiries/${id}/convert`, { method: 'POST' }))

export const listAdmissionsApi = async (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const rows = await apiRequest(`/admissions${query}`)
    return rows.map(mapAdmissionFromApi)
}

export const getAdmissionApi = async (id) => mapAdmissionFromApi(await apiRequest(`/admissions/${id}`))

export const createAdmissionApi = async (form) => {
    const ready = await withUploadedProfile(form, 'admission')
    return mapAdmissionFromApi(
        await apiRequest('/admissions', { method: 'POST', body: admissionFormToApi(ready) }),
    )
}

export const updateAdmissionApi = async (id, form) => {
    const ready = await withUploadedProfile(form, 'admission')
    return mapAdmissionFromApi(
        await apiRequest(`/admissions/${id}`, {
            method: 'PATCH',
            body: admissionFormToApi(ready),
        }),
    )
}

export const enrollAdmissionApi = async (id, payload = {}) =>
    apiRequest(`/admissions/${id}/enroll`, {
        method: 'POST',
        body: {
            parent_account_email: payload.parentAccountEmail || null,
            parent_account_password: payload.parentAccountPassword || null,
            skip_parent_account: Boolean(payload.skipParentAccount),
        },
    })
