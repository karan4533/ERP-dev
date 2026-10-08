import {
    EMPLOYEE_DOCUMENTS_STORAGE_KEY,
    EMPLOYEE_DOCUMENT_TYPES_STORAGE_KEY,
} from '../../Pages/Admin/Documents/EmployeeDocuments/employeeDocumentsData'
import { STUDENT_DOCUMENTS_STORAGE_KEY } from '../../Pages/Admin/Documents/StudentDocuments/studentDocumentsData'

const WIPE_FLAG = 'schoolerp-documents-wipe-v1'

/** One-time clear of legacy student/employee document mock records. */
export const runDocumentsWipeIfNeeded = () => {
    try {
        if (typeof localStorage === 'undefined') return
        if (localStorage.getItem(WIPE_FLAG) === '1') return

        localStorage.removeItem(STUDENT_DOCUMENTS_STORAGE_KEY)
        localStorage.removeItem(EMPLOYEE_DOCUMENTS_STORAGE_KEY)
        localStorage.removeItem(EMPLOYEE_DOCUMENT_TYPES_STORAGE_KEY)
        localStorage.setItem(WIPE_FLAG, '1')
    } catch {
        /* ignore */
    }
}
