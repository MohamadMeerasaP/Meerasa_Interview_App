"use client"

import React, { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import "./login.css"

/* ── particle canvas hook (matches landing page) ── */
function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let raf, W, H, particles = []

    const LIME = "rgba(198,241,53,"
    const TEAL = "rgba(9,196,196,"
    const BLUE = "rgba(64,128,255,"
    const COLORS = [LIME, TEAL, BLUE]

    function resize() {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    function spawn() {
      return {
        x: Math.random() * W,
        y: H + 20,
        r: Math.random() * 1.3 + 0.4,
        vy: -(Math.random() * 0.45 + 0.18),
        vx: (Math.random() - 0.5) * 0.22,
        alpha: 0,
        maxAlpha: Math.random() * 0.45 + 0.12,
        fadeIn: Math.random() * 0.007 + 0.003,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: 70 }, () => {
        const p = spawn()
        p.y = Math.random() * H
        p.alpha = Math.random() * p.maxAlpha
        return p
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha += p.fadeIn
        if (p.alpha > p.maxAlpha) { p.alpha = p.maxAlpha; p.fadeIn *= -1 }
        if (p.alpha < 0 || p.y < -20) { particles[i] = spawn(); continue }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ")"
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 80) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255,255,255,${0.02 * (1 - dist / 80)})`
            ctx.lineWidth = 0.4
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    init()
    draw()
    window.addEventListener("resize", resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [canvasRef])
}

/* ── icons ── */
const EmailIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.7"/>
    <path d="m2 7 10 7 10-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
)

const EyeIcon = ({ off }) => off ? (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.7"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
  </svg>
)

const ArrowIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BackArrow = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* ══════════════════════════════════════
   COMPONENT
══════════════════════════════════════ */
export default function Login() {
  const navigate  = useNavigate()
  const canvasRef = useRef(null)

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [showPw,   setShowPw]   = useState(false)

  useParticles(canvasRef)

  /* ── original supabase login logic — unchanged ── */
  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)   // replaced alert() with inline error
      return
    }

    navigate("/")               // ✅ go to main app after login
  }

  return (
    <div className="login-page">

      {/* ── background layers ── */}
      <canvas ref={canvasRef} id="login-canvas" aria-hidden="true" />
      <div className="login-grid"  aria-hidden="true" />
      <div className="login-orb-1" aria-hidden="true" />
      <div className="login-orb-2" aria-hidden="true" />

      {/* ══════════════════════════════
          SPLIT CARD
      ══════════════════════════════ */}
      <div className="login-layout" role="main">

        {/* ── LEFT — brand panel ── */}
        <aside className="login-left" aria-hidden="true">
          <div className="login-brand">
            <span className="login-brand-dot" />
            <span className="login-brand-name">Meerasa's Interview Prep</span>

            <h2 className="login-left-title">
              Welcome<br />back to your<br /><em>prep space.</em>
            </h2>

            <p className="login-left-desc">
              Pick up exactly where you left off. Your progress, stars, and notes are waiting.
            </p>

            <ul className="login-features">
              {[
                { icon: "📚", text: "20+ curated topic sets" },
                { icon: "📈", text: "Progress auto-saved"   },
                { icon: "⭐", text: "Starred questions sync" },
                { icon: "⌨️", text: "Keyboard-first design"  },
              ].map(({ icon, text }) => (
                <li className="login-feat" key={text}>
                  <span className="login-feat-icon">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="login-left-footer">
            CRAFTED BY MOHAMAD MEERASA · {new Date().getFullYear()}
          </div>
        </aside>

        {/* ── RIGHT — form panel ── */}
        <section className="login-right">

          <div className="login-eyebrow">
            <span className="login-eyebrow-dot" />
            Secure login
          </div>

          <h1 className="login-heading">Sign in</h1>
          <p className="login-subheading">Enter your credentials to continue practising.</p>

          {/* inline error — replaces alert() */}
          {error && (
            <div className="login-error" role="alert">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin} noValidate>

            {/* email */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">Email address</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><EmailIcon /></span>
                <input
                  id="login-email"
                  className="login-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* password */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><LockIcon /></span>
                <input
                  id="login-password"
                  className="login-input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPw} />
                </button>
              </div>
            </div>

            {/* forgot */}
            <div className="login-forgot">
              <button type="button" className="login-forgot-link">
                Forgot password?
              </button>
            </div>

            {/* submit */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowIcon />
                </>
              )}
            </button>

          </form>

          {/* footer */}
          <div className="login-footer">
            <p className="login-signup-text">
              Don't have an account?{" "}
              <button
                type="button"
                className="login-signup-link"
                onClick={() => navigate("/signup")}
              >
                Create one free
              </button>
            </p>

            <button
              type="button"
              className="login-back"
              onClick={() => navigate("/home")}
            >
              <BackArrow />
              Back to home
            </button>
          </div>

        </section>
      </div>
    </div>
  )
}