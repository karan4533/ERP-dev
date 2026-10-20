import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import FuelExpenseForm from './Components/FuelExpenseForm'
import ServiceExpenseForm from './Components/ServiceExpenseForm'
import OtherExpenseForm from './Components/OtherExpenseForm'
import {
    getFuelExpenseById,
    getOtherExpenseById,
    getServiceExpenseById,
    hydrateTransportExpensesFromApi,
    upsertTransportExpense,
} from './transportExpensesData'

const ADD_CONFIG = {
    fuel: {
        title: 'Fuel Management',
        Form: FuelExpenseForm,
        prefix: 'FE-',
        getById: getFuelExpenseById,
    },
    service: {
        title: 'Service Expense Information',
        Form: ServiceExpenseForm,
        prefix: 'SE-',
        getById: getServiceExpenseById,
    },
    other: {
        title: 'Other Expense Information',
        Form: OtherExpenseForm,
        prefix: 'OE-',
        getById: getOtherExpenseById,
    },
}

const AddTransportExpense = () => {
    const { type, id } = useParams()
    const navigate = useNavigate()
    const formRef = useRef(null)
    const isEdit = Boolean(id)
    const config = ADD_CONFIG[type]
    const FormComponent = config?.Form
    const [expense, setExpense] = useState(() => (isEdit && config ? config.getById(id) : null))
    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isEdit || !config) return undefined
        let cancelled = false
        hydrateTransportExpensesFromApi().finally(() => {
            if (!cancelled) {
                setExpense(config.getById(id))
                setLoading(false)
            }
        })
        return () => {
            cancelled = true
        }
    }, [id, isEdit, config, type])

    const handleSave = async () => {
        if (!config) return
        const error = formRef.current?.validate?.()
        if (error) {
            toast.error(error)
            return
        }
        const values = formRef.current.getValues()
        setSaving(true)
        const result = await upsertTransportExpense(
            isEdit ? { ...expense, ...values, id: expense.id } : values,
            config.prefix,
        )
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Expense saved locally — API push failed.')
            return
        }
        toast.success(result?.api
            ? (isEdit ? 'Expense updated in campus API.' : 'Expense saved to campus API.')
            : (isEdit ? 'Expense updated.' : 'Expense saved.'))
        navigate('/transport-manager/transport-expenses')
    }

    if (isEdit && loading) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Loading expense…</div>
            </section>
        )
    }

    if (isEdit && !expense) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Expense not found.</div>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                {!config ? (
                    <p className='text-[#667085] text-center py-8'>Invalid expense type.</p>
                ) : (
                    <>
                        <h2 className='text-xl font-semibold text-black'>{config.title}</h2>
                        {isEdit && (
                            <p className='text-sm text-[#667085] mt-1'>Editing {expense.id}</p>
                        )}
                        <FormComponent key={expense?.id || 'new'} ref={formRef} expense={expense} />
                    </>
                )}
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/transport-expenses')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                {config && (
                    <button
                        type='button'
                        disabled={saving}
                        onClick={handleSave}
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                )}
            </div>
        </section>
    )
}

export default AddTransportExpense
