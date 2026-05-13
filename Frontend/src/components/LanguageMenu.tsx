import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

type SiteLanguage = 'fr' | 'en' | 'es'

const STORAGE_KEY = 'site-language'
const MENU_LANGUAGES: Array<{ code: SiteLanguage; labelKey: string }> = [
    { code: 'fr', labelKey: 'languageFrench' },
    { code: 'en', labelKey: 'languageEnglish' },
    { code: 'es', labelKey: 'languageSpanish' },
]

const isSiteLanguage = (value: string | null): value is SiteLanguage => {
    return value === 'fr' || value === 'en' || value === 'es'
}

const getInitialLanguage = (): SiteLanguage => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        return isSiteLanguage(stored) ? stored : 'fr'
    } catch {
        return 'fr'
    }
}

const persistLanguage = (language: SiteLanguage) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, language)
    } catch {
        //
    }
}

function FlagIcon({ language }: { language: SiteLanguage }) {
    if (language === 'en') {
        return (
            <span className="relative inline-flex h-5 w-8 overflow-hidden rounded-xs border border-white/40 bg-white align-middle">
                <span className="absolute left-1/2 top-0 h-full w-[24%] -translate-x-1/2 bg-[#C8102E]" />
                <span className="absolute left-0 top-1/2 h-[28%] w-full -translate-y-1/2 bg-[#C8102E]" />
            </span>
        )
    }

    if (language === 'es') {
        return (
            <span className="inline-flex h-5 w-8 flex-col overflow-hidden rounded-xs border border-white/40 align-middle">
                <span className="h-1/4 w-full bg-[#AA151B]" />
                <span className="h-2/4 w-full bg-[#F1BF00]" />
                <span className="h-1/4 w-full bg-[#AA151B]" />
            </span>
        )
    }

    return (
        <span className="inline-flex h-5 w-8 overflow-hidden rounded-xs border border-white/40 align-middle">
            <span className="h-full w-1/3 bg-[#0055A4]" />
            <span className="h-full w-1/3 bg-white" />
            <span className="h-full w-1/3 bg-[#EF4135]" />
        </span>
    )
}

function LanguageMenu() {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState<SiteLanguage>(getInitialLanguage)
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target
            if (!(target instanceof Node)) {
                return
            }

            if (!wrapperRef.current?.contains(target)) {
                setIsOpen(false)
            }
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)

        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [])

    useEffect(() => {
        document.documentElement.lang = selectedLanguage
    }, [selectedLanguage])

    const selectLanguage = (language: SiteLanguage) => {
        setSelectedLanguage(language)
        persistLanguage(language)
        void i18n.changeLanguage(language)
        setIsOpen(false)
    }

    return (
        <div ref={wrapperRef} className="relative inline-flex items-center">
            <button type="button" onClick={() => setIsOpen((previous) => !previous)} aria-haspopup="menu" aria-expanded={isOpen}
                aria-label={t('languageMenu')} title={t('language')}
                className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/10">
                <FlagIcon language={selectedLanguage} />
                <span className="text-[11px] font-semibold uppercase tracking-wider">{selectedLanguage}</span>
                <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                    ▼
                </span>
            </button>

            {isOpen && (
                <ul role="menu" aria-label={t('selectLanguage')}
                    className="absolute left-0 top-full z-30 mt-2 min-w-37.5 rounded-lg border border-white/25 bg-black/80 p-1 text-sm text-white shadow-lg backdrop-blur-md">
                    {MENU_LANGUAGES.map((language) => {
                        const isSelected = selectedLanguage === language.code
                        return (
                            <li key={language.code}>
                                <button type="button" role="menuitem" onClick={() => selectLanguage(language.code)}
                                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${isSelected ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                                    <span>{t(language.labelKey)}</span>
                                    <FlagIcon language={language.code} />
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

export default LanguageMenu
