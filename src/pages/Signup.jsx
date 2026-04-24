"use client"

import React, { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import "./login.css"  // reuses the same CSS — no new file needed

/* ── particle canvas hook (identical to Login) ── */
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
        p.x += p.vx; p.y += p.vy; p.alpha += p.fadeIn
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

    init(); draw()
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

const ShieldIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
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

const CheckIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
    <path d="m8 12 3 3 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* ── password strength helper ── */
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent" }
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  const map = [
    { label: "",         color: "transparent"             },
    { label: "Weak",     color: "var(--rose)"             },
    { label: "Fair",     color: "var(--amber, #f5a624)"   },
    { label: "Good",     color: "var(--teal)"             },
    { label: "Strong",   color: "var(--lime)"             },
  ]
  return { score, ...map[score] }
}

/* ══════════════════════════════════════
   COMPONENT
══════════════════════════════════════ */
export default function Signup() {
  const navigate  = useNavigate()
  const canvasRef = useRef(null)

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [success,  setSuccess]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  useParticles(canvasRef)

  const strength = getStrength(password)

  /* ── original supabase signup logic — unchanged ── */
  const handleSignup = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)   // replaces alert(error.message)
      return
    }

    // replaces alert("Signup successful! Please login.")
    setSuccess(true)
    setTimeout(() => navigate("/login"), 3000)  // auto-redirect after 3s
  }

  /* ── success screen ── */
  if (success) {
    return (
      <div className="login-page">
        <canvas ref={canvasRef} id="login-canvas" aria-hidden="true" />
        <div className="login-grid"  aria-hidden="true" />
        <div className="login-orb-1" aria-hidden="true" />
        <div className="login-orb-2" aria-hidden="true" />

        {/* success card — single centered card */}
        <div style={{
          position: "relative", zIndex: 1,
          background: "rgba(13,14,20,.85)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,.11)",
          borderRadius: 28,
          padding: "60px 52px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 40px 120px rgba(0,0,0,.6)",
          animation: "cardIn .7s cubic-bezier(.16,1,.3,1) both",
        }}>
          {/* animated checkmark ring */}
          <div style={{
            width: 72, height: 72,
            borderRadius: "50%",
            background: "rgba(198,241,53,.12)",
            border: "1.5px solid rgba(198,241,53,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            animation: "badgePop .5s cubic-bezier(.16,1,.3,1) .1s both",
          }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="m5 12 5 5L20 7" stroke="#c6f135" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 25, strokeDashoffset: 0, animation: "drawCheck .5s ease .3s both" }}/>
            </svg>
          </div>

          <h2 style={{
            fontFamily: "var(--serif, 'Instrument Serif', serif)",
            fontSize: 34, fontWeight: 400,
            letterSpacing: "-.03em", lineHeight: 1.1,
            color: "#f2f2ff", marginBottom: 12,
          }}>
            You're in!
          </h2>

          <p style={{ fontSize: 15, color: "#9898be", lineHeight: 1.75, marginBottom: 32, fontWeight: 500 }}>
            Account created successfully.<br />
            Redirecting you to login…
          </p>

          {/* progress bar */}
          <div style={{ height: 3, background: "rgba(255,255,255,.08)", borderRadius: 99, overflow: "hidden", marginBottom: 28 }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, #c6f135, #09c4c4)",
              borderRadius: 99,
              animation: "progressBar 3s linear forwards",
            }} />
          </div>

          <button
            onClick={() => navigate("/login")}
            style={{
              width: "100%", padding: "14px 24px",
              borderRadius: 14, background: "#c6f135",
              color: "#07080f", fontFamily: "var(--body, 'Cabinet Grotesk', sans-serif)",
              fontSize: 15, fontWeight: 700, border: "none",
              cursor: "pointer", letterSpacing: "-.01em",
            }}
          >
            Go to Login →
          </button>

          <style>{`
            @keyframes badgePop {
              from { transform: scale(.6); opacity: 0; }
              to   { transform: scale(1);  opacity: 1; }
            }
            @keyframes drawCheck {
              from { stroke-dashoffset: 25; }
              to   { stroke-dashoffset: 0;  }
            }
            @keyframes progressBar {
              from { width: 0%; }
              to   { width: 100%; }
            }
          `}</style>
        </div>
      </div>
    )
  }

  /* ── main signup form ── */
  return (
    <div className="login-page">

      {/* background layers */}
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
              Start your<br />interview<br /><em>journey today.</em>
            </h2>

            <p className="login-left-desc">
              Join developers who use focused practice to land their dream roles at top companies.
            </p>

            <ul className="login-features">
              {[
                { icon: "🚀", text: "Free forever — no credit card" },
                { icon: "📚", text: "20+ topic sets, 500+ Q&A"      },
                { icon: "🔒", text: "Secure auth via Supabase"       },
                { icon: "📈", text: "Progress synced to your account" },
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
            Free account
          </div>

          <h1 className="login-heading">Create account</h1>
          <p className="login-subheading">Start practising in under 30 seconds.</p>

          {/* inline error */}
          {error && (
            <div className="login-error" role="alert">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSignup} noValidate>

            {/* email */}
            <div className="login-field">
              <label className="login-label" htmlFor="signup-email">Email address</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><EmailIcon /></span>
                <input
                  id="signup-email"
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
              <label className="login-label" htmlFor="signup-password">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><LockIcon /></span>
                <input
                  id="signup-password"
                  className="login-input"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
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

              {/* password strength meter */}
              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:5 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 99,
                        background: i <= strength.score ? strength.color : "rgba(255,255,255,.08)",
                        transition: "background .25s",
                      }} />
                    ))}
                  </div>
                  {strength.label && (
                    <p style={{
                      fontFamily: "var(--mono)", fontSize: 10.5,
                      color: strength.color, letterSpacing: ".06em",
                      textTransform: "uppercase", fontWeight: 600,
                      transition: "color .25s",
                    }}>
                      {strength.label} password
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* terms note */}
            <p style={{
              fontSize: 12, color: "rgba(152,152,190,.7)",
              lineHeight: 1.6, marginTop: -4,
              fontFamily: "var(--mono)",
            }}>
              By signing up you agree to our{" "}
              <span style={{ color:"var(--lime-2, #a8ce10)", cursor:"pointer" }}>Terms</span>
              {" "}and{" "}
              <span style={{ color:"var(--lime-2, #a8ce10)", cursor:"pointer" }}>Privacy Policy</span>.
            </p>

            {/* submit */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Creating account…
                </>
              ) : (
                <>
                  Create free account
                  <ArrowIcon />
                </>
              )}
            </button>

          </form>

          {/* footer */}
          <div className="login-footer">
            <p className="login-signup-text">
              Already have an account?{" "}
              <button
                type="button"
                className="login-signup-link"
                onClick={() => navigate("/login")}
              >
                Sign in
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