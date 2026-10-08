import React, { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import select_profile_img from '../../assets/images/select-profile-img.png'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PROFILE_BY_ROLE } from './profileOptions'
import { ADMIN_PROFILE, SUPER_ADMIN_PROFILE, getModuleById, ROLE_MODULES } from './roleModuleConfig'
import AuthHeader from './AuthHeader'

const SelectProfile = () => {
    const navigate = useNavigate()
    const { setPendingRole } = useAuth()
    const [activeModuleId, setActiveModuleId] = useState(null)

    const activeModule = useMemo(
        () => (activeModuleId ? getModuleById(activeModuleId) : null),
        [activeModuleId]
    )

    const moduleProfiles = useMemo(() => {
        if (!activeModule) return []
        return activeModule.roles
            .map((role) => PROFILE_BY_ROLE[role])
            .filter(Boolean)
    }, [activeModule])

    const handleSelect = (role) => {
        setPendingRole(role)
        navigate('/signin')
    }

    const SuperAdminIcon = SUPER_ADMIN_PROFILE.icon
    const AdminIcon = ADMIN_PROFILE.icon

    return (
        <div className='relative w-full min-h-screen font-poppins flex flex-col'>
            <AuthHeader />

            <div className='relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2'>
                <div className='flex justify-center items-center md:p-6 p-2'>
                    <div className='w-full max-w-lg flex flex-col gap-y-6 py-8'>
                        {!activeModule ? (
                            <>
                                <div>
                                    <h1 className='text-4xl font-semibold text-[#313131] md:text-left text-center'>
                                        Select Your Role
                                    </h1>
                                    <p className='text-base font-medium text-[#313131]/70 mt-4 md:text-left text-center'>
                                        Choose Super Admin, Admin, or select a module to find your role
                                    </p>
                                </div>

                                <button
                                    type='button'
                                    onClick={() => handleSelect(SUPER_ADMIN_PROFILE.roles[0])}
                                    className='w-full flex items-center gap-4 bg-white rounded-2xl shadow-md border border-[#E8ECFF] px-5 py-4 text-left hover:border-[#515DEF] hover:shadow-lg transition-all duration-200 cursor-pointer group'
                                >
                                    <span className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#EDEEF5] text-[#515DEF] group-hover:bg-[#515DEF] group-hover:text-white transition-colors'>
                                        <SuperAdminIcon size={24} />
                                    </span>
                                    <span className='flex-1 min-w-0'>
                                        <span className='block text-lg font-semibold text-[#313131]'>
                                            {SUPER_ADMIN_PROFILE.title}
                                        </span>
                                        <span className='block text-sm font-medium text-[#313131]/60 mt-0.5'>
                                            {SUPER_ADMIN_PROFILE.description}
                                        </span>
                                    </span>
                                    <ChevronRight size={20} className='shrink-0 text-[#515DEF]' />
                                </button>

                                <button
                                    type='button'
                                    onClick={() => handleSelect(ADMIN_PROFILE.roles[0])}
                                    className='w-full flex items-center gap-4 bg-white rounded-2xl shadow-md border border-[#E8ECFF] px-5 py-4 text-left hover:border-[#515DEF] hover:shadow-lg transition-all duration-200 cursor-pointer group'
                                >
                                    <span className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#EDEEF5] text-[#515DEF] group-hover:bg-[#515DEF] group-hover:text-white transition-colors'>
                                        <AdminIcon size={24} />
                                    </span>
                                    <span className='flex-1 min-w-0'>
                                        <span className='block text-lg font-semibold text-[#313131]'>
                                            {ADMIN_PROFILE.title}
                                        </span>
                                        <span className='block text-sm font-medium text-[#313131]/60 mt-0.5'>
                                            {ADMIN_PROFILE.description}
                                        </span>
                                    </span>
                                    <ChevronRight size={20} className='shrink-0 text-[#515DEF]' />
                                </button>

                                <div className='flex flex-col gap-y-3'>
                                    {ROLE_MODULES.map((module) => {
                                        const ModuleIcon = module.icon
                                        return (
                                            <button
                                                key={module.id}
                                                type='button'
                                                onClick={() => setActiveModuleId(module.id)}
                                                className='w-full flex items-center gap-4 bg-white rounded-2xl shadow-md border border-[#E8ECFF] px-5 py-4 text-left hover:border-[#515DEF] hover:shadow-lg transition-all duration-200 cursor-pointer group'
                                            >
                                                <span className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#EDEEF5] text-[#515DEF] group-hover:bg-[#515DEF] group-hover:text-white transition-colors'>
                                                    <ModuleIcon size={24} />
                                                </span>
                                                <span className='flex-1 min-w-0'>
                                                    <span className='block text-lg font-semibold text-[#313131]'>
                                                        {module.title}
                                                    </span>
                                                    <span className='block text-sm font-medium text-[#313131]/60 mt-0.5'>
                                                        {module.description}
                                                    </span>
                                                </span>
                                                <span className='flex items-center gap-2 shrink-0'>
                                                    <span className='inline-flex min-w-8 justify-center rounded-full bg-[#515DEF]/10 px-2.5 py-1 text-sm font-semibold text-[#515DEF]'>
                                                        {module.roles.length}
                                                    </span>
                                                    <ChevronRight size={20} className='text-[#515DEF]' />
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <>
                                <button
                                    type='button'
                                    onClick={() => setActiveModuleId(null)}
                                    className='inline-flex items-center gap-2 self-start text-sm font-medium text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </button>

                                <div>
                                    <p className='text-sm font-semibold uppercase tracking-wide text-[#515DEF] md:text-left text-center'>
                                        {activeModule.title}
                                    </p>
                                    <h1 className='text-3xl font-semibold text-[#313131] mt-2 md:text-left text-center'>
                                        Select your role
                                    </h1>
                                    <p className='text-base font-medium text-[#313131]/70 mt-2 md:text-left text-center'>
                                        {activeModule.description}
                                    </p>
                                </div>

                                <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6'>
                                    {moduleProfiles.map((profile) => (
                                        <button
                                            key={profile.role}
                                            type='button'
                                            onClick={() => handleSelect(profile.role)}
                                            className='flex flex-col gap-y-2 items-center rounded-2xl border border-transparent bg-white/80 px-3 py-4 shadow-sm hover:border-[#515DEF] hover:shadow-md transition-all duration-200 cursor-pointer group'
                                        >
                                            <img
                                                src={profile.image}
                                                className={`h-20 w-20 sm:h-24 sm:w-24 object-contain ${profile.imageClassName ?? ''}`}
                                                alt={profile.alt}
                                            />
                                            <p className='text-sm sm:text-base font-medium text-black text-center leading-snug group-hover:text-[#515DEF] transition-colors'>
                                                {profile.label}
                                            </p>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type='button'
                                    onClick={() => setActiveModuleId(null)}
                                    className='inline-flex items-center justify-center gap-2 self-center text-sm font-medium text-[#515DEF] hover:underline cursor-pointer mt-2'
                                >
                                    <ArrowRight size={16} className='rotate-180' />
                                    Back to modules
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className='hidden md:flex justify-center items-center p-6'>
                    <img src={select_profile_img} className='w-full max-w-md' alt='select_profile_img' />
                </div>
            </div>
        </div>
    )
}

export default SelectProfile
