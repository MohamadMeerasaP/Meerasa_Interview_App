import React, { useEffect, useState } from "react";

export default function InterviewSetsApp() {
  const MAX_SETS = 6;
  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [qaList, setQaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const ITEMS_PER_PAGE = 5;

  function goToPage(page) {
    setPageLoading(true);

    setTimeout(() => {
      setCurrentPage(page);
      setPageLoading(false);
    }, 500); // 0.5 sec loader
  }


  const sampleSets = {
    1: [
      { question: "What is closure in JavaScript?", answer: "A closure is a function that remembers its outer lexical scope even when executed outside that scope." },
      { question: "Explain the event loop.", answer: "The event loop processes the call stack and task queue to run async callbacks." },
    ],
    2: [
      { question: "What is React?", answer: "React is a UI library for building interfaces using declarative components." }
    ],
  };

  // Detect available sets
  useEffect(() => {
    let mounted = true;
    async function detect() {
      const detected = [];
      for (let i = 1; i <= MAX_SETS; i++) {
        try {
          const mod = await import(`../sets/set${i}.json`);
          const json = mod.default ?? mod;
          const name = json?.setName ?? `Set ${i}`;
          if (mounted) detected.push({ id: i, name });
        } catch { }
      }

      if (mounted) {
        if (detected.length === 0) {
          const fallback = Object.keys(sampleSets).map((k) => ({
            id: Number(k),
            name: `Set ${k} (sample)`
          }));
          setAvailableSets(fallback);
        } else {
          setAvailableSets(detected);
        }
      }
    }
    detect();
    return () => (mounted = false);
  }, []);

  // Load selected set with loader
  useEffect(() => {
    if (!selectedSetId) return;

    let mounted = true;
    setLoading(true);

    async function loadSet() {
      const delay = new Promise(res => setTimeout(res, 800));

      const fetchData = (async () => {
        try {
          const mod = await import(`../sets/set${selectedSetId}.json`);
          const json = mod.default ?? mod;
          return Array.isArray(json) ? json :
            Array.isArray(json?.data) ? json.data : [];
        } catch {
          return sampleSets[selectedSetId] ?? [];
        }
      })();

      const [_, data] = await Promise.all([delay, fetchData]);

      if (mounted) {
        setQaList(data);
        setLoading(false);
      }
    }

    loadSet();
    return () => (mounted = false);
  }, [selectedSetId]);


  const filtered = qaList.filter((item) => {
    const text = query.toLowerCase();
    return (
      item.question?.toLowerCase().includes(text) ||
      item.answer?.toLowerCase().includes(text)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function chooseSet(id) {
    setQuery("");
    setSelectedSetId(id);
    setCurrentPage(1);
  }

  function clearSelection() {
    setSelectedSetId(null);
    setQuery("");
    setQaList([]);
    setCurrentPage(1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <header className="mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 opacity-95 -z-10" />

            <div className="p-6 sm:px-8 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center shadow-md ring-1 ring-white/10">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                    <path d="M8 7L4 12l4 5" stroke="white" strokeWidth="1.6" />
                    <path d="M16 7l4 5-4 5" stroke="white" strokeWidth="1.6" />
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="0.6" opacity=".15" />
                  </svg>
                </div>

                <div>
                  <h1 className="text-white text-2xl sm:text-3xl font-extrabold">Meerasa's Interview Prep</h1>
                  <p className="text-indigo-100 mt-1 text-sm max-w-lg">
                    Curated interview sets — concise questions and model answers. Pick a topic and practice confidently.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-50 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M12 7v6l3 2" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      Topics: <span className="font-semibold">{availableSets.length}</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-50 text-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      Searchable Sets
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block text-sm text-indigo-100">Tip: press <b>S</b> to focus search</div>
            </div>
          </div>
        </header>

        {/* SELECT TOPIC CARD */}
        <div className="bg-white rounded-xl shadow-md border p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              Select a Topic
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Choose the interview topic you want to prepare.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Choose a Topic to Begin
              </label>
              <select
                value={selectedSetId ?? ""}
                onChange={(e) => chooseSet(Number(e.target.value))}
                className="w-full sm:w-80 p-3 border rounded-lg text-sm shadow-sm bg-white focus:ring-2 focus:ring-indigo-300"
              >
                <option value="" disabled>-- Available Topics --</option>
                {availableSets.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={clearSelection}
              className="px-3 py-2 rounded-md text-sm border bg-slate-50 hover:bg-slate-100"
            >
              ← Clear
            </button>
          </div>

          {!selectedSetId && (
            <div className="mt-6 flex items-center gap-4 text-slate-600">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <path d="M12 2L20 7v6c0 5-4 9-8 9s-8-4-8-9V7l8-5z" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-800">Pick a set to start practicing</div>
                <p className="text-sm mt-1">Each set contains curated questions & answers.</p>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS CARD */}
        <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border p-8">

          {/* Topic Banner */}
          {selectedSetId && !loading && (
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <path d="M3 7l9-5 9 5v6c0 5-4 10-9 10S3 18 3 13V7z"
                      stroke="currentColor" strokeWidth="1.3" opacity=".4" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {availableSets.find(s => s.id === selectedSetId)?.name}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    📘 {qaList.length} curated interview Q/A
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1 w-32 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full opacity-70"></div>
            </div>
          )}

          {/* Loader */}
          {loading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur rounded-2xl">
              <div className="w-14 h-14 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-slate-700">Fetching questions…</p>
            </div>
          )}

          {/* Search */}
          {selectedSetId && !loading && (
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                    <path d="M19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>

                <input
                  placeholder="Search questions..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-11 pr-12 py-3 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                />

                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-md shadow-sm">
                {qaList.length} Q/A
              </div>
            </div>
          )}

          {/* TABLE */}
          {selectedSetId && !loading && (
            <div className="overflow-x-auto rounded-xl border shadow-inner">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                    <th className="p-3 text-left text-sm font-semibold text-slate-600 w-12">#</th>
                    <th className="p-3 text-left text-sm font-semibold text-slate-600">Question</th>
                    <th className="p-3 text-left text-sm font-semibold text-slate-600">Answer</th>
                    <th className="p-3 text-center text-sm font-semibold text-slate-600 w-32">Action</th>
                  </tr>
                </thead>

                <tbody>

                  {/* Page Loading Spinner INSIDE Table Only */}
                  {pageLoading ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                          <p className="mt-3 text-sm text-slate-700">Loading page…</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (

                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500 text-sm">
                        No matching questions found.
                      </td>
                    </tr>

                  ) : (

                    paginatedData.map((item, idx) => (
                      <tr
                        key={idx}
                        className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50/40 transition"
                      >
                        <td className="p-3 text-sm text-slate-700">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>

                        <td className="p-3 text-sm text-slate-800 whitespace-pre-line">{item.question}</td>
                        <td className="p-3 text-sm text-slate-700 whitespace-pre-line">{item.answer}</td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() =>
                              navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`)
                            }
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border bg-white shadow-sm 
                       hover:bg-indigo-100 hover:border-indigo-300 transition"
                          >
                            <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none">
                              <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                              <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            Copy
                          </button>
                        </td>
                      </tr>
                    ))

                  )}

                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {selectedSetId && !loading && totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">

              {/* PREV */}
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg border text-sm transition
                  ${currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white hover:bg-indigo-100 border-slate-300"}`}
              >
                Prev
              </button>

              {/* PAGE NUMBERS */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1.5 rounded-lg border text-sm shadow-sm transition
                    ${currentPage === page
                      ? "bg-indigo-600 text-white border-indigo-600 shadow"
                      : "bg-white border-slate-300 hover:bg-indigo-100"}`}
                >
                  {page}
                </button>
              ))}

              {/* NEXT */}
              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg border text-sm transition
                  ${currentPage === totalPages
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white hover:bg-indigo-100 border-slate-300"}`}
              >
                Next
              </button>
            </div>
          )}

          {/* Empty state */}
          {!selectedSetId && !loading && (
            <div className="p-12 text-center text-slate-600">
              <h3 className="text-lg font-semibold">Begin by choosing a topic</h3>
              <p className="text-sm mt-2">Each topic contains curated interview questions.</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-xs text-slate-500">
            Manage sets in:
            <code className="bg-slate-100 px-1 rounded ml-1">src/sets/</code>
          </div>
        </div>

      </div>
    </div>
  );
}
