"use client"

import React, { useEffect, useState, useRef } from "react"
import Logo from "../assets/Logo.png"


const STORAGE_KEYS = {
  SELECTED_SET: "interview-prep-selected-set",
  SEARCH_QUERY: "interview-prep-search-query",
  CURRENT_PAGE: "interview-prep-current-page",
  STARRED_QUESTIONS: "interview-prep-starred",
  REVIEWED_QUESTIONS: "interview-prep-reviewed",
}

export default function InterviewSetsApp() {
  const MAX_SETS = 20
  const [availableSets, setAvailableSets] = useState([])
  const [selectedSetId, setSelectedSetId] = useState(null)
  const [qaList, setQaList] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")

  const [starredQuestions, setStarredQuestions] = useState(new Set())
  const [starFilter, setStarFilter] = useState("all") // "all" or "starred"

  const [reviewedQuestions, setReviewedQuestions] = useState({})
  const [isHydrated, setIsHydrated] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLoading, setPageLoading] = useState(false)
  const ITEMS_PER_PAGE = 5

  const searchInputRef = useRef(null)

  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const [showResetModal, setShowResetModal] = useState(false)

  const sampleSets = {
    1: [
      {
        question: "What is closure in JavaScript?",
        answer: "A closure is a function that remembers its outer lexical scope even when executed outside that scope.",
      },
      {
        question: "Explain the event loop.",
        answer: "The event loop processes the call stack and task queue to run async callbacks.",
      },
    ],
    2: [
      {
        question: "What is React?",
        answer: "React is a UI library for building interfaces using declarative components.",
      },
    ],
  }

  useEffect(() => {
    const savedSetId = localStorage.getItem(STORAGE_KEYS.SELECTED_SET)
    const savedQuery = localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY)
    const savedPage = localStorage.getItem(STORAGE_KEYS.CURRENT_PAGE)
    const savedStarred = localStorage.getItem(STORAGE_KEYS.STARRED_QUESTIONS)
    const savedReviewed = localStorage.getItem(STORAGE_KEYS.REVIEWED_QUESTIONS)

    if (savedQuery) setQuery(savedQuery)
    if (savedPage) setCurrentPage(Number(savedPage))

    if (savedStarred) {
      try {
        setStarredQuestions(new Set(JSON.parse(savedStarred)))
      } catch { }
    }

    if (savedReviewed) {
      try {
        setReviewedQuestions(JSON.parse(savedReviewed))
      } catch { }
    }

    if (savedSetId) {
      setTimeout(() => setSelectedSetId(Number(savedSetId)), 100)
    }

    // ✅ IMPORTANT
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (selectedSetId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_SET, selectedSetId.toString())
    }
  }, [selectedSetId])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, query)
  }, [query])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, currentPage.toString())
  }, [currentPage])

  useEffect(() => {
    if (!isHydrated) return

    localStorage.setItem(
      STORAGE_KEYS.STARRED_QUESTIONS,
      JSON.stringify(starredQuestions)
    )
  }, [starredQuestions, isHydrated])

  // useEffect(() => {
  //   localStorage.setItem(STORAGE_KEYS.STARRED_QUESTIONS, JSON.stringify([...starredQuestions]))
  // }, [starredQuestions])

  useEffect(() => {
    if (!isHydrated) return

    localStorage.setItem(
      STORAGE_KEYS.REVIEWED_QUESTIONS,
      JSON.stringify(reviewedQuestions)
    )
  }, [reviewedQuestions, isHydrated])

  function toggleStar(questionId) {
    setStarredQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  function resetProgress() {
    if (selectedSetId) {
      setShowResetModal(true)
    }
  }

  function handleConfirmReset() {
    setReviewedQuestions((prev) => ({
      ...prev,
      [selectedSetId]: {},
    }))
    setShowResetModal(false)
  }

  function markAsReviewed(questionId) {
    setReviewedQuestions((prev) => {
      const currentSet = prev[selectedSetId] || {}
      const updatedSet = { ...currentSet }

      if (updatedSet[questionId]) {
        delete updatedSet[questionId]
      } else {
        updatedSet[questionId] = true
      }

      return {
        ...prev,
        [selectedSetId]: updatedSet,
      }
    })
  }


  function getReviewedCount() {
    if (!selectedSetId) return 0
    const reviewed = reviewedQuestions[selectedSetId] || {}
    return Object.keys(reviewed).length
  }

  // Detect available sets
  useEffect(() => {
    let mounted = true
    async function detect() {
      const detected = []
      for (let i = 1; i <= MAX_SETS; i++) {
        try {
          const mod = await import(`../sets/set${i}.json`)
          const json = mod.default ?? mod
          const name = json?.setName ?? `Set ${i}`
          if (mounted) detected.push({ id: i, name })
        } catch { }
      }

      if (mounted) {
        if (detected.length === 0) {
          const fallback = Object.keys(sampleSets).map((k) => ({
            id: Number(k),
            name: `Set ${k} (sample)`,
          }))
          setAvailableSets(fallback)
        } else {
          setAvailableSets(detected)
        }
      }
    }
    detect()
    return () => (mounted = false)
  }, [])

  // Load selected set with loader
  useEffect(() => {
    if (!selectedSetId) return

    let mounted = true
    setLoading(true)

    async function loadSet() {
      const delay = new Promise((res) => setTimeout(res, 800))

      const fetchData = (async () => {
        try {
          const mod = await import(`../sets/set${selectedSetId}.json`)
          const json = mod.default ?? mod
          return Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
        } catch {
          return sampleSets[selectedSetId] ?? []
        }
      })()

      const [_, data] = await Promise.all([delay, fetchData])

      if (mounted) {
        setQaList(data)
        setLoading(false)
      }
    }

    loadSet()
    return () => (mounted = false)
  }, [selectedSetId])

  const filtered = qaList.filter((item) => {
    const text = query.toLowerCase()
    return item.question?.toLowerCase().includes(text) || item.answer?.toLowerCase().includes(text)
  })

  const filteredByStars = filtered.filter((item, idx) => {
    if (starFilter === "starred") {
      const questionId = `${selectedSetId}-${idx}`
      return starredQuestions.has(questionId)
    }
    return true
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredByStars.length / ITEMS_PER_PAGE)

  const paginatedData = filteredByStars.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  function chooseSet(id) {
    setQuery("")
    setSelectedSetId(id)
    setCurrentPage(1)
    setStarFilter("all")
    setHighlightedIndex(0)
  }

  function clearSelection() {
    setSelectedSetId(null)
    setQuery("")
    setQaList([])
    setCurrentPage(1)
    setStarFilter("all")
    setHighlightedIndex(0)
  }

  useEffect(() => {
    function handleKeyDown(e) {
      // S - Focus search
      if (e.key === "s" || e.key === "S") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }

      // Esc - Clear search or close selected topic
      if (e.key === "Escape") {
        if (query) {
          setQuery("")
        } else if (selectedSetId) {
          clearSelection()
        }
      }

      // Arrow Left - Previous page
      if (e.key === "ArrowLeft") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault()
          if (currentPage > 1) {
            goToPage(currentPage - 1)
          }
        }
      }

      // Arrow Right - Next page
      if (e.key === "ArrowRight") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault()
          const totalPages = Math.ceil(filteredByStars.length / ITEMS_PER_PAGE)
          if (currentPage < totalPages) {
            goToPage(currentPage + 1)
          }
        }
      }

      // C - Copy highlighted Q/A
      if (e.key === "c" || e.key === "C") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault()
          const item = paginatedData[highlightedIndex]
          if (item) {
            navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`)
          }
        }
      }

      // Arrow Up/Down - Navigate highlighted row
      if (e.key === "ArrowUp") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault()
          setHighlightedIndex((prev) => Math.max(0, prev - 1))
        }
      }

      if (e.key === "ArrowDown") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault()
          setHighlightedIndex((prev) => Math.min(paginatedData.length - 1, prev + 1))
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [query, selectedSetId, currentPage, highlightedIndex])

  function goToPage(page) {
    setPageLoading(true)

    setTimeout(() => {
      setCurrentPage(page)
      setPageLoading(false)
      setHighlightedIndex(0)
    }, 500) // 0.5 sec loader
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-6 px-3 sm:py-12 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="mb-6 sm:mb-8">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 opacity-95 -z-10" />

            <div className="p-4 sm:p-6 md:px-8 md:py-8 flex flex-col gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-3xl bg-white flex items-center justify-center shadow-2xl ring-2 ring-white/50">
                  <img
                    src={Logo || "/placeholder.svg"}
                    alt="Interview Prep Logo"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover scale-100"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">
                    Meerasa's Interview Prep
                  </h1>
                  <p className="text-indigo-100 mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed">
                    Curated interview sets — concise questions and model answers. Pick a topic and practice confidently.
                  </p>

                  <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 text-indigo-50 text-xs sm:text-sm">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M12 7v6l3 2" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      Topics: <span className="font-semibold">{availableSets.length}</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 text-indigo-50 text-xs sm:text-sm">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      Searchable Sets
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden md:block text-xs sm:text-sm text-indigo-100 mt-2 space-y-1">
                <div className="font-semibold mb-1.5">⌨️ Keyboard Shortcuts:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white/20 rounded">S</kbd> Focus search
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Esc</kbd> Clear / Close
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white/20 rounded">← →</kbd> Navigate pages
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white/20 rounded">C</kbd> Copy highlighted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* SELECT TOPIC CARD */}
        <div className="bg-white rounded-xl shadow-md border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-5 sm:h-6 bg-indigo-600 rounded-full"></span>
              Select a Topic
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Choose the interview topic you want to prepare.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">
                Choose a Topic to Begin
              </label>
              <select
                value={selectedSetId ?? ""}
                onChange={(e) => chooseSet(Number(e.target.value))}
                className="w-full p-2.5 sm:p-3 border rounded-lg text-sm shadow-sm bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              >
                <option value="" disabled>
                  -- Available Topics --
                </option>
                {availableSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={clearSelection}
              className="w-full sm:w-auto sm:mt-7 px-4 py-2.5 sm:py-2 rounded-md text-sm border bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              ← Clear
            </button>
          </div>

          {!selectedSetId && (
            <div className="mt-6 flex items-start sm:items-center gap-3 sm:gap-4 text-slate-600">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 7l9-5 9 5v6c0 5-4 9-8 9s-8-4-8-9V7z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    opacity=".4"
                  />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>

              <div>
                <div className="text-base sm:text-lg font-semibold text-slate-800 break-words">
                  Pick a set to start practicing
                </div>
                <p className="text-xs sm:text-sm mt-1">Each set contains curated questions & answers.</p>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS CARD */}
        <div className="relative bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6 md:p-8">
          {/* Topic Banner */}
          {selectedSetId && !loading && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      opacity=".4"
                    />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
                    {availableSets.find((s) => s.id === selectedSetId)?.name}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">📘 {qaList.length} curated interview Q/A</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">
                      Progress: {getReviewedCount()} / {qaList.length} reviewed
                    </span>
                  </div>
                  <button
                    onClick={resetProgress}
                    className="text-xs px-2 py-1 rounded bg-white border hover:bg-slate-50 transition"
                  >
                    Reset
                  </button>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${qaList.length > 0 ? (getReviewedCount() / qaList.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {qaList.length > 0 ? Math.round((getReviewedCount() / qaList.length) * 100) : 0}% complete
                </div>
              </div>

              <div className="mt-3 sm:mt-4 h-1 w-24 sm:w-32 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full opacity-70"></div>
            </div>
          )}

          {/* Loader */}
          {loading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl">
              <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="mt-3 text-xs sm:text-sm text-slate-700">Fetching questions…</p>
            </div>
          )}

          {/* Search and Filter */}
          {selectedSetId && !loading && (
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 20 20">
                    <path d="M19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>

                <input
                  ref={searchInputRef}
                  placeholder="Search questions... (press S)"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 sm:pl-11 pr-16 sm:pr-12 py-2.5 sm:py-3 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />

                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md">
                <button
                  onClick={() => {
                    setStarFilter("all")
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition ${starFilter === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setStarFilter("starred")
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1 ${starFilter === "starred"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <span>⭐</span> Starred
                </button>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 bg-slate-100 px-3 sm:px-4 py-2 rounded-md shadow-sm text-center sm:text-left whitespace-nowrap">
                {filteredByStars.length} Q/A
              </div>
            </div>
          )}

          {/* TABLE */}
          {selectedSetId && !loading && (
            <div className="hidden lg:block overflow-x-auto rounded-xl border shadow-inner">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                    <th className="p-3 text-left text-sm font-semibold text-slate-600 w-12">#</th>
                    <th className="p-3 text-center text-sm font-semibold text-slate-600 w-16">⭐</th>
                    <th className="p-3 text-left text-sm font-semibold text-slate-600">Question</th>
                    <th className="p-3 text-left text-sm font-semibold text-slate-600">Answer</th>
                    <th className="p-3 text-center text-sm font-semibold text-slate-600 w-32">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pageLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                          <p className="mt-3 text-sm text-slate-700">Loading page…</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 text-sm">
                        No matching questions found.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, idx) => {
                      const globalIdx = filtered.findIndex((q) => q === item)
                      const questionId = `${selectedSetId}-${globalIdx}`
                      const isStarred = starredQuestions.has(questionId)
                      const isReviewed = reviewedQuestions[selectedSetId]?.[questionId]
                      const isHighlighted = idx === highlightedIndex

                      return (
                        <tr
                          key={idx}
                          className={`transition ${isHighlighted
                            ? "bg-indigo-100 ring-2 ring-indigo-400"
                            : isReviewed
                              ? "odd:bg-green-50/50 even:bg-green-100/50 hover:bg-indigo-50/40"
                              : "odd:bg-white even:bg-slate-50 hover:bg-indigo-50/40"
                            }`}
                          onClick={() => {
                            markAsReviewed(questionId)
                            setHighlightedIndex(idx)
                          }}
                        >
                          <td className="p-3 text-sm text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleStar(questionId)
                              }}
                              className="text-xl hover:scale-125 transition-transform"
                            >
                              {isStarred ? "⭐" : "☆"}
                            </button>
                          </td>
                          <td className="p-3 text-sm text-slate-800 whitespace-pre-line">{item.question}</td>
                          <td className="p-3 text-sm text-slate-700 whitespace-pre-line">{item.answer}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`)
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border bg-white shadow-sm 
                       hover:bg-indigo-100 hover:border-indigo-300 transition"
                            >
                              <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none">
                                <rect
                                  x="9"
                                  y="9"
                                  width="11"
                                  height="11"
                                  rx="2"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
                                <rect
                                  x="4"
                                  y="4"
                                  width="11"
                                  height="11"
                                  rx="2"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
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
          )}

          {/* CARD VIEW */}
          {selectedSetId && !loading && (
            <div className="lg:hidden space-y-4">
              {pageLoading ? (
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="mt-3 text-sm text-slate-700">Loading page…</p>
                  </div>
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No matching questions found.</div>
              ) : (
                paginatedData.map((item, idx) => {
                  const globalIdx = filtered.findIndex((q) => q === item)
                  const questionId = `${selectedSetId}-${globalIdx}`
                  const isStarred = starredQuestions.has(questionId)
                  const isReviewed = reviewedQuestions[selectedSetId]?.[questionId]

                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl shadow-sm p-4 transition-all ${isReviewed ? "bg-green-50 border-green-200" : "bg-white hover:shadow-md"
                        }`}
                      onClick={() => markAsReviewed(questionId)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                            {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStar(questionId)
                            }}
                            className="text-xl hover:scale-125 transition-transform"
                          >
                            {isStarred ? "⭐" : "☆"}
                          </button>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Question</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`)
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border bg-white shadow-sm 
                             hover:bg-indigo-100 hover:border-indigo-300 transition shrink-0"
                        >
                          <svg className="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                          Copy
                        </button>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                          {item.question}
                        </p>
                      </div>

                      <div className="border-t pt-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
                          Answer
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* PAGINATION */}
          {selectedSetId && !loading && totalPages > 1 && (
            <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
              {/* PREV */}
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm transition
                  ${currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border-slate-300 hover:bg-indigo-100"
                  }`}
              >
                <span className="hidden sm:inline">Prev</span>
                <span className="sm:hidden">←</span>
              </button>

              {/* PAGE NUMBERS */}
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // On mobile, show current page, first, and last
                    if (totalPages <= 5) return true
                    if (page === 1 || page === totalPages) return true
                    if (Math.abs(page - currentPage) <= 1) return true
                    return false
                  })
                  .map((page, idx, arr) => {
                    // Add ellipsis between non-consecutive numbers
                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-2 py-2 text-slate-400 text-xs sm:text-sm">...</span>}
                        <button
                          onClick={() => goToPage(page)}
                          className={`px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm shadow-sm transition
                            ${currentPage === page
                              ? "bg-indigo-600 text-white border-indigo-600 shadow"
                              : "bg-white border-slate-300 hover:bg-indigo-100"
                            }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    )
                  })}
              </div>

              {/* NEXT */}
              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm transition
                  ${currentPage === totalPages
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border-slate-300 hover:bg-indigo-100"
                  }`}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
          )}

          {/* Empty state */}
          {!selectedSetId && !loading && (
            <div className="p-8 sm:p-12 text-center text-slate-600">
              <h3 className="text-base sm:text-lg font-semibold">Begin by choosing a topic</h3>
              <p className="text-xs sm:text-sm mt-2">Each topic contains curated interview questions.</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 border-t pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">

              {/* Left */}
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500" />
                <span>
                  © {new Date().getFullYear()}{" "}
                  <span className="font-medium text-slate-700">
                    Meerasa’s Interview Prep
                  </span>
                </span>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2 text-slate-400">
                <div className="text-center">
                  Crafted with ❤️ by{" "}
                  <a
                    href="https://meerasaportfolios.web.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition"
                  >
                    Mohamad Meerasa
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Reset Progress?</h3>
                <p className="text-sm text-slate-600 mt-1">This will clear all reviewed questions for this topic.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-800">
                This action cannot be undone. Your progress tracking for{" "}
                <span className="font-semibold">{availableSets.find((s) => s.id === selectedSetId)?.name}</span> will be
                reset to 0.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
