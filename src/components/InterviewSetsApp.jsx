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
      { question: "Explain the event loop.", answer: "The event loop processes the call stack and the task queue to allow asynchronous callbacks to run." },
    ],
    2: [{ question: "What is React?", answer: "React is a library for building UIs using components and declarative rendering." }],
  };

  useEffect(() => {
    let mounted = true;
    async function detect() {
      const detected = [];
      for (let i = 1; i <= MAX_SETS; i++) {
        try {
          const mod = await import(`../sets/set${i}.json`);
          const json = mod.default ?? mod;
          const name = (json && json.setName) ? json.setName : `Set ${i}`;
          if (mounted) detected.push({ id: i, name });
        } catch (err) {
          // missing file -> skip
        }
      }
      if (mounted) {
        if (detected.length === 0) {
          const fallback = Object.keys(sampleSets).map((k) => ({ id: Number(k), name: `Set ${k} (sample)` }));
          setAvailableSets(fallback);
          setSelectedSetId(fallback[0]?.id ?? null);
        } else {
          setAvailableSets(detected);
          setSelectedSetId(detected[0]?.id ?? null);
        }
      }
    }
    detect();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedSetId) return;
    let mounted = true;
    setLoading(true);
    async function load() {
      try {
        const mod = await import(`../sets/set${selectedSetId}.json`);
        const json = mod.default ?? mod;
        const data = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
        if (mounted) setQaList(data);
      } catch (err) {
        const data = sampleSets[selectedSetId] ?? [];
        if (mounted) setQaList(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [selectedSetId]);

  const filtered = qaList.filter((item) => {
    const q = (item.question || "").toLowerCase();
    const a = (item.answer || "").toLowerCase();
    const qstr = query.trim().toLowerCase();
    if (!qstr) return true;
    return q.includes(qstr) || a.includes(qstr);
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Interview Questions — Sets</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Choose set</label>
            <select
              className="p-2 border rounded bg-white text-sm"
              value={selectedSetId ?? ""}
              onChange={(e) => setSelectedSetId(Number(e.target.value))}
            >
              {availableSets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </header>

        <div className="mb-4 flex items-center gap-3">
          <input
            placeholder="Search question or answer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-2 border rounded bg-white"
          />
          <div className="text-sm text-slate-600">{qaList.length} Q/A</div>
        </div>

        <main>
          {loading ? (
            <div className="p-6 text-center text-slate-600">Loading set...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-600">No questions found for this set.</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left w-12">#</th>
                    <th className="p-3 text-left">Question</th>
                    <th className="p-3 text-left">Answer</th>
                    <th className="p-3 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-slate-50 align-top">
                      <td className="p-3 align-top">{idx + 1}</td>
                      <td className="p-3 align-top whitespace-pre-line text-slate-800">{item.question}</td>
                      <td className="p-3 align-top whitespace-pre-line text-slate-700">{item.answer}</td>
                      <td className="p-3 text-center align-top">
                        <button
                          onClick={() => navigator.clipboard?.writeText(`Q: ${item.question}\nA: ${item.answer}`)}
                          className="px-3 py-1 rounded border text-sm hover:bg-slate-50"
                        >Copy</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <footer className="mt-6 text-sm text-slate-600">
          <p>
            Place JSON files at <code className="bg-slate-100 px-1 rounded">src/sets/set1.json</code> ... <code className="bg-slate-100 px-1 rounded">src/sets/set6.json</code>.
            Each file can be a raw array or an object with a <code className="bg-slate-100 px-1 rounded">data</code> array.
          </p>
        </footer>
      </div>
    </div>
  );
}
