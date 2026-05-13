import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function BottomBar() {
    const { t } = useTranslation()

    return (
        <>
            <div className='mx-7.5 mt-10 border-t border-white' />
            <div className='font-seravek text-white flex flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-20'>
                <div className='flex flex-wrap items-center gap-6 sm:gap-30'>
                    <Link to="/Legal" className='group'>
                        <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-px after:h-px after:w-full after:bg-white after:origin-left after:scale-x-0 after:transition-transform after:duration-300 group-hover:after:scale-x-100">
                            {t('legalNotice')}
                        </span>
                    </Link>
                    <Link to="/Responsible" className='group'>
                        <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-px after:h-px after:w-full after:bg-white after:origin-left after:scale-x-0 after:transition-transform after:duration-300 group-hover:after:scale-x-100">
                            {t('responsibleGaming')}
                        </span>
                    </Link>
                </div>
                <img src="/logo-18.svg" alt={t('eighteenPlusAlt')} className="shrink-0" />
            </div>
        </>
    )
}

export default BottomBar