import FileDropzone from '../../../../../Common/ui/FileDropzone'

const ProfileUpload = ({ value = '', onChange }) => <FileDropzone value={value} onChange={onChange} label='Upload student photo' />

export default ProfileUpload
