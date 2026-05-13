import { useTranslation } from 'react-i18next'

function Responsible() {
    const { t } = useTranslation()

    return (
        <section className="min-h-screen px-6 py-14 text-white sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-5xl rounded-3xl border border-[#D4AF37]/50 bg-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-10">
                <header className="mb-10 border-b border-white/20 pb-6">
                    <p className="font-seravek text-sm uppercase tracking-[0.22em] text-[#D4AF37]">
                        Transcendance
                    </p>
                    <h1 className="font-aeonik text-4xl font-bold leading-tight sm:text-5xl">
                        {t('responsibleGaming')}
                    </h1>
                    <p className="mt-4 max-w-3xl font-seravek text-white/80">
                        {t('responsibleIntro')}
                    </p>
                </header>

                <div className="mb-8 rounded-2xl border border-[#D4AF37]/60 bg-[#D4AF37]/10 p-5 font-seravek text-white">
                    <p className="text-lg font-semibold">{t('responsibleMinorsTitle')}</p>
                    <p className="mt-2 text-white/85">
                        {t('responsibleMinorsText')}
                    </p>
                </div>

                <div className="space-y-8 font-seravek text-white/90">
                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('responsibleSection1Title')}</h2>
                        <ul className="list-disc space-y-2 pl-5 marker:text-[#D4AF37]">
                            <li>{t('responsiblePractice1')}</li>
                            <li>{t('responsiblePractice2')}</li>
                            <li>{t('responsiblePractice3')}</li>
                            <li>{t('responsiblePractice4')}</li>
                            <li>{t('responsiblePractice5')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('responsibleSection2Title')}</h2>
                        <p className="mb-2">{t('responsibleSection2Intro')}</p>
                        <ul className="list-disc space-y-2 pl-5 marker:text-[#D4AF37]">
                            <li>{t('responsibleAlert1')}</li>
                            <li>{t('responsibleAlert2')}</li>
                            <li>{t('responsibleAlert3')}</li>
                            <li>{t('responsibleAlert4')}</li>
                            <li>{t('responsibleAlert5')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('responsibleSection3Title')}</h2>
                        <p>{t('responsibleSection3Intro')}</p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 marker:text-[#D4AF37]">
                            <li>{t('responsibleTool1')}</li>
                            <li>{t('responsibleTool2')}</li>
                            <li>{t('responsibleTool3')}</li>
                            <li>{t('responsibleTool4')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('responsibleSection4Title')}</h2>
                        <p>
                            {t('responsibleSection4Text')}
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                                <p className="font-semibold text-white">{t('responsibleHelpCard1Title')}</p>
                                <p className="mt-1 text-white/80">{t('responsibleHelpCard1Phone')}</p>
                                <p className="text-sm text-white/70">{t('responsibleHelpCard1Text')}</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                                <p className="font-semibold text-white">{t('responsibleHelpCard2Title')}</p>
                                <p className="mt-1 text-white/80">{t('responsibleHelpCard2Website')}</p>
                                <p className="text-sm text-white/70">{t('responsibleHelpCard2Text')}</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="mb-3 font-aeonik text-2xl text-white">{t('responsibleSection5Title')}</h2>
                        <p>
                            {t('responsibleSection5Text')}
                        </p>
                    </section>
                </div>

                <footer className="mt-10 border-t border-white/20 pt-6 font-seravek text-sm text-white/70">
                    {t('responsibleUpdatedAt')}
                </footer>
            </div>
        </section>
    )
}

export default Responsible