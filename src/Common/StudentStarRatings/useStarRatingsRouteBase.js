import { useLocation } from 'react-router-dom'
import { getRouteBaseFromPath } from './studentStarRatingsData'

export const useStarRatingsRouteBase = () => {
    const { pathname } = useLocation()
    return getRouteBaseFromPath(pathname)
}
