/** Default Admin document routes (SoT for Administrator portal). */
export const ADMIN_STUDENT_DOCUMENT_PATHS = {
    list: '/admin/documents/student-documents',
    add: '/admin/documents/add-student-documents',
    view: (id) => `/admin/documents/view-student-documents/${id}`,
    edit: (id) => `/admin/documents/edit-student-documents/${id}`,
}

export const ADMIN_EMPLOYEE_DOCUMENT_PATHS = {
    list: '/admin/documents/employee-documents',
    add: '/admin/documents/add-employee-documents',
    edit: (id) => `/admin/documents/edit-employee-documents/${id}`,
}

/** File Room portal mirrors the same screens under dedicated paths. */
export const FILE_ROOM_STUDENT_DOCUMENT_PATHS = {
    list: '/file-room/student-records',
    add: '/file-room/student-records/add',
    view: (id) => `/file-room/student-records/view/${id}`,
    edit: (id) => `/file-room/student-records/edit/${id}`,
}

export const FILE_ROOM_EMPLOYEE_DOCUMENT_PATHS = {
    list: '/file-room/staff-records',
    add: '/file-room/staff-records/add',
    edit: (id) => `/file-room/staff-records/edit/${id}`,
}
