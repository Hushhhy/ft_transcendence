import { Link, useNavigate } from 'react-router-dom'
import LanguageMenu from './LanguageMenu.tsx'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'

function TopBar() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)
    let displayedBalance = t('balance')
    let profileLinkPath = '/Login'
    let profileLabel = t('login')

    if (user) {
        displayedBalance = `${user.balance.toFixed(2)} EUR`
        profileLinkPath = '/Account'
        profileLabel = user.username
    }

    return (
        <div className="relative z-10 flex flex-col items-center gap-4 px-4 py-4 text-white font-seravek sm:flex-row sm:items-center sm:px-8 sm:py-8">
            <div className="flex w-full items-center justify-center gap-3 sm:flex-1 sm:justify-start sm:gap-4">
                <button type="button" onClick={() => navigate(-1)} aria-label="Retour" title="Retour"
                    className="inline-flex h-9 w-9 items-center justify-center text-white/50 transition duration-200 hover:text-white sm:h-10 sm:w-10">
                    <svg width="17" height="34" viewBox="0 0 17 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M12 4L4 17L12 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <LanguageMenu />
            </div>

            <Link to="/">
                <img src="/logo-blanc.png" alt="Home logo" className='h-10 sm:h-16 sm:mt-5'/>
            </Link>

            <ul className="flex w-full items-center justify-center gap-4 sm:flex-1 sm:justify-end sm:gap-6">
                <li className='inline-flex items-center gap-1'>
                    <Link to={profileLinkPath} className='group inline-flex items-center gap-1 text-sm sm:text-base'>
                        <img src="/profile.svg" alt="profile" className="h-4 w-4" />
                        <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-px after:h-px after:w-full after:bg-white after:origin-left after:scale-x-0 after:transition-transform after:duration-300 group-hover:after:scale-x-100">
                            {profileLabel}
                        </span>
                    </Link>
                </li>
                <li>
                    <Link to="/Deposit"
                        className="group relative inline-flex h-8 min-w-30 items-center justify-center gap-2 rounded-md bg-transparent px-2 text-xs leading-none text-white font-seravek transition-colors duration-300 hover:bg-white/10 overflow-hidden sm:h-8.5 sm:min-w-34 sm:gap-2.5 sm:text-[15px]">
                        <img src="/balance.svg" alt="" aria-hidden="true" className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        <span className="whitespace-nowrap">{displayedBalance}</span>
                        <span className="pointer-events-none absolute inset-0 rounded-md">
                            <span className="absolute left-0 top-0 h-px w-0 bg-white/50 transition-[width] duration-150 group-hover:w-full" />
                            <span className="absolute right-0 top-0 w-px h-0 bg-white/50 transition-[height] duration-150 delay-150 group-hover:h-full" />
                            <span className="absolute right-0 bottom-0 h-px w-0 bg-white/50 transition-[width] duration-150 delay-300 group-hover:w-full" />
                            <span className="absolute left-0 bottom-0 w-px h-0 bg-white/50 transition-[height] duration-150 delay-450 group-hover:h-full" />
                        </span>
                    </Link>
                </li>
            </ul>
        </div>
    )
}

export default TopBar