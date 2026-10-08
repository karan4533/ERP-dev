import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FuelExpenseForm from './Components/FuelExpenseForm'
import ServiceExpenseForm from './Components/ServiceExpenseForm'
import OtherExpenseForm from './Components/OtherExpenseForm'

const ADD_CONFIG = {
    fuel: {
        title: 'Fuel Management',
        Form: FuelExpenseForm,
    },
    service: {
        title: 'Service Expense Information',
        Form: ServiceExpenseForm,
    },
    other: {
        title: 'Other Expense Information',
        Form: OtherExpenseForm,
    },
}

const AddTransportExpense = () => {
    const { type } = useParams()
    const navigate = useNavigate()
    const config = ADD_CONFIG[type]
    const FormComponent = config?.Form

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                {!config ? (
                    <p className='text-[#667085] text-center py-8'>Invalid expense type.</p>
                ) : (
                    <>
                        <h2 className='text-xl font-semibold text-black'>{config.title}</h2>
                        <FormComponent />
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
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                    >
                        Save Changes
                    </button>
                )}
            </div>
        </section>
    )
}

export default AddTransportExpense
