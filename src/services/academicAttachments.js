import { canUseAcademicsApi } from './academicsApi'
import { uploadFileWithProgress } from './filesApi'

/** Linked /files resource_type for each academics deliverable collection. */
export const ACADEMIC_ATTACHMENT_RESOURCE = {
    'home-fun': 'home-fun-attachment',
    'study-materials': 'study-material-attachment',
    'sample-questions': 'sample-question-attachment',
}

export const LESSON_PLAN_ATTACHMENT_RESOURCE = 'lesson-plan-attachment'

export const canUseAcademicFileUploads = () => canUseAcademicsApi()

/**
 * After the academics row exists, POST each pending File to /files.
 * Returns { assets, failures } — assets only for files the server accepted.
 */
export async function uploadAcademicAttachments(collection, recordId, files = []) {
    const resourceType = ACADEMIC_ATTACHMENT_RESOURCE[collection]
    if (!resourceType || !recordId || !files.length) return { assets: [], failures: [] }
    const assets = []
    const failures = []
    for (const file of files) {
        try {
            const asset = await uploadFileWithProgress(file, {
                resourceType,
                resourceId: recordId,
            })
            assets.push(asset)
        } catch (error) {
            failures.push({
                fileName: file?.name || 'file',
                message: error?.message || 'Upload failed.',
            })
        }
    }
    return { assets, failures }
}

export const primaryAttachmentMeta = (assets = []) => {
    const first = assets[0]
    if (!first) return { fileId: null, fileName: '', fileType: 'pdf' }
    const name = String(first.original_name || '').trim()
    const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : 'pdf'
    return {
        fileId: first.id || null,
        fileName: name || '—',
        fileType: ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension)
            ? extension === 'jpeg'
                ? 'jpg'
                : extension
            : 'pdf',
    }
}
