import { useState, useEffect } from "react";
import WordInput     from "./components/WordInput.jsx";
import VocabCard     from "./components/VocabCard.jsx";
import SavedWords    from "./components/SavedWords.jsx";
import FlashcardMode from "./components/FlashcardMode.jsx";

const API    = import.meta.env.VITE_API_URL || "http://localhost:8000";
const LS_KEY = "vocab_saved_words";
const TH_KEY = "vocab_theme";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

/** Detect system preference; fall back to "dark" */
function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export default function App() {
  const [mode,   setMode]   = useState("lookup");
  const [status, setStatus] = useState("idle");
  const [entry,  setEntry]  = useState(null);
  const [error,  setError]  = useState("");
  const [saved,  setSaved]  = useState(loadSaved);

  // ── Theme ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(TH_KEY);
    return stored || systemTheme();
  });

  // Apply theme to <html> on every change
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(TH_KEY, theme);
  }, [theme]);

  // Auto-follow system changes only when user hasn't manually overridden
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e) => {
      // Only auto-switch if stored pref matches what we last auto-set
      const stored = localStorage.getItem(TH_KEY);
      if (!stored) setTheme(e.matches ? "light" : "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function toggleTheme() {
    setTheme(t => (t === "dark" ? "light" : "dark"));
  }

  // ── Saved words ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
  }, [saved]);

  async function handleSearch(word) {
    setStatus("loading");
    setEntry(null);
    setError("");
    try {
      const res = await fetch(`${API}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setEntry({ ...data, number: saved.length + 1 });
      setStatus("done");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }

  function handleSave(entryData) {
    if (saved.some(w => w.word === entryData.word)) return;
    setSaved(prev => [{ ...entryData, number: prev.length + 1 }, ...prev]);
  }

  function handleDelete(word) {
    setSaved(prev =>
      prev.filter(w => w.word !== word).map((w, i) => ({ ...w, number: i + 1 }))
    );
  }

  const isSaved = entry ? saved.some(w => w.word === entry.word) : false;
  const isLight = theme === "light";

  return (
    <div style={s.shell}>
      {/* ── Header ── */}
      <header style={s.header}>
        <div style={s.topRow}>
          <div style={s.brand}>
            <span style={s.brandIcon}>📚</span>
            <div>
              <h1 style={s.brandName}>VocabMaster</h1>
              <p style={s.brandSub}>Build your English vocabulary</p>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            style={{ ...s.themeBtn, background: isLight ? "#e8eaf6" : "var(--surface2)" }}
            onClick={toggleTheme}
            title={`Switch to ${isLight ? "dark" : "light"} mode`}
          >
            <span style={s.themeBtnTrack}>
              <span style={{ ...s.themeBtnThumb, transform: isLight ? "translateX(22px)" : "translateX(0)" }} />
            </span>
            <span style={s.themeBtnLabel}>{isLight ? "☀️" : "🌙"}</span>
          </button>
        </div>

        <nav style={s.nav}>
          {[
            { id: "lookup", label: "🔍 Lookup" },
            { id: "saved",  label: `📋 Saved (${saved.length})` },
            { id: "flash",  label: "🃏 Flashcards" },
          ].map(tab => (
            <button
              key={tab.id}
              style={{ ...s.tab, ...(mode === tab.id ? s.tabActive : {}) }}
              onClick={() => setMode(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Main ── */}
      <main style={s.main}>
        {mode === "lookup" && (
          <>
            <WordInput onSearch={handleSearch} loading={status === "loading"} />

            {status === "loading" && (
              <div style={s.stateBox}>
                <div style={s.spinner} />
                <p style={s.stateText}>Looking up word…</p>
                <p style={s.stateSub}>Fetching pronunciation · translations · definitions</p>
              </div>
            )}

            {status === "error" && (
              <div style={{ ...s.stateBox, borderColor: "var(--red)", borderWidth: 1 }}>
                <span style={{ fontSize: 28 }}>⚠️</span>
                <p style={{ ...s.stateText, color: "var(--red)" }}>{error}</p>
                <button style={s.btnPrimary} onClick={() => setStatus("idle")}>Try again</button>
              </div>
            )}

            {status === "done" && entry && (
              <VocabCard
                entry={entry}
                isSaved={isSaved}
                onSave={() => handleSave(entry)}
              />
            )}

            {status === "idle" && (
              <div style={s.hint}>
                <p style={s.hintTitle}>Type any English word to get:</p>
                <div style={s.hintGrid}>
                  {["🔊 IPA Pronunciation", "🇷🇺 Russian translation",
                    "🇺🇿 Uzbek translation", "📖 Clear definition",
                    "💬 Example sentence", "⚠️ Common mistakes",
                    "✅ Usage contexts"].map(h => (
                    <span key={h} style={s.hintChip}>{h}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {mode === "saved" && (
          <SavedWords
            words={saved}
            onDelete={handleDelete}
            onLookup={w => { setMode("lookup"); handleSearch(w); }}
          />
        )}

        {mode === "flash" && (
          <FlashcardMode words={saved} />
        )}
      </main>
    </div>
  );
}

const s = {
  shell:       { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 80px" },
  header:      { width: "100%", maxWidth: 760, paddingTop: 28, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 16 },
  topRow:      { display: "flex", justifyContent: "space-between", alignItems: "center" },
  brand:       { display: "flex", alignItems: "center", gap: 12 },
  brandIcon:   { fontSize: 34 },
  brandName:   { fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)" },
  brandSub:    { fontSize: 12, color: "var(--muted)" },

  /* toggle pill */
  themeBtn:    { display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 20, padding: "6px 12px", cursor: "pointer" },
  themeBtnTrack: { width: 38, height: 18, background: "var(--border)", borderRadius: 9, position: "relative", transition: "background .25s" },
  themeBtnThumb: { position: "absolute", top: 2, left: 2, width: 14, height: 14, borderRadius: "50%", background: "var(--accent)", transition: "transform .25s" },
  themeBtnLabel: { fontSize: 16, lineHeight: 1 },

  nav:         { display: "flex", gap: 6, background: "var(--surface)", padding: 5, borderRadius: 12, width: "fit-content", border: "1px solid var(--border)" },
  tab:         { padding: "7px 18px", background: "transparent", border: "none", color: "var(--muted)", borderRadius: 8, fontSize: 13, fontWeight: 600 },
  tabActive:   { background: "var(--accent)", color: "#fff" },
  main:        { width: "100%", maxWidth: 760 },

  stateBox:    { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r)", padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 24, boxShadow: "var(--shadow)" },
  spinner:     { width: 38, height: 38, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin .9s linear infinite" },
  stateText:   { fontSize: 16, fontWeight: 600, color: "var(--text)" },
  stateSub:    { fontSize: 13, color: "var(--muted)" },
  btnPrimary:  { marginTop: 8, padding: "9px 22px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600 },

  hint:        { marginTop: 40, textAlign: "center" },
  hintTitle:   { fontSize: 14, color: "var(--muted)", marginBottom: 14 },
  hintGrid:    { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  hintChip:    { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "var(--text)", boxShadow: "var(--shadow)" },
};

const style = document.createElement("style");
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
