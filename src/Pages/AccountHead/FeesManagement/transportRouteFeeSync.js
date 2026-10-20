import {
    getRouteById,
    getRoutes,
    hydrateRoutesFromApi,
    upsertRoute,
} from '../../TransportManager/RouteManagement/routeManagementData'
import { deriveFeesFromYearly, formatFeeAmount, parseFeeAmount } from '../../TransportManager/RouteManagement/feeHelpers'

/** Map fee-structure frequency → which route tariff field is the “primary” amount. */
export function amountFieldForFrequency(frequency) {
    switch (String(frequency || '').toUpperCase()) {
        case 'MONTHLY':
            return 'monthlyFees'
        case 'QUARTERLY':
            return 'quarterlyFees'
        case 'HALF_YEARLY':
            return 'halfYearlyFees'
        case 'ONE_TIME':
        case 'TERM_WISE':
        case 'CUSTOM_INSTALLMENT':
        default:
            return 'yearlyFees'
    }
}

export function routeAmountForFrequency(route, frequency) {
    if (!route) return ''
    const field = amountFieldForFrequency(frequency)
    return route[field] || route.yearlyFees || ''
}

/**
 * Push Define Fee Structure amount onto the selected transport route (all stops inherit if empty).
 */
export async function syncTransportFeeAmountToRoute({
    routeId,
    amount,
    frequency = 'ONE_TIME',
} = {}) {
    const id = String(routeId || '').trim()
    if (!id) return { success: false, message: 'Route is required.' }
    const numeric = Number(amount) || parseFeeAmount(amount) || 0
    if (!(numeric > 0)) return { success: false, message: 'Amount is required.' }

    await hydrateRoutesFromApi()
    const route = getRouteById(id)
    if (!route) return { success: false, message: 'Route not found in Transport Manager.' }

    const sample = route.yearlyFees || '₹0'
    const label = formatFeeAmount(numeric, sample.includes('₹') ? sample : '₹0')
    const field = amountFieldForFrequency(frequency)

    let nextFees = {
        yearlyFees: route.yearlyFees || '',
        halfYearlyFees: route.halfYearlyFees || '',
        quarterlyFees: route.quarterlyFees || '',
        monthlyFees: route.monthlyFees || '',
    }

    if (field === 'yearlyFees') {
        nextFees = {
            yearlyFees: label,
            ...deriveFeesFromYearly(label),
        }
    } else {
        nextFees[field] = label
        // Keep yearly in sync as the annual equivalent when possible.
        if (field === 'monthlyFees') {
            nextFees.yearlyFees = formatFeeAmount(numeric * 12, label)
            Object.assign(nextFees, deriveFeesFromYearly(nextFees.yearlyFees), { monthlyFees: label })
        } else if (field === 'quarterlyFees') {
            nextFees.yearlyFees = formatFeeAmount(numeric * 4, label)
            Object.assign(nextFees, deriveFeesFromYearly(nextFees.yearlyFees), { quarterlyFees: label })
        } else if (field === 'halfYearlyFees') {
            nextFees.yearlyFees = formatFeeAmount(numeric * 2, label)
            Object.assign(nextFees, deriveFeesFromYearly(nextFees.yearlyFees), { halfYearlyFees: label })
        }
    }

    const stops = Array.isArray(route.stops)
        ? route.stops.map((stop) => ({
            ...stop,
            yearlyFees: stop.yearlyFees || nextFees.yearlyFees,
            halfYearlyFees: stop.halfYearlyFees || nextFees.halfYearlyFees,
            quarterlyFees: stop.quarterlyFees || nextFees.quarterlyFees,
            monthlyFees: stop.monthlyFees || nextFees.monthlyFees,
        }))
        : []

    const result = await upsertRoute({
        ...route,
        ...nextFees,
        stops,
        financeFeeSyncedAt: new Date().toISOString(),
    })

    return {
        ...result,
        success: result?.success !== false,
        routeName: route.routeName || route.id,
    }
}

export async function loadTransportRouteOptions() {
    await hydrateRoutesFromApi()
    return getRoutes().map((route) => ({
        id: route.id,
        label: route.routeName || route.id,
        yearlyFees: route.yearlyFees || '',
        halfYearlyFees: route.halfYearlyFees || '',
        quarterlyFees: route.quarterlyFees || '',
        monthlyFees: route.monthlyFees || '',
    }))
}
