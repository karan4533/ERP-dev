import TeacherAddExtraClass from '../../Teacher/ExtraClass/AddExtraClass'

/** Same API-backed add/edit form as Teacher / Principal; the server limits coordinators to their grade band. */
const AddExtraClass = () => <TeacherAddExtraClass listPath='/coordinator/class/extra-class' />

export default AddExtraClass
