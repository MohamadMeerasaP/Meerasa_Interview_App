import React, { useEffect, useState } from "react";

export default function InterviewSetsApp() {
  const MAX_SETS = 6;
  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [qaList, setQaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

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

  // Load selected set with 1-second loader
  useEffect(() => {
    if (!selectedSetId) return;

    let mounted = true;
    setLoading(true);

    async function loadSet() {
      // Artificial 1-second minimum loading time
      const delay = new Promise(res => setTimeout(res, 1000));

      // Try loading JSON file
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

  function chooseSet(id) {
    setQuery("");
    setSelectedSetId(id);
  }

  function clearSelection() {
    setSelectedSetId(null);
    setQuery("");
    setQaList([]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Top header */}
        <header className="mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 shadow-lg overflow-hidden shadow-lg">
            {/* animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 opacity-95 -z-10" />

            <div className="p-6 sm:px-8 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* left: logo + title */}
              <div className="flex items-start gap-4">
                <div className="flex-none">
                  <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center shadow-md ring-1 ring-white/10">
                    {/* Logo C — Code brackets (developer-first) */}
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 7L4 12l4 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 7l4 5-4 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="0.6" opacity="0.15" />
                    </svg>
                  </div>
                </div>

                <div>
                  <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">Meerasa's Interview Prep</h1>
                  <p className="text-indigo-100 mt-1 max-w-xl text-sm">
                    Curated interview sets — concise questions and model answers. Pick a topic and practice confidently.
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-50 text-sm">
                      {/* Icon: Clock */}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M12 7v6l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Available Topics: <span className="font-semibold ml-1">{availableSets.length || MAX_SETS}</span></span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-50 text-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span className="whitespace-nowrap">Searchable sets</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* right: actions */}
              <div className="flex items-center gap-3">
                {/* small helper text */}
                <div className="hidden sm:block text-sm text-indigo-100/90 ml-2">Tip: press <span className="font-semibold">S</span> to focus search</div>
              </div>
            </div>
          </div>
        </header>

        {/* Select card */}
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 mb-6 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              {/* Title & subtitle */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                  Select a Topic
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Choose the interview topic you want to prepare. Each set contains structured questions with answers.
                </p>
              </div>

              {/* Dropdown container */}
              <div className="relative group">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Choose a Topic to Begin
                </label>

                <select
                  className="
                  w-full sm:w-80 p-3 pr-10 border rounded-lg text-sm bg-white shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
                  transition-all duration-200
                  group-hover:shadow-md
                "
                  value={selectedSetId ?? ""}
                  onChange={(e) => chooseSet(Number(e.target.value))}
                >
                  <option value="" disabled>-- Available Topics --</option>
                  {availableSets.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* Dropdown icon */}
                <span className="pointer-events-none absolute right-3 top-[45px] text-slate-400 group-hover:text-indigo-500 transition">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M6 8l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              {/* Optional short description under dropdown */}
              <p className="mt-2 text-xs text-slate-500">
                Tip: Choose a set and the questions will load instantly with a smooth preview animation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="px-3 py-2 rounded-md text-sm border bg-slate-50 hover:bg-slate-100 transition"
                aria-label="Clear selection"
              >
                ← Clear
              </button>
            </div>
          </div>

          {/* small intro when no set */}
          {!selectedSetId && (
            <div className="mt-6 flex items-center gap-4 text-slate-600">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L20 7v6c0 5-4 9-8 9s-8-4-8-9V7l8-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 10h10M7 14h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-800">Pick a set to start practicing</div>
                <div className="text-sm mt-1">Each set contains concise questions and model answers for quick review.</div>
              </div>
            </div>
          )}
        </div>

        {/* Results card */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 relative overflow-hidden">
          {/* Loader overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-sm text-slate-700">Loading questions…</div>
              </div>
            </div>
          )}

          {/* Search row */}
          {selectedSetId && !loading && (
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
                <input
                  placeholder="Search question or answer..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border rounded-md text-sm focus:ring-2 focus:ring-indigo-200"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm px-2">
                    Clear
                  </button>
                )}
              </div>

              <div className="text-sm text-slate-600">{qaList.length} Q/A</div>
            </div>
          )}

          {/* Table */}
          {selectedSetId && !loading && (
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left text-sm text-slate-600 w-12">#</th>
                    <th className="p-3 text-left text-sm text-slate-600">Question</th>
                    <th className="p-3 text-left text-sm text-slate-600">Answer</th>
                    <th className="p-3 text-center text-sm text-slate-600 w-28">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-slate-500">No matching questions.</td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <tr key={idx} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 transition-colors">
                        <td className="p-3 align-top text-sm text-slate-700">{idx + 1}</td>
                        <td className="p-3 align-top text-sm text-slate-800 whitespace-pre-line">{item.question}</td>
                        <td className="p-3 align-top text-sm text-slate-700 whitespace-pre-line">{item.answer}</td>
                        <td className="p-3 text-center align-top">
                          <button
                            onClick={() => navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-md border text-sm bg-white hover:bg-indigo-50 transition"
                            title="Copy Q/A"
                          >
                            <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
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

          {/* Empty state when no set chosen */}
          {!selectedSetId && !loading && (
            <div className="p-8 text-center text-slate-600">
              <div className="text-lg font-medium">No set selected</div>
              <div className="text-sm mt-1">Use the dropdown above or quick-set chips to pick a topic.</div>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 text-xs text-slate-500">
            Tip: place JSON files at <code className="bg-slate-100 px-1 rounded">src/sets/set1.json</code> ... <code className="bg-slate-100 px-1 rounded">src/sets/set6.json</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
