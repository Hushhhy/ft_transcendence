import { useTranslation } from 'react-i18next'

function Legal() {
    const { t } = useTranslation()

    return (
        <section className="min-h-screen px-6 py-14 text-white sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-5xl rounded-3xl border border-[#D4AF37]/50 bg-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-10">
                <header className="mb-10 border-b border-white/20 pb-6">
                    <p className="font-seravek text-sm uppercase tracking-[0.22em] text-[#D4AF37]">
                        Transcendance
                    </p>
                    <h1 className="font-aeonik text-4xl font-bold leading-tight sm:text-5xl">
                        {t('legalNotice')}
                    </h1>
                    <p className="mt-4 max-w-3xl font-seravek text-white/80">
                        {t('legalIntro')}
                    </p>
                </header>

                <div className="space-y-8 font-seravek text-white/90">
                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('legalSection1Title')}</h2>
                        <p>{t('legalProjectName')}</p>
                        <p>{t('legalAddress')}</p>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('legalSection2Title')}</h2>
                        <p>{t('legalLogins')}</p>
                        <p>{t('legalContact')}</p>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('legalSection3Title')}</h2>
                        <p>{t('legalHost')}</p>
                        <p>{t('legalHostAddress')}</p>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('legalSection4Title')}</h2>
                        <p>
                            {t('legalSection4Text')}
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('legalSection5Title')}</h2>
                        <p>
                            {t('legalSection5Text1')}
                        </p>
                        <p className="mt-2">
                            {t('legalSection5Text2')}
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('legalSection6Title')}</h2>
                        <p>
                            {t('legalSection6Text')}
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('legalSection7Title')}</h2>
                        <p>
                            {t('legalSection7Text')}
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('legalSection8Title')}</h2>
                        <p>
                            {t('legalSection8Text')}
                        </p>
                    </section>
                </div>

                <footer className="mt-10 border-t border-white/20 pt-6 font-seravek text-sm text-white/70">
                    {t('legalUpdatedAt')}
                </footer>
            </div>
        </section>
    )
}

export default Legal