import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export type WalletTransactionType = 'deposit' | 'cashout'

type Props = {
    type: WalletTransactionType
    amount: number
    onDone: () => void
}

interface Coin {
    x: number
    y: number
    vy: number
    vx: number
    size: number
    alpha: number
    color: string
    rotation: number
    rotSpeed: number
}

function launchCoins(canvas: HTMLCanvasElement, colors: string[], duration: number) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return () => {}

    const coins: Coin[] = []
    let animId: number
    const start = performance.now()

    const spawnCoins = () => {
        const count = 6 + Math.floor(Math.random() * 5)
        for (let i = 0; i < count; i++) {
            coins.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * 80,
                vy: 2 + Math.random() * 4,
                vx: (Math.random() - 0.5) * 1.5,
                size: 6 + Math.random() * 10,
                alpha: 0.85 + Math.random() * 0.15,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.15,
            })
        }
    }

    spawnCoins()
    const spawnInterval = setInterval(spawnCoins, 180)

    const tick = () => {
        const elapsed = performance.now() - start
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (const c of coins) {
            c.y += c.vy
            c.x += c.vx
            c.rotation += c.rotSpeed
            if (c.y > canvas.height + 20) {
                c.alpha = 0
            }

            if (c.alpha <= 0) continue

            ctx.save()
            ctx.globalAlpha = c.alpha
            ctx.translate(c.x, c.y)
            ctx.rotate(c.rotation)
            ctx.beginPath()
            ctx.ellipse(0, 0, c.size, c.size * 0.45, 0, 0, Math.PI * 2)
            ctx.fillStyle = c.color
            ctx.fill()
            ctx.strokeStyle = '#B8860B'
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.restore()
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

const CONFIG: Record<WalletTransactionType, {
    colors: string[]
    bg: string
    textColor: string
    coins: boolean
    shake: boolean
}> = {
    deposit: {
        colors: ['#FFD700', '#FFC107', '#FFECB3', '#F9A825', '#FFF8DC'],
        bg: 'radial-gradient(ellipse at center, rgba(212,175,55,0.32) 0%, rgba(8,19,28,0.93) 70%)',
        textColor: '#FFD700',
        coins: true,
        shake: false,
    },
    cashout: {
        colors: ['#5BA4CF', '#A0C4E8', '#B3D9F5', '#FFFFFF'],
        bg: 'radial-gradient(ellipse at center, rgba(91,164,207,0.28) 0%, rgba(8,19,28,0.93) 70%)',
        textColor: '#7EC8E3',
        coins: false,
        shake: false,
    },
}

const DISPLAY_DURATION_MS = 2600
const COINS_DURATION_MS = 2400

export function WalletTransactionOverlay({ type, amount, onDone }: Props) {
    const { t } = useTranslation()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cfg = CONFIG[type]

    const amountStr = amount.toFixed(2)
    const overlayLabels: Record<WalletTransactionType, { label: string; sub: string }> = {
        deposit: { label: t('walletDepositLabel'), sub: t('walletDepositSub', { amount: amountStr }) },
        cashout: { label: t('walletCashoutLabel'), sub: t('walletCashoutSub', { amount: amountStr }) },
    }
    const { label, sub } = overlayLabels[type]

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
        if (!cfg.coins || !canvasRef.current) return
        return launchCoins(canvasRef.current, cfg.colors, COINS_DURATION_MS)
    }, [cfg])

    useEffect(() => {
        const tid = setTimeout(onDone, DISPLAY_DURATION_MS)
        return () => clearTimeout(tid)
    }, [onDone])

    return (
        <div
            className="fixed inset-0 z-9999 flex items-center justify-center"
            style={{ background: cfg.bg }}
            onClick={onDone}
        >
            {cfg.coins && (
                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
            )}

            <div
                className="pointer-events-none absolute inset-0 animate-[glow-pulse_1.2s_ease-in-out_infinite_alternate]"
                style={{
                    background: `radial-gradient(ellipse at center, ${cfg.textColor}20 0%, transparent 65%)`,
                }}
            />

            <div className="relative flex flex-col items-center gap-3 select-none text-center px-8">
                <span
                    className="animate-[pop-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards] font-aeonik text-[clamp(2rem,8vw,4.5rem)] font-black leading-none tracking-widest drop-shadow-[0_0_40px_currentColor]"
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
        </div>
    )
}
