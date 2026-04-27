"use client"

import React, { useEffect, useState, useRef } from "react"
import Logo from "../assets/Logo.png"
import { API_BASE } from "../config/api"
import { supabase } from "../lib/supabase"
import "./dashboard.css"

import { useContext } from "react";
import { UserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar"


/* ─── Storage keys (unchanged) ─── */
const STORAGE_KEYS = {
  SELECTED_SET: "interview-prep-selected-set",
  SEARCH_QUERY: "interview-prep-search-query",
  CURRENT_PAGE: "interview-prep-current-page",
  STARRED_QUESTIONS: "interview-prep-starred",
  REVIEWED_QUESTIONS: "interview-prep-reviewed",
}

const ITEMS_PER_PAGE = 5

export default function InterviewSetsApp() {
  const MAX_SETS = 20

  /* ── state ── */
  const [availableSets, setAvailableSets] = useState([])
  const [selectedSetId, setSelectedSetId] = useState(null)
  const [qaList, setQaList] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [starredQuestions, setStarredQuestions] = useState(new Set())
  const [starFilter, setStarFilter] = useState("all")
  const [reviewedQuestions, setReviewedQuestions] = useState({})
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLoading, setPageLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showClearDataModal, setShowClearDataModal] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [globalQuery, setGlobalQuery] = useState("")
  const [globalResults, setGlobalResults] = useState([])
  const [globalLoading, setGlobalLoading] = useState(false)

  const searchInputRef = useRef(null)

  const { user } = useContext(UserContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login")
    }
  }, [user, loading])


  /* ────────────────────────────────────────────────
     HYDRATION  (localStorage → state)
  ──────────────────────────────────────────────── */
  useEffect(() => {
    const savedSetId = localStorage.getItem(STORAGE_KEYS.SELECTED_SET)
    const savedQuery = localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY)
    const savedPage = localStorage.getItem(STORAGE_KEYS.CURRENT_PAGE)
    const savedStarred = localStorage.getItem(STORAGE_KEYS.STARRED_QUESTIONS)
    const savedReviewed = localStorage.getItem(STORAGE_KEYS.REVIEWED_QUESTIONS)

    if (savedQuery) setQuery(savedQuery)
    if (savedPage) setCurrentPage(Number(savedPage))
    if (savedStarred) { try { setStarredQuestions(new Set(JSON.parse(savedStarred))) } catch { } }
    if (savedReviewed) { try { setReviewedQuestions(JSON.parse(savedReviewed)) } catch { } }
    if (savedSetId) setTimeout(() => setSelectedSetId(Number(savedSetId)), 100)

    setIsHydrated(true)
  }, [])

  /* ── persist ── */
  useEffect(() => { if (selectedSetId) localStorage.setItem(STORAGE_KEYS.SELECTED_SET, selectedSetId.toString()) }, [selectedSetId])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, query) }, [query])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, currentPage.toString()) }, [currentPage])
  useEffect(() => { if (!isHydrated) return; localStorage.setItem(STORAGE_KEYS.STARRED_QUESTIONS, JSON.stringify([...starredQuestions])) }, [starredQuestions, isHydrated])
  useEffect(() => { if (!isHydrated) return; localStorage.setItem(STORAGE_KEYS.REVIEWED_QUESTIONS, JSON.stringify(reviewedQuestions)) }, [reviewedQuestions, isHydrated])

  /* ────────────────────────────────────────────────
     API — fetch available sets
  ──────────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true
    async function fetchSets() {
      try {
        const res = await fetch(`${API_BASE}/api/sets`)
        const data = await res.json()
        if (mounted) setAvailableSets(data)
      } catch (error) {
        console.error("Failed to fetch sets:", error)
      }
    }
    fetchSets()
    return () => { mounted = false }
  }, [])

  /* ────────────────────────────────────────────────
     API — load selected set
  ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedSetId) return
    let mounted = true
    setLoading(true)

    async function loadSet() {
      try {
        const res = await fetch(`${API_BASE}/api/sets/${selectedSetId}`)
        const data = await res.json()
        if (mounted) { setQaList(data); setLoading(false) }
      } catch (error) {
        console.error("Failed to load questions:", error)
        if (mounted) setLoading(false)
      }
    }
    loadSet()
    return () => { mounted = false }
  }, [selectedSetId])

  /* ────────────────────────────────────────────────
     API — global search  (debounced + abortable)
  ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!globalQuery.trim()) {
      setGlobalResults([])
      return
    }

    const controller = new AbortController()

    const delay = setTimeout(async () => {
      try {
        setGlobalLoading(true)

        // ✅ Get logged-in session token
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        if (!token) {
          console.error("No auth token found")
          setGlobalLoading(false)
          return
        }

        // ✅ Send token to backend
        const res = await fetch(
          `${API_BASE}/api/questions/search?q=${globalQuery}`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await res.json()
        setGlobalResults(data)

      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Global search failed:", error)
        }
      } finally {
        setGlobalLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(delay)
      controller.abort()
    }

  }, [globalQuery])


  /* ────────────────────────────────────────────────
     KEYBOARD SHORTCUTS  (unchanged logic)
  ──────────────────────────────────────────────── */
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "s" || e.key === "S") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }

      if (e.key === "Escape") {
        if (query) setQuery("")
        else if (selectedSetId) clearSelection()
      }

      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (currentPage > 1) goToPage(currentPage - 1)
      }

      if (e.key === "ArrowRight") {
        e.preventDefault()
        const tp = Math.ceil(filteredByStars.length / ITEMS_PER_PAGE)
        if (currentPage < tp) goToPage(currentPage + 1)
      }

      if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIndex(p => Math.max(0, p - 1)) }
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIndex(p => Math.min(paginatedData.length - 1, p + 1)) }

      if (e.key === "c" || e.key === "C") {
        e.preventDefault()
        const item = paginatedData[highlightedIndex]
        if (item) navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [query, selectedSetId, currentPage, highlightedIndex])

  /* ────────────────────────────────────────────────
     HELPERS  (all unchanged)
  ──────────────────────────────────────────────── */
  function toggleStar(questionId) {
    setStarredQuestions(prev => {
      const n = new Set(prev)
      n.has(questionId) ? n.delete(questionId) : n.add(questionId)
      return n
    })
  }

  function markAsReviewed(questionId) {
    setReviewedQuestions(prev => {
      const cur = { ...(prev[selectedSetId] || {}) }
      cur[questionId] ? delete cur[questionId] : (cur[questionId] = true)
      return { ...prev, [selectedSetId]: cur }
    })
  }

  function getReviewedCount() {
    if (!selectedSetId) return 0
    return Object.keys(reviewedQuestions[selectedSetId] || {}).length
  }

  function resetProgress() { if (selectedSetId) setShowResetModal(true) }
  function resetData() { if (selectedSetId) setShowClearDataModal(true) }

  function handleConfirmReset() {
    setReviewedQuestions(prev => ({ ...prev, [selectedSetId]: {} }))
    setShowResetModal(false)
  }

  function chooseSet(id) {
    setQuery(""); setSelectedSetId(id); setCurrentPage(1); setStarFilter("all"); setHighlightedIndex(0)
  }

  function clearSelection() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
    setSelectedSetId(null); setQuery(""); setQaList([]); setCurrentPage(1)
    setStarFilter("all"); setHighlightedIndex(0); setStarredQuestions(new Set())
    setReviewedQuestions({}); setConfirmText(""); setShowClearDataModal(false)
  }

  function goToPage(page) {
    setPageLoading(true)
    setTimeout(() => { setCurrentPage(page); setPageLoading(false); setHighlightedIndex(0) }, 500)
  }

  /* ────────────────────────────────────────────────
     DERIVED DATA
  ──────────────────────────────────────────────── */
  const filtered = qaList.filter(item => {
    const t = query.toLowerCase()
    return item.question?.toLowerCase().includes(t) || item.answer?.toLowerCase().includes(t)
  })

  const filteredByStars = filtered.filter((item, idx) => {
    if (starFilter === "starred") return starredQuestions.has(`${selectedSetId}-${idx}`)
    return true
  })

  const totalPages = Math.ceil(filteredByStars.length / ITEMS_PER_PAGE)
  const paginatedData = filteredByStars.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const selectedSet = availableSets.find(s => s.id === selectedSetId)
  const reviewedCount = getReviewedCount()
  const reviewedPct = qaList.length > 0 ? Math.round((reviewedCount / qaList.length) * 100) : 0

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="ip-app">

       {/* ── NAVBAR ── sits above the container, inside ip-app ── */}
      <Navbar />

      <div className="ip-container">

        {/* ══════════════════════════════════════
            HERO
        ══════════════════════════════════════ */}
        <header className="ip-hero">

          {/* left */}
          <div className="ip-hero-left">
            <div className="ip-hero-eyebrow">
              <span className="ip-hero-eyebrow-line" />
              <span className="ip-hero-eyebrow-text">Full-Stack Interview Prep</span>
            </div>

            <h1 className="ip-hero-title">
              Meerasa's<br /><em>Interview Prep</em>
            </h1>

            <div className="ip-hero-title-2">
              <div className="ip-hero-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
                </svg>
                3.5 yrs Full-Stack XP
              </div>
            </div>

            <p className="ip-hero-desc">
              Curated interview sets — concise questions and model answers. Pick a topic, track your progress, and walk into interviews with confidence.
            </p>

            <div className="ip-stats-bar">
              <div className="ip-stat">
                <span className="ip-stat-val">{availableSets.length}</span>
                <span className="ip-stat-lbl">Topics</span>
              </div>
              <div className="ip-stat">
                <span className="ip-stat-val">{qaList.length || "—"}</span>
                <span className="ip-stat-lbl">Q&amp;A</span>
              </div>
              <div className="ip-stat">
                <span className="ip-stat-val">{reviewedCount || "—"}</span>
                <span className="ip-stat-lbl">Reviewed</span>
              </div>
              <div className="ip-stat">
                <span className="ip-stat-val">{reviewedPct ? `${reviewedPct}%` : "—"}</span>
                <span className="ip-stat-lbl">Progress</span>
              </div>
            </div>
          </div>

          {/* right */}
          <div className="ip-hero-right">
            {/* logo card */}
            <div className="ip-logo-card">
              <div className="ip-logo-frame">
                <div className="ip-logo-inner">
                  <img src={Logo || "/placeholder.svg"} alt="Interview Prep" />
                </div>
              </div>
              <div className="ip-logo-name">Meerasa's Prep</div>
              <div className="ip-logo-handle">by Mohamad Meerasa</div>
            </div>

            {/* keyboard shortcuts */}
            <div>
              <div className="ip-kbd-title">Keyboard Shortcuts</div>
              <div className="ip-kbd-grid">
                {[
                  ["S", "Focus search"],
                  ["Esc", "Clear / Back"],
                  ["← →", "Change page"],
                  ["↑ ↓", "Move row"],
                  ["C", "Copy Q&A"],
                ].map(([key, label]) => (
                  <div className="ip-kbd-item" key={key}>
                    <kbd>{key}</kbd>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════
            GLOBAL SEARCH
        ══════════════════════════════════════ */}
        <div className="ip-card">
          <div className="ip-card-header">
            <div className="ip-card-header-left">
              <div className="ip-card-icon blue">🌐</div>
              <div>
                <div className="ip-card-title">Global Search</div>
                <div className="ip-card-sub">Search across every topic and question at once</div>
              </div>
            </div>
          </div>

          <div className="ip-input-wrap">
            <span className="ip-input-icon">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="ip-input"
              placeholder="Type to search across all interview questions…"
              value={globalQuery}
              onChange={e => setGlobalQuery(e.target.value)}
            />
            {globalQuery && (
              <button className="ip-input-clear" onClick={() => setGlobalQuery("")}>ESC</button>
            )}
          </div>

          {globalLoading && (
            <p className="ip-search-loading">Searching…</p>
          )}

          {globalQuery && !globalLoading && (
            <div className="ip-search-results">
              {globalResults.length === 0
                ? <p className="ip-search-empty">No results found for "{globalQuery}"</p>
                : globalResults.map((item, i) => (
                  <div key={item.id ?? i} className="ip-search-result">
                    <p className="sq">{item.question}</p>
                    <p className="sa">{item.answer}</p>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            TOPIC SELECTOR
        ══════════════════════════════════════ */}
        <div className="ip-card">
          <div className="ip-card-header">
            <div className="ip-card-header-left">
              <div className="ip-card-icon lime">📂</div>
              <div>
                <div className="ip-card-title">Select a Topic</div>
                <div className="ip-card-sub">Choose the interview topic you want to practise</div>
              </div>
            </div>
          </div>

          <div className="ip-select-row">
            <div>
              <div className="ip-field-label">Available Topics</div>
              <div className="ip-select-wrap">
                <select
                  className="ip-select"
                  value={selectedSetId ?? ""}
                  onChange={e => chooseSet(Number(e.target.value))}
                >
                  <option value="" disabled>— Choose a topic to begin —</option>
                  {availableSets.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button className="ip-btn ip-btn-ghost ip-btn-lg" onClick={resetData}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Clear All
            </button>
          </div>

          {!selectedSetId && (
            <div className="ip-empty">
              <div className="ip-empty-icon">🎯</div>
              <h3>Pick a topic to start</h3>
              <p>Each set contains carefully curated questions and model answers.</p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            Q&A PANEL
        ══════════════════════════════════════ */}
        <div className="ip-card" style={{ position: "relative" }}>

          {/* loader */}
          {loading && (
            <div className="ip-loader-overlay">
              <div className="ip-spinner" />
              <p className="ip-loader-text">fetching questions…</p>
            </div>
          )}

          {selectedSetId && !loading && (
            <>
              {/* topic banner */}
              <div className="ip-topic-banner">
                <div className="ip-topic-icon">📘</div>

                <div className="ip-topic-meta">
                  <div className="ip-topic-name">{selectedSet?.name}</div>
                  <div className="ip-topic-count">{qaList.length} curated Q&amp;A pairs</div>
                  <div className="ip-progress">
                    <div className="ip-progress-row">
                      <span className="ip-progress-label">{reviewedCount} / {qaList.length} reviewed</span>
                      <span className="ip-progress-pct">{reviewedPct}%</span>
                    </div>
                    <div className="ip-progress-track">
                      <div className="ip-progress-fill" style={{ width: `${reviewedPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="ip-topic-action">
                  <button className="ip-btn ip-btn-ghost ip-btn-sm" onClick={resetProgress}
                    style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
                    Reset
                  </button>
                </div>
              </div>

              {/* filters */}
              <div className="ip-filters">
                <div className="ip-filter-search">
                  <span className="ip-input-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                      <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    ref={searchInputRef}
                    className="ip-input"
                    placeholder="Filter questions… (press S)"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setCurrentPage(1) }}
                  />
                  {query && (
                    <button className="ip-input-clear" onClick={() => setQuery("")}>ESC</button>
                  )}
                </div>

                <div className="ip-toggle-group">
                  <button className={`ip-toggle${starFilter === "all" ? " on" : ""}`} onClick={() => { setStarFilter("all"); setCurrentPage(1) }}>All</button>
                  <button className={`ip-toggle${starFilter === "starred" ? " on" : ""}`} onClick={() => { setStarFilter("starred"); setCurrentPage(1) }}>⭐ Starred</button>
                </div>

                <div className="ip-count-pill">{filteredByStars.length} Q&amp;A</div>
              </div>

              {/* ── desktop table ── */}
              <div className="ip-table-wrap">
                <table className="ip-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ textAlign: "center" }}>★</th>
                      <th style={{ width: "38%" }}>Question</th>
                      <th>Answer</th>
                      <th style={{ textAlign: "center" }}>Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageLoading ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "56px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                            <div className="ip-spinner" />
                            <span className="ip-loader-text">loading page…</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "56px", textAlign: "center", color: "var(--ink-3)", fontSize: 13, fontStyle: "italic" }}>
                          No matching questions found.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item, idx) => {
                        const globalIdx = filtered.findIndex(q => q === item)
                        const questionId = `${selectedSetId}-${globalIdx}`
                        const isStarred = starredQuestions.has(questionId)
                        const isReviewed = !!reviewedQuestions[selectedSetId]?.[questionId]
                        const isHL = idx === highlightedIndex

                        return (
                          <tr
                            key={idx}
                            className={`ip-row${isHL ? " hl" : ""}${isReviewed ? " rev" : ""}`}
                            onClick={() => { markAsReviewed(questionId); setHighlightedIndex(idx) }}
                          >
                            <td><span className="ip-row-num">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</span></td>
                            <td style={{ textAlign: "center" }}>
                              <button className="ip-star-btn" onClick={e => { e.stopPropagation(); toggleStar(questionId) }}>
                                {isStarred ? "⭐" : <span className="ip-star-un">☆</span>}
                              </button>
                            </td>
                            <td>
                              <div className="ip-q-cell">
                                <span className="ip-q-text">{item.question}</span>
                                {isReviewed && <span className="ip-rev-badge">✓ reviewed</span>}
                              </div>
                            </td>
                            <td><span className="ip-a-text">{item.answer}</span></td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="ip-copy-btn"
                                onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`) }}
                              >
                                <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                  <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                </svg>
                                Copy
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── mobile cards ── */}
              <div className="ip-cards">
                {pageLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0" }}>
                    <div className="ip-spinner" />
                    <span className="ip-loader-text">loading page…</span>
                  </div>
                ) : paginatedData.length === 0 ? (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13, fontStyle: "italic" }}>
                    No matching questions found.
                  </div>
                ) : (
                  paginatedData.map((item, idx) => {
                    const globalIdx = filtered.findIndex(q => q === item)
                    const questionId = `${selectedSetId}-${globalIdx}`
                    const isStarred = starredQuestions.has(questionId)
                    const isReviewed = !!reviewedQuestions[selectedSetId]?.[questionId]

                    return (
                      <div
                        key={idx}
                        className={`ip-card-qa${isReviewed ? " rev" : ""}`}
                        onClick={() => markAsReviewed(questionId)}
                      >
                        <div className="ip-card-qa-head">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="ip-card-num">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
                            {isReviewed && <span className="ip-rev-badge">✓</span>}
                          </div>
                          <div className="ip-card-qa-actions">
                            <button className="ip-star-btn" onClick={e => { e.stopPropagation(); toggleStar(questionId) }}>
                              {isStarred ? "⭐" : <span className="ip-star-un">☆</span>}
                            </button>
                            <button
                              className="ip-copy-btn"
                              onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`) }}
                            >
                              <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                                <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                              </svg>
                              Copy
                            </button>
                          </div>
                        </div>
                        <p className="ip-card-q">{item.question}</p>
                        <div className="ip-card-divider" />
                        <div className="ip-card-a-label">Answer</div>
                        <p className="ip-card-a">{item.answer}</p>
                      </div>
                    )
                  })
                )}
              </div>

              {/* pagination */}
              {totalPages > 1 && (
                <div className="ip-pagination">
                  <button className="ip-page-btn" disabled={currentPage === 1} onClick={() => goToPage(Math.max(1, currentPage - 1))}>←</button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && <span className="ip-page-ellipsis">…</span>}
                        <button className={`ip-page-btn${p === currentPage ? " active" : ""}`} onClick={() => goToPage(p)}>{p}</button>
                      </React.Fragment>
                    ))
                  }

                  <button className="ip-page-btn" disabled={currentPage === totalPages} onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}>→</button>
                </div>
              )}
            </>
          )}

          {/* empty state */}
          {!selectedSetId && !loading && (
            <div className="ip-empty">
              <div className="ip-empty-icon">🗂️</div>
              <h3>Nothing selected yet</h3>
              <p>Select a topic above and start practising your interview questions.</p>
            </div>
          )}

          {/* footer */}
          <div className="ip-footer">
            <div className="ip-footer-brand">
              <span className="ip-footer-dot" />
              © {new Date().getFullYear()} Meerasa's Interview Prep
            </div>
            <span>
              Crafted with ❤️ by{" "}
              <a href="https://meerasaportfolios.web.app/" target="_blank" rel="noopener noreferrer">
                Mohamad Meerasa
              </a>
            </span>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════
          RESET PROGRESS MODAL
      ══════════════════════════════════════ */}
      {showResetModal && (
        <div className="ip-modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="ip-modal" onClick={e => e.stopPropagation()}>
            <div className="ip-modal-eyebrow">⚠ Destructive action</div>
            <h3 className="ip-modal-title">Reset Progress?</h3>
            <p className="ip-modal-desc">
              All reviewed questions for <strong>{selectedSet?.name}</strong> will be cleared. This cannot be undone.
            </p>
            <div className="ip-modal-actions">
              <button className="ip-btn ip-btn-ghost ip-btn-lg" style={{ flex: 1 }} onClick={() => setShowResetModal(false)}>Cancel</button>
              <button className="ip-btn ip-btn-danger ip-btn-lg" style={{ flex: 1 }} onClick={handleConfirmReset}>Reset Progress</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          CLEAR ALL DATA MODAL
      ══════════════════════════════════════ */}
      {showClearDataModal && (
        <div className="ip-modal-overlay" onClick={() => { setShowClearDataModal(false); setConfirmText("") }}>
          <div className="ip-modal" onClick={e => e.stopPropagation()}>
            <div className="ip-modal-eyebrow">⚠ Destructive action</div>
            <h3 className="ip-modal-title">Reset Everything?</h3>
            <p className="ip-modal-desc">
              All saved data will be permanently deleted — this action cannot be undone.
            </p>
            <div className="ip-modal-warning">
              <strong>The following will be erased:</strong>
              <ul>
                <li>Selected topic &amp; search history</li>
                <li>Pagination state</li>
                <li>All starred questions</li>
                <li>All progress tracking</li>
              </ul>
            </div>
            <label className="ip-modal-confirm-label">
              Type <strong style={{ color: "var(--rose)" }}>RESET</strong> to confirm
            </label>
            <input
              className="ip-modal-input"
              placeholder="Type RESET here"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
            />
            <div className="ip-modal-actions">
              <button className="ip-btn ip-btn-ghost ip-btn-lg" style={{ flex: 1 }} onClick={() => { setShowClearDataModal(false); setConfirmText("") }}>
                Cancel
              </button>
              <button
                className="ip-btn ip-btn-danger ip-btn-lg"
                style={{ flex: 1 }}
                disabled={confirmText.trim().toLowerCase() !== "reset"}
                onClick={clearSelection}
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}