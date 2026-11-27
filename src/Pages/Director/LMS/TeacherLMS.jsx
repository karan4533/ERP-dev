import HomeFun from '../../Teacher/StudentDeliverables/HomeFun/HomeFun'

const ROUTE_BASE = '/director/lms/teacher-lms'

/** Oversees the same Teacher Home Fun SoT as Principal (localStorage; no deliverables REST). */
const TeacherLMS = () => <HomeFun routeBase={ROUTE_BASE} viewMode='teacher' />

export default TeacherLMS
