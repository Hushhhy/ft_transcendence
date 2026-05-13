import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router-dom'
import { useLogin } from '../features/auth/useLogin'

function Login() {
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)

    const {
        loginErrors,
        registerErrors,
        loginServerMessage,
        registerServerMessage,
        isLoginLoading,
        isRegisterLoading,
        isLoginPasswordVisible,
        setIsLoginPasswordVisible,
        isRegisterPasswordVisible,
        setIsRegisterPasswordVisible,
        isConfirmPasswordVisible,
        setIsConfirmPasswordVisible,
        maxBirthDate,
        clearLoginFieldError,
        clearRegisterFieldError,
        handleLoginSubmit,
        handleRegisterSubmit,
    } = useLogin()

    let loginButtonLabel = t('loginButton')
    if (isLoginLoading) loginButtonLabel = '...'

    let registerButtonLabel = t('signupButton')
    if (isRegisterLoading) registerButtonLabel = '...'

    let loginPasswordInputType = 'password'
    if (isLoginPasswordVisible) loginPasswordInputType = 'text'
    let loginPasswordAriaLabel = 'Afficher le mot de passe'
    if (isLoginPasswordVisible) loginPasswordAriaLabel = 'Masquer le mot de passe'

    let registerPasswordInputType = 'password'
    if (isRegisterPasswordVisible) registerPasswordInputType = 'text'
    let registerPasswordAriaLabel = 'Afficher le mot de passe'
    if (isRegisterPasswordVisible) registerPasswordAriaLabel = 'Masquer le mot de passe'

    let confirmPasswordInputType = 'password'
    if (isConfirmPasswordVisible) confirmPasswordInputType = 'text'
    let confirmPasswordAriaLabel = 'Afficher le mot de passe'
    if (isConfirmPasswordVisible) confirmPasswordAriaLabel = 'Masquer le mot de passe'

    if (user) {
        return <Navigate to="/Account" replace />
    }

    return (
        <section className="mx-auto w-full max-w-7xl px-6 pb-14 pt-8 text-white md:px-10 lg:px-16">
            <div className="grid gap-12 md:grid-cols-[1fr_auto_1fr] md:gap-10 lg:gap-16">
                <article>
                    <header className="mb-10 text-center md:mb-14">
                        <h1 className="font-aeonik text-[2rem]">{t('loginTitle')}</h1>
                        <p className="font-seravek mt-2 text-sm text-white/70">
                            {t('loginSubtitle')}
                        </p>
                    </header>
                    <form action="" method="post" noValidate onSubmit={handleLoginSubmit} className="font-seravek mx-auto flex w-full max-w-97.5 flex-col gap-5 text-white/85">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="login-email" className="text-[1.06rem] text-white/80">Email</label>
                            <input type="email" name="email" id="login-email" placeholder="ex. johndoe@gmail.com" onInput={() => clearLoginFieldError('email')}
                                className="h-11 rounded-xl border border-white/55 bg-transparent px-5 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                required />
                            <p className="min-h-4 text-xs text-red-300">{loginErrors.email || ''}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="login-mdp" className="text-[1.06rem] text-white/80">{t('passwordLabel')}</label>
                            <div className="relative">
                                <input type={loginPasswordInputType} name="password" id="login-mdp" placeholder={'********'} onInput={() => clearLoginFieldError('password')}
                                    className="h-11 w-full rounded-xl border border-white/55 bg-transparent px-5 pr-12 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                    required />
                                <button
                                    type="button"
                                    onClick={() => setIsLoginPasswordVisible((prev) => !prev)}
                                    aria-label={loginPasswordAriaLabel}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path d="M2 12C3.9 7.8 7.5 5 12 5C16.5 5 20.1 7.8 22 12C20.1 16.2 16.5 19 12 19C7.5 19 3.9 16.2 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                                        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                                        {isLoginPasswordVisible && <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
                                    </svg>
                                </button>
                            </div>
                            <Link to="/ForgotPwd" className="justify-self-center">
                                <p className='text-xs text-blue-500 underline cursor-pointer'>Mot de passe oublié</p>
                            </Link>
                            <p className="min-h-4 text-xs text-red-300">{loginErrors.password || ''}</p>
                        </div>
                        <label htmlFor="login-human-check" className="mt-1 flex cursor-pointer items-center gap-3 text-sm text-white/75">
                            <input id="login-human-check" name="loginHumanCheck" type="checkbox" onChange={() => clearLoginFieldError('loginHumanCheck')} className="peer sr-only" required />
                            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/55 bg-[#0b1a22] transition peer-checked:border-[#d4af37] peer-checked:bg-[#d4af37]/15 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#d4af37]">
                                <span className="text-sm font-bold text-[#d4af37] opacity-0 transition peer-checked:opacity-100">✓</span>
                            </span>
                            <span>{t('notRobotLabel')}</span>
                        </label>
                        <p className="-mt-3 min-h-4 text-xs text-red-300">{loginErrors.loginHumanCheck || ''}</p>
                        <button type="submit" disabled={isLoginLoading}
                            className="mx-auto mt-2 h-12 w-full max-w-52.5 rounded-xl border-2 border-[#d4af37] bg-transparent font-aeonik text-lg font-bold text-white transition hover:bg-[#d4af37]/10">
                            {loginButtonLabel}
                        </button>
                        <p className="min-h-4 text-center text-sm text-[#d4af37]">{loginServerMessage}</p>
                    </form>
                </article>
                <div className="mx-auto hidden h-155 w-px bg-[#d4af37]/80 md:block" aria-hidden="true" />
                <article>
                    <header className="mb-10 text-center md:mb-14">
                        <h2 className="font-aeonik text-[2rem] ">{t('signupTitle')}</h2>
                        <p className="font-seravek mt-2 text-sm text-white/70">{t('signupSubtitle')}</p>
                    </header>
                    <form action="" method="post" noValidate onSubmit={handleRegisterSubmit} className="font-seravek mx-auto flex w-full max-w-97.5 flex-col gap-5 text-white/85">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="username" className="text-[1.06rem] text-white/80">{t('usernameLabel')}</label>
                            <input type="text" name="username" id="username" placeholder="ex. john_doe" onInput={() => clearRegisterFieldError('username')}
                                className="h-11 rounded-xl border border-white/55 bg-transparent px-5 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                required />
                            <p className="min-h-4 text-xs text-red-300">{registerErrors.username || ''}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="birthDate" className="text-[1.06rem] text-white/80">{t('birthDateLabel')}</label>
                            <input type="date" name="birthDate" id="birthDate" onInput={() => clearRegisterFieldError('birthDate')} max={maxBirthDate}
                                className="h-11 rounded-xl border border-white/55 bg-transparent px-5 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                required />
                            <p className="min-h-4 text-xs text-red-300">{registerErrors.birthDate || ''}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="reg-email" className="text-[1.06rem] text-white/80">Email</label>
                            <input type="email" name="email" id="reg-email" placeholder="ex. johndoe@gmail.com" onInput={() => clearRegisterFieldError('email')}
                                className="h-11 rounded-xl border border-white/55 bg-transparent px-5 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                required />
                            <p className="min-h-4 text-xs text-red-300">{registerErrors.email || ''}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="reg-mdp" className="text-[1.06rem] text-white/80">{t('passwordLabel')}</label>
                            <div className="relative">
                                <input type={registerPasswordInputType} name="password" id="reg-mdp" placeholder={'********'} onInput={() => clearRegisterFieldError('password')}
                                    className="peer h-11 w-full rounded-xl border border-white/55 bg-transparent px-5 pr-12 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                    required />
                                <button
                                    type="button"
                                    onClick={() => setIsRegisterPasswordVisible((prev) => !prev)}
                                    aria-label={registerPasswordAriaLabel}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path d="M2 12C3.9 7.8 7.5 5 12 5C16.5 5 20.1 7.8 22 12C20.1 16.2 16.5 19 12 19C7.5 19 3.9 16.2 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                                        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                                        {isRegisterPasswordVisible && <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
                                    </svg>
                                </button>
                            </div>
                            <p className="min-h-4 text-xs text-red-300">{registerErrors.password || ''}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="confirm-mdp" className="text-[1.06rem] text-white/80">{t('confirmPasswordLabel')}</label>
                            <div className="relative">
                                <input type={confirmPasswordInputType} name="confirmPassword" id="confirm-mdp" placeholder="********" onInput={() => clearRegisterFieldError('confirmPassword')}
                                    className="h-11 w-full rounded-xl border border-white/55 bg-transparent px-5 pr-12 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                    required />
                                <button
                                    type="button"
                                    onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                                    aria-label={confirmPasswordAriaLabel}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path d="M2 12C3.9 7.8 7.5 5 12 5C16.5 5 20.1 7.8 22 12C20.1 16.2 16.5 19 12 19C7.5 19 3.9 16.2 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                                        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                                        {isConfirmPasswordVisible && <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
                                    </svg>
                                </button>
                            </div>
                            <p className="min-h-4 text-xs text-red-300">{registerErrors.confirmPassword || ''}</p>
                        </div>
                        <label htmlFor="register-human-check" className="mt-1 flex cursor-pointer items-center gap-3 text-sm text-white/75">
                            <input id="register-human-check" name="registerHumanCheck" type="checkbox" onChange={() => clearRegisterFieldError('registerHumanCheck')} className="peer sr-only" required />
                            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/55 bg-[#0b1a22] transition peer-checked:border-[#d4af37] peer-checked:bg-[#d4af37]/15 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#d4af37]">
                                <span className="text-sm font-bold text-[#d4af37] opacity-0 transition peer-checked:opacity-100">✓</span>
                            </span>
                            <span>{t('notRobotLabel')}</span>
                        </label>
                        <p className="-mt-3 min-h-4 text-xs text-red-300">{registerErrors.registerHumanCheck || ''}</p>
                        <button type="submit" disabled={isRegisterLoading}
                            className="mx-auto mt-2 h-12 w-full max-w-52.5 rounded-xl border-2 border-[#d4af37] bg-transparent font-aeonik text-lg font-bold text-white transition hover:bg-[#d4af37]/10">
                            {registerButtonLabel}
                        </button>
                        <p className="min-h-4 text-center text-sm text-[#d4af37]">{registerServerMessage}</p>
                    </form>
                </article>
            </div>
        </section>
    )
}

export default Login
