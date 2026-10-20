import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import StudentTransportForm from './Components/StudentTransportForm'
import {
    getStudentTransportById,
    hydrateStudentTransportsFromApi,
    upsertStudentTransport,
} from './studentTransportData'
import { postStudentTransportFeeToFinance } from './transportFeeFinanceBridge'

const AddStudentTransport = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = Boolean(id)
    const formRef = useRef(null)
    const [record, setRecord] = useState(() => (id ? getStudentTransportById(id) : null))
    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isEdit) return undefined
        let cancelled = false
        hydrateStudentTransportsFromApi().finally(() => {
            if (!cancelled) {
                setRecord(getStudentTransportById(id))
                setLoading(false)
            }
        })
        return () => {
            cancelled = true
        }
    }, [id, isEdit])

    const handleSave = async () => {
        const error = formRef.current?.validate?.()
        if (error) {
            toast.error(error)
            return
        }
        const values = formRef.current.getValues()
        setSaving(true)
        const payload = isEdit ? { ...record, ...values, id: record.id } : values
        const result = await upsertStudentTransport(payload)
        if (result?.success === false) {
            setSaving(false)
            toast.error(result.message || 'Record saved locally — API push failed.')
            return
        }
        const savedRecord = result?.record || payload
        const billing = await postStudentTransportFeeToFinance(savedRecord)
        setSaving(false)
        if (!billing?.success) {
            toast.warning(billing?.message || 'Transport saved, but fee bill was not posted to Finance.')
        } else if (billing.warning) {
            toast.warning(billing.message)
        } else {
            toast.success(
                billing.api
                    ? `Transport saved — ${billing.installmentsCreated || 0} fee installment(s) posted to Finance.`
                    : (result?.api
                        ? 'Student transport saved. Fee bill staged for Fee Collection.'
                        : 'Student transport saved with fee bill for Fee Collection.'),
            )
        }
        navigate('/transport-manager/student-transport')
    }

    if (isEdit && loading) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Loading record…</div>
            </section>
        )
    }

    if (isEdit && !record) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Record not found.</div>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Student Transport Information</h2>
                {isEdit && (
                    <p className='text-sm text-[#667085] mt-1'>Editing {record.id}</p>
                )}
                <StudentTransportForm key={record?.id || 'new'} ref={formRef} record={record} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/student-transport')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddStudentTransport
