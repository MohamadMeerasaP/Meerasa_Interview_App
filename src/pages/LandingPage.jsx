"use client"

import React, { useContext, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { UserContext } from "../context/userContext"
import "./landing.css"

/* ─── Particle canvas hook ───────────────────────────────────── */
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
        r: Math.random() * 1.4 + 0.4,
        vy: -(Math.random() * 0.5 + 0.2),
        vx: (Math.random() - 0.5) * 0.25,
        alpha: 0,
        maxAlpha: Math.random() * 0.5 + 0.15,
        fadeIn: Math.random() * 0.008 + 0.003,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: 90 }, () => {
        const p = spawn()
        p.y = Math.random() * H   // scatter vertically at start
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
        if (p.alpha < 0) { particles[i] = spawn(); continue }
        if (p.y < -20) { particles[i] = spawn(); continue }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ")"
        ctx.fill()
      }

      // sparse connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 90) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255,255,255,${0.025 * (1 - dist / 90)})`
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
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [canvasRef])
}

/* ─── Floating Q&A card data ──────────────────────────────────── */
const FLOAT_CARDS = [
  { tag: "js",    tagLabel: "JavaScript",    q: "What is a closure?",          a: "A function retaining access to its outer lexical scope even after that scope has returned." },
  { tag: "react", tagLabel: "React",         q: "What does useEffect do?",     a: "Runs side effects after render. Returns a cleanup function. Re-runs when dependencies change." },
  { tag: "sys",   tagLabel: "System Design", q: "What is horizontal scaling?", a: "Adding more machines to distribute load, rather than upgrading a single server." },
  { tag: "ds",    tagLabel: "DSA",           q: "Time complexity of binary search?", a: "O(log n) — each step halves the search space." },
  { tag: "node",  tagLabel: "Node.js",       q: "What is the event loop?",     a: "A mechanism that offloads operations, polling the queue when the call stack is empty." },
  { tag: "js",    tagLabel: "JavaScript",    q: "Explain Promise.all()",       a: "Resolves when ALL promises resolve, or rejects as soon as any one rejects." },
  { tag: "react", tagLabel: "React",         q: "Virtual DOM explained?",      a: "An in-memory copy of the real DOM. React diffs the trees and only patches actual changes." },
]

/* floating card positions / timing */
const FLOAT_POSITIONS = [
  { left: "4%",   delay: "0s",   duration: "22s", rot: "-4deg",  rotEnd: "-2deg"  },
  { left: "72%",  delay: "4s",   duration: "26s", rot: "3.5deg", rotEnd: "1deg"   },
  { left: "14%",  delay: "9s",   duration: "20s", rot: "-2deg",  rotEnd: "0deg"   },
  { left: "80%",  delay: "2s",   duration: "30s", rot: "5deg",   rotEnd: "2deg"   },
  { left: "55%",  delay: "13s",  duration: "24s", rot: "-3deg",  rotEnd: "-1deg"  },
  { left: "33%",  delay: "7s",   duration: "28s", rot: "2deg",   rotEnd: "4deg"   },
  { left: "62%",  delay: "18s",  duration: "22s", rot: "-1.5deg","rotEnd": "1deg" },
]

/* ─── Marquee data ────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  "JavaScript","React","Node.js","System Design","DSA",
  "TypeScript","REST APIs","SQL","MongoDB","CSS & Layout",
  "Next.js","Docker","Git","Testing","GraphQL",
  "JavaScript","React","Node.js","System Design","DSA",
  "TypeScript","REST APIs","SQL","MongoDB","CSS & Layout",
  "Next.js","Docker","Git","Testing","GraphQL",
]

/* ─── Features ────────────────────────────────────────────────── */
const FEATURES = [
  { icon:"📚", color:"lime",   title:"20+ Curated Topic Sets",   desc:"From JavaScript fundamentals to System Design — every set hand-crafted with model answers that actually make sense.", wide:true },
  { icon:"📈", color:"teal",   title:"Progress Tracking",         desc:"Mark questions reviewed, watch your completion % climb. Auto-saved across sessions — no account required." },
  { icon:"⭐", color:"amber",  title:"Star Key Questions",         desc:"Bookmark the hard ones. Filter to your starred set for rapid-fire revision the night before the interview." },
  { icon:"🔍", color:"blue",   title:"Global Search",             desc:"One search box across every topic. Find any question instantly, no matter which set it lives in." },
  { icon:"⌨️", color:"violet", title:"Keyboard First",            desc:"Navigate, copy, search and paginate without lifting your hands off the keyboard. Built for developers." },
]

/* ─── Topics ──────────────────────────────────────────────────── */
const TOPICS = [
  { label:"JavaScript Fundamentals", hot:true  },
  { label:"React & Hooks",           hot:true  },
  { label:"Node.js & Express",       hot:false },
  { label:"System Design",           hot:true  },
  { label:"Data Structures",         hot:false },
  { label:"Algorithms",              hot:false },
  { label:"TypeScript",              hot:false },
  { label:"CSS & Layout",            hot:false },
  { label:"REST API Design",         hot:false },
  { label:"MongoDB",                 hot:false },
  { label:"SQL Basics",              hot:false },
  { label:"Git & Version Control",   hot:false },
  { label:"Testing & TDD",           hot:false },
  { label:"Next.js",                 hot:false },
  { label:"Docker & Deployment",     hot:false },
]

/* ═════════════════════════════════════════════════════════════
   COMPONENT
═════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { user }  = useContext(UserContext)
  const navigate  = useNavigate()
  const canvasRef = useRef(null)

  useParticles(canvasRef)

  const handleCTA = () => navigate(user ? "/" : "/login")
  const scrollTo  = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

  return (
    <div className="lp">
      {/* ── particle canvas ── */}
      <canvas ref={canvasRef} id="lp-canvas" aria-hidden="true" />

      {/* ── background texture ── */}
      <div className="lp-grid"  aria-hidden="true" />
      <div className="lp-ribbon" aria-hidden="true" />

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav className="lp-nav">
        <div className="lp-nav-brand" onClick={() => window.scrollTo({ top:0, behavior:"smooth" })}>
          <span className="lp-brand-pulse" />
          <span className="lp-brand-name">Meerasa's Prep</span>
        </div>

        <div className="lp-nav-links">
          <span className="lp-nav-link" onClick={() => scrollTo("features")}>Features</span>
          <span className="lp-nav-link" onClick={() => scrollTo("how")}>How it works</span>
          <span className="lp-nav-link" onClick={() => scrollTo("topics")}>Topics</span>
          <span className="lp-nav-link" onClick={() => scrollTo("preview")}>Preview</span>
        </div>

        <div className="lp-nav-end">
          {user ? (
            <button className="btn btn-sm-lime" onClick={() => navigate("/")}>
              Continue Practice →
            </button>
          ) : (
            <>
              <button className="btn btn-sm-ghost" onClick={() => navigate("/login")}>Log in</button>
              <button className="btn btn-sm-lime"  onClick={() => navigate("/register")}>Sign up free</button>
            </>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="lp-hero">
        {/* orbs */}
        <div className="lp-hero-orb1" aria-hidden="true" />
        <div className="lp-hero-orb2" aria-hidden="true" />
        <div className="lp-hero-orb3" aria-hidden="true" />

        {/* floating Q&A cards */}
        <div className="lp-float-cards" aria-hidden="true">
          {FLOAT_CARDS.map((card, i) => {
            const pos = FLOAT_POSITIONS[i % FLOAT_POSITIONS.length]
            return (
              <div
                key={i}
                className="lp-fc"
                style={{
                  left: pos.left,
                  bottom: "-200px",
                  animationDelay: pos.delay,
                  animationDuration: pos.duration,
                  "--rot": pos.rot,
                  "--rot-end": pos.rotEnd,
                }}
              >
                <div className={`lp-fc-tag ${card.tag}`}>{card.tagLabel}</div>
                <div className="lp-fc-q">{card.q}</div>
                <div className="lp-fc-a">{card.a}</div>
              </div>
            )
          })}
        </div>

        {/* content */}
        <div className="lp-eyebrow">
          <span className="lp-eyebrow-dot" />
          Full-Stack Engineer · 3.5 yrs experience · Free to use
        </div>

        <h1 className="lp-h1">
          Crack your next<br />
          <span className="accent">technical</span>
        </h1>
        <p className="lp-h1-2">interview.</p>

        <p className="lp-hero-desc">
          Curated Q&A sets with model answers, smart progress tracking, and
          keyboard-first navigation. Built by a developer who's been there.
        </p>

        <div className="lp-cta-row">
          <button className="btn btn-lime" onClick={handleCTA}>
            {user ? "Continue Practice" : "Start Practising — It's Free"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="btn btn-ghost" onClick={() => scrollTo("features")}>
            See what's inside
          </button>
        </div>

        <div className="lp-trust">
          <div className="lp-avatars">
            <div className="lp-av lp-av-a">A</div>
            <div className="lp-av lp-av-b">K</div>
            <div className="lp-av lp-av-c">P</div>
            <div className="lp-av lp-av-d">R</div>
          </div>
          <span className="lp-trust-sep" />
          <span className="lp-stars">★★★★★</span>
          <span className="lp-trust-sep" />
          <span>Trusted by developers at top companies</span>
        </div>

        {/* scroll cue */}
        <div className="lp-scroll" aria-hidden="true">
          <span className="lp-scroll-line" />
          <span>scroll</span>
        </div>
      </section>

      {/* ══════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════ */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {MARQUEE_ITEMS.map((item, i) => (
            <span className="lp-mitem" key={i}>
              <span className="lp-mitem-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="lp-section" id="features">
        <div className="lp-stag">Features</div>
        <h2 className="lp-sh">
          Everything you need to<br /><em>prepare properly.</em>
        </h2>
        <p className="lp-ssub">
          No fluff, no filler. Just focused practice tools built by someone who's been through the grind.
        </p>

        <div className="lp-feat-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className={`lp-fc-card au au-${i + 1}${f.wide ? " wide" : ""}`}>
              <div className={`lp-fi ${f.color}`}>{f.icon}</div>
              <div className="lp-fc-title">{f.title}</div>
              <div className="lp-fc-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS
      ══════════════════════════════════════ */}
      <div className="lp-stats-wrap">
        <div className="lp-stats-grid">
          {[
            { val:"20",  em:"+", label:"Topic Sets"           },
            { val:"500", em:"+", label:"Q&A Pairs"            },
            { val:"100", em:"%", label:"Free to Use"          },
            { val:"3.5", em:"y", label:"Built by Experience"  },
          ].map(({ val, em, label }, i) => (
            <div className="lp-stat" key={i}>
              <div className="lp-sv">{val}<em>{em}</em></div>
              <div className="lp-sl">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="lp-section" id="how">
        <div className="lp-stag">How it works</div>
        <h2 className="lp-sh">
          Three steps to<br /><em>interview-ready.</em>
        </h2>

        <div className="lp-steps">
          {[
            { n:"01", title:"Pick a Topic",   desc:"Choose from 20+ curated sets — JavaScript, React, System Design, DSA and more. Each set is ready to go the moment you open it." },
            { n:"02", title:"Read & Review",  desc:"Go through each Q&A. Click to mark questions reviewed. Your progress auto-saves — no account, no sign-up, just pure practice." },
            { n:"03", title:"Star & Repeat",  desc:"Star the tricky ones. Filter to your starred set for quick revision the night before. Copy any Q&A to your clipboard in one click." },
          ].map((step, i) => (
            <div className={`lp-step au au-${i + 1}`} key={i}>
              <div className="lp-step-num">{step.n}</div>
              <div className="lp-step-title">{step.title}</div>
              <div className="lp-step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          LIVE PREVIEW (UI mockup)
      ══════════════════════════════════════ */}
      <div className="lp-preview" id="preview">
        <div className="lp-stag" style={{ marginBottom: 16 }}>Live Preview</div>
        <h2 className="lp-sh" style={{ marginBottom: 32 }}>
          What it <em>looks like.</em>
        </h2>

        <div className="lp-preview-frame">
          {/* browser chrome */}
          <div className="lp-pf-bar">
            <div className="lp-pf-dot" />
            <div className="lp-pf-dot" />
            <div className="lp-pf-dot" />
            <div className="lp-pf-url">meerasa-interview-prep.vercel.app</div>
          </div>

          <div className="lp-pf-body">
            {/* topic banner */}
            <div className="lp-pf-row">
              <div className="lp-pf-banner" style={{ flex: 2 }}>
                <div className="lp-pf-banner-icon">📘</div>
                <div className="lp-pf-banner-text">
                  <div className="lp-pf-banner-title" />
                  <div className="lp-pf-banner-sub" />
                </div>
                <div className="lp-pf-prog-bar" style={{ flex: 1, marginLeft: "auto" }}>
                  <div className="lp-pf-prog-fill" />
                </div>
                <div className="lp-pf-prog-label" style={{ marginLeft: 10 }}>60%</div>
              </div>
            </div>

            {/* Q&A rows */}
            {[
              { n:"01", q:"What is a closure in JavaScript?", a:"A function that retains access to its outer scope even after the outer function returns.", star:"⭐" },
              { n:"02", q:"Explain the event loop",           a:"Processes the call stack and task queue to run async callbacks without blocking.", star:"☆" },
              { n:"03", q:"Difference between == and ===?",   a:"== coerces types before comparing; === checks value AND type strictly.", star:"⭐" },
            ].map((row, i) => (
              <div className="lp-pf-table-row" key={i}>
                <div className="lp-pf-num">{row.n}</div>
                <div className="lp-pf-star">{row.star}</div>
                <div className="lp-pf-q">{row.q}</div>
                <div className="lp-pf-a">{row.a}</div>
                <div className="lp-pf-copy">copy</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TOPICS
      ══════════════════════════════════════ */}
      <section className="lp-section" id="topics">
        <div className="lp-stag">Topics</div>
        <h2 className="lp-sh">
          What's <em>inside.</em>
        </h2>
        <p className="lp-ssub">
          Topics cover the full stack — from core JS to deployment. Highlighted ones are the most practised.
        </p>

        <div className="lp-chips">
          {TOPICS.map((t, i) => (
            <div className={`lp-chip${t.hot ? " hot" : ""}`} key={i}>
              <span className="lp-chip-dot" />
              {t.label}
              {t.hot && <span className="lp-chip-hot">HOT</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA
      ══════════════════════════════════════ */}
      <div className="lp-cta-wrap">
        <div className="lp-cta-card">
          <div className="lp-cta-inner">
            <div className="lp-cta-tag">
              <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--lime)", display:"inline-block" }} />
              Ready when you are
            </div>

            <h2 className="lp-cta-h">
              Your dream offer<br />starts <em>right here.</em>
            </h2>

            <p className="lp-cta-sub">
              Stop doom-scrolling prep material. Sit down, pick a topic, and
              practise. It's that simple — and it's completely free.
            </p>

            <div className="lp-cta-btns">
              <button className="btn btn-lime" style={{ padding:"16px 36px", fontSize:16 }} onClick={handleCTA}>
                {user ? "Back to Practice" : "Get Started — It's Free"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {!user && (
                <button className="btn btn-ghost" onClick={() => navigate("/login")}>
                  Already have an account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-l">
          <span className="lp-brand-pulse" style={{ width:7, height:7 }} />
          <span className="lp-footer-brand">Meerasa's Interview Prep</span>
          <span style={{ color:"var(--t3)" }}>·</span>
          <span style={{ fontSize:12 }}>© {new Date().getFullYear()}</span>
        </div>
        <div className="lp-footer-r">
          Crafted with ❤️ by{" "}
          <a href="https://meerasaportfolios.web.app/" target="_blank" rel="noopener noreferrer">
            Mohamad Meerasa
          </a>
        </div>
      </footer>
    </div>
  )
}