import CanteenOrderWorkspace from '../../../Common/operations/CanteenOrderWorkspace'
import { MENU_OPTIONS, RFID_CUSTOMERS } from './addOrderData'

const AddOrder = () => <CanteenOrderWorkspace backPath='/canteen-manager/orders' storageKey='schoolerp:canteen:order-draft' customers={RFID_CUSTOMERS} menuItems={MENU_OPTIONS} />

export default AddOrder
