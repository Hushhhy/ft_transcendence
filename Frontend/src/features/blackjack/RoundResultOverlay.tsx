import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export type RoundOutcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust'

type Props = {
    outcome: RoundOutcome
    onDone: () => void
    displayDurationMs?: number
    fadeDelayMs?: number
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    alpha: number
    color: string
    size: number
}

interface Burst {
    particles: Particle[]
}

function launchFireworks(canvas: HTMLCanvasElement, colors: string[], duration: number) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return () => {}

    const bursts: Burst[] = []
    let animId: number
    const start = performance.now()

    const spawnBurst = () => {
        const x = 0.1 * canvas.width + Math.random() * 0.8 * canvas.width
        const y = 0.1 * canvas.height + Math.random() * 0.55 * canvas.height
        const color = colors[Math.floor(Math.random() * colors.length)]
        const count = 80 + Math.floor(Math.random() * 60)
        const particles: Particle[] = []
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3
            const speed = 2 + Math.random() * 5
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color,
                size: 2 + Math.random() * 2,
            })
        }
        bursts.push({ particles })
    }

    spawnBurst()
    spawnBurst()
    const spawnInterval = setInterval(spawnBurst, 350)

    const tick = () => {
        const elapsed = performance.now() - start
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (const burst of bursts) {
            for (const p of burst.particles) {
                p.x += p.vx
                p.y += p.vy
                p.vy += 0.09
                p.vx *= 0.98
                p.alpha -= 0.015

                if (p.alpha <= 0) continue
                ctx.globalAlpha = p.alpha
                ctx.fillStyle = p.color
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        ctx.globalAlpha = 1

        if (elapsed < duration) {
            animId = requestAnimationFrame(tick)
        } else {
            clearInterval(spawnInterval)
        }
    }

    animId = requestAnimationFrame(tick)

    return () => {
        cancelAnimationFrame(animId)
        clearInterval(spawnInterval)
    }
}

const OUTCOME_CONFIG: Record<RoundOutcome, {
    colors: string[]
    bg: string
    textColor: string
    fireworks: boolean
    shake: boolean
}> = {
    blackjack: {
        colors: ['#FFD700', '#FFF8DC', '#FFA500', '#FF6347', '#FFFACD'],
        bg: 'radial-gradient(ellipse at center, rgba(212,175,55,0.35) 0%, rgba(8,19,28,0.92) 70%)',
        textColor: '#FFD700',
        fireworks: true,
        shake: false,
    },
    win: {
        colors: ['#2ECC71', '#27AE60', '#A8F0C6', '#FFFFFF', '#F1C40F'],
        bg: 'radial-gradient(ellipse at center, rgba(46,204,113,0.25) 0%, rgba(8,19,28,0.92) 70%)',
        textColor: '#2ECC71',
        fireworks: true,
        shake: false,
    },
    push: {
        colors: ['#5BA4CF', '#A0C4E8', '#FFFFFF'],
        bg: 'radial-gradient(ellipse at center, rgba(91,164,207,0.2) 0%, rgba(8,19,28,0.92) 70%)',
        textColor: '#A0C4E8',
        fireworks: false,
        shake: false,
    },
    lose: {
        colors: ['#E74C3C', '#C0392B', '#FF6B6B'],
        bg: 'radial-gradient(ellipse at center, rgba(231,76,60,0.25) 0%, rgba(8,19,28,0.94) 70%)',
        textColor: '#E74C3C',
        fireworks: false,
        shake: true,
    },
    bust: {
        colors: ['#E74C3C', '#C0392B', '#FF6B6B'],
        bg: 'radial-gradient(ellipse at center, rgba(231,76,60,0.25) 0%, rgba(8,19,28,0.94) 70%)',
        textColor: '#E74C3C',
        fireworks: false,
        shake: true,
    },
}

const NON_BLACKJACK_DISPLAY_DURATION_MS = 1500
const BLACKJACK_DISPLAY_DURATION_MS = 3000
const BLACKJACK_FADE_DELAY_MS = 1500
const NON_BLACKJACK_FIREWORKS_DURATION_MS = 1300
const BLACKJACK_FIREWORKS_DURATION_MS = 2800

export function RoundResultOverlay({ outcome, onDone, displayDurationMs, fadeDelayMs }: Props) {
    const { t } = useTranslation()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const cfg = OUTCOME_CONFIG[outcome]

    const outcomeLabels: Record<RoundOutcome, { label: string; sub: string }> = {
        blackjack: { label: t('bjResultBlackjack'), sub: t('bjResultBlackjackSub') },
        win:       { label: t('bjResultWin'),       sub: t('bjResultWinSub') },
        push:      { label: t('bjResultPush'),      sub: t('bjResultPushSub') },
        lose:      { label: t('bjResultLose'),      sub: t('bjResultLoseSub') },
        bust:      { label: t('bjResultBust'),      sub: t('bjResultBustSub') },
    }
    const { label, sub } = outcomeLabels[outcome]
    const resolvedDisplayDurationMs = displayDurationMs ?? (
        outcome === 'blackjack'
            ? BLACKJACK_DISPLAY_DURATION_MS
            : NON_BLACKJACK_DISPLAY_DURATION_MS
    )
    const resolvedFadeDelayMs = Math.min(
        fadeDelayMs ?? (outcome === 'blackjack' ? BLACKJACK_FADE_DELAY_MS : 0),
        resolvedDisplayDurationMs,
    )
    const fadeDurationMs = Math.max(0, resolvedDisplayDurationMs - resolvedFadeDelayMs)
    const fireworksDurationMs = outcome === 'blackjack'
        ? BLACKJACK_FIREWORKS_DURATION_MS
        : NON_BLACKJACK_FIREWORKS_DURATION_MS

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [])

    useEffect(() => {
        if (!cfg.fireworks || !canvasRef.current) return
        return launchFireworks(canvasRef.current, cfg.colors, fireworksDurationMs)
    }, [cfg, fireworksDurationMs])

    useEffect(() => {
        const tid = setTimeout(onDone, resolvedDisplayDurationMs)
        return () => clearTimeout(tid)
    }, [onDone, resolvedDisplayDurationMs])

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none"
            style={{
                background: cfg.bg,
                animation: `fade-out-smooth ${fadeDurationMs}ms linear ${resolvedFadeDelayMs}ms forwards`,
            }}
        >
            {cfg.fireworks && (
                <canvas
                    ref={canvasRef}
                    className="pointer-events-none absolute inset-0"
                />
            )}

            {cfg.shake && (
                <div className="pointer-events-none absolute inset-0 animate-[shake_0.4s_ease-in-out_2]"
                    style={{ background: 'rgba(231,76,60,0.08)' }}
                />
            )}

            <div className="relative flex flex-col items-center gap-3 select-none">
                <span
                    className="animate-[pop-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards] font-aeonik text-[clamp(3rem,10vw,6rem)] font-black leading-none tracking-widest drop-shadow-[0_0_40px_currentColor]"
                    style={{ color: cfg.textColor }}
                >
                    {label}
                </span>
                <span
                    className="animate-[fade-up_0.5s_0.2s_ease-out_both] font-seravek text-[clamp(1rem,3vw,1.5rem)] tracking-wide drop-shadow-[0_0_12px_currentColor]"
                    style={{ color: cfg.textColor }}
                >
                    {sub}
                </span>
                <span className="mt-4 animate-[fade-up_0.5s_0.5s_ease-out_both] font-seravek text-xs tracking-widest text-white/30 uppercase">
                    {t('bjClickContinue')}
                </span>
            </div>

            <div
                className="pointer-events-none absolute inset-0 animate-[glow-pulse_1.2s_ease-in-out_infinite_alternate]"
                style={{
                    background: `radial-gradient(ellipse at center, ${cfg.textColor}18 0%, transparent 65%)`,
                }}
            />
        </div>
    )
}
