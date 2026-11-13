import { useParams } from 'react-router-dom'
import CanteenMenuDetail from '../../../Common/operations/CanteenMenuDetail'
import { MENU_ITEMS } from './menuData'

const ViewMenuItem = () => {
    const { id } = useParams()
    const item = MENU_ITEMS.find((entry) => entry.menuId === id)
    return <CanteenMenuDetail item={item} backPath='/canteen-manager/menu-management' />
}

export default ViewMenuItem
