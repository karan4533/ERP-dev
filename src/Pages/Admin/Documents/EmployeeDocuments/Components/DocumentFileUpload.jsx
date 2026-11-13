import FileDropzone from '../../../../../Common/ui/FileDropzone'

const DocumentFileUpload = ({ fileName = '', onChange }) => (
    <FileDropzone value={fileName} onChange={onChange} valueMode='name' label='Upload employee document' acceptDocuments />
)

export default DocumentFileUpload
