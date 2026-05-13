import { Link } from 'react-router-dom'
import LanguageMenu from '../components/LanguageMenu.tsx'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'

function Home() {
    const goToGames = () => {
        document.getElementById('games-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        })
    }
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
        <>
        <div className="bg-cover bg-center" style={{ backgroundImage: "url('/header-image.jpg')" }}>
            <header className="relative flex min-h-screen flex-col overflow-hidden">
                <div className="relative z-10 flex flex-col items-center gap-4 px-4 py-4 text-white font-seravek sm:flex-row sm:items-center sm:px-8 sm:py-8">
                    <div className='flex w-full justify-center sm:flex-1 sm:justify-start'>
                        <LanguageMenu />
                    </div>
                    <Link to="/">
                        <img src="/logo-home.png" alt="Home logo" className='h-12 sm:h-16 sm:mt-5'/>
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
                                    className="group relative inline-flex h-8 min-w-30 items-center justify-center gap-2 rounded-md bg-transparent px-2 text-xs leading-none text-white font-seravek transition-colors duration-300 hover:bg-white/10 overflow-hidden sm:h-8.25 sm:min-w-34 sm:gap-2.5 sm:text-[15px]">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center text-white font-bold font-aeonik tracking-widest sm:gap-4">
                    <h1 className="max-w-4xl text-3xl leading-tight sm:text-5xl">{t('essentialgame')}</h1>
                    <p className="max-w-2xl text-lg leading-tight sm:text-2xl">{t('ritualline')}</p>
                    <button type="button" onClick={goToGames}
                        className="mt-3 h-12 w-64 rounded-[15px] border-2 border-[#D4AF37] bg-white/8 px-4 text-sm transition shadow-[0_4px_8.5px_5px_#00000040] hover:bg-white/15 sm:mt-4 sm:h-16.25 sm:w-89 sm:text-base" >
                        {t('startascension')}
                    </button>
                </div>
            </header>
        </div>

            <section id='games-section' className='pt-4 px-4 sm:pt-6 sm:px-6 lg:px-10 text-white'>
                <div className='mx-auto w-full max-w-450 mt-6 flex flex-col lg:flex-row items-stretch gap-0'>
                    {/* Carte de jeu */}
                    <div className='flex flex-1 items-center justify-center p-6 lg:p-10'>
                        <div className="relative isolate overflow-hidden w-full max-w-xl rounded-[61px] border border-[#D4AF37] bg-white/10 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-500 ease-in-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] before:content-[''] before:absolute before:top-[-50%] before:left-[-50%] before:w-[200%] before:h-[200%] before:z-2 before:bg-[linear-gradient(0deg,transparent,transparent_30%,rgba(212,175,55,1))] before:-rotate-45 before:-translate-y-full before:opacity-0 before:transition-all before:duration-500 hover:before:opacity-100 hover:before:translate-y-full">
                            <div className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(180deg,rgba(35,119,63,0.4)_0%,rgba(1,39,14,1)_100%)]" />
                            <div className='relative z-10 flex flex-col items-center gap-6 p-8 sm:p-10 text-center'>
                                <div className='flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center'>
                                    <img src="/blackjack.png" alt="blackjack-logo" className='h-full w-full object-contain' />
                                </div>
                                <h2 className='font-aeonik text-3xl sm:text-4xl leading-tight'>{t('blackjackTitle')}</h2>
                                <p className='font-seravek text-base leading-relaxed text-white/80'>{t('blackjackDescription')}</p>
                                <Link to="/Blackjack" className='inline-flex items-center justify-center border-2 border-[#D4AF37] w-56 h-12 rounded-[14px] shadow-[0_4px_8.5px_5px_#00000040] hover:bg-white/15 text-sm sm:text-base'>
                                    {t('play')}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Délimiteur */}
                    <div className='hidden lg:block w-px self-stretch bg-[#D4AF37]/60 mx-2' />
                    <div className='block lg:hidden h-px w-full bg-[#D4AF37]/60 my-2' />

                    {/* About us */}
                    <div className='flex flex-1 flex-col items-center justify-center gap-6 p-6 lg:p-10 text-center'>
                        <h1 className='font-aeonik text-3xl sm:text-4xl'>{t('transcendanceTitle')}</h1>
                        <div className='w-38 border-t border-2 border-[#D4AF37]' />
                        <p className='max-w-md leading-[1.7]'>
                            <span className='block font-seravek'>{t('aboutLine1')}</span>
                            <span className='block font-seravek mt-3'>{t('aboutLine2')}</span>
                            <span className='block font-seravek mt-3'>{t('aboutLine3')}</span>
                        </p>
                    </div>
                </div>
            </section>
        <section className='text-white'>
            <div className='mx-auto my-6 ml-7.5 mr-7.5 mt-10 sm:mt-17.5 border-t border-white' />
            <ul className='flex justify-around font-seravek pt-7.5 px-4 pb-10'>
                <li className='flex flex-col items-center gap-3 text-center'>
                    <img src="/card.svg" alt="Bank-card" />
                    <p>{t('instantPayments')}</p>
                </li>
                <li className='flex flex-col items-center gap-3 text-center'>
                    <img src="/retrait.svg" alt="time" />
                    <p>{t('withdrawal24h')}</p>
                </li>
            </ul>
        </section>
        </>
    )
}

export default Home