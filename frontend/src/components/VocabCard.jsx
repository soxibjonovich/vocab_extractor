import { useState } from "react";

const POS_COLORS = {
  noun:        { bg: "rgba(96,165,250,.12)",  text: "#60a5fa" },
  verb:        { bg: "rgba(74,222,128,.12)",  text: "#4ade80" },
  adjective:   { bg: "rgba(251,146,60,.12)",  text: "#fb923c" },
  adverb:      { bg: "rgba(192,132,252,.12)", text: "#c084fc" },
  conjunction: { bg: "rgba(148,163,184,.1)",  text: "#94a3b8" },
  default:     { bg: "rgba(148,163,184,.1)",  text: "#94a3b8" },
};

function posStyle(pos) {
  const c = POS_COLORS[pos?.toLowerCase()] || POS_COLORS.default;
  return {
    background: c.bg, color: c.text,
    padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: ".5px",
    border: `1px solid ${c.text}33`,
    flexShrink: 0,
  };
}

export default function VocabCard({ entry, isSaved, onSave }) {
  const [copied,  setCopied]  = useState(false);
  const [showAll, setShowAll] = useState(false);

  const {
    number, word, phonetic, translations, partOfSpeech,
    definition, example, synonyms, definitions, mistakes, usageContexts,
  } = entry;

  const ru = translations?.russian || "—";
  const uz = translations?.uzbek   || "—";
  const extraDefs = (definitions || []).slice(1);

  function copyText() {
    const mistakesText   = (mistakes      || []).map(m => `⚠️ ${m}`).join("\n    ");
    const usageText      = (usageContexts || []).map(u => `✅ ${u}`).join(" | ");
    const text =
`${number || "?"}. ${word.toUpperCase()} ${phonetic || ""} ${ru} | ${uz} = ${partOfSpeech} ${definition}
    "${example || "—"}"
    ${mistakesText}
    ${usageText}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={s.card}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={s.topBar}>
        <div style={s.numberBadge}>#{number || "?"}</div>
        <div style={s.actions}>
          <button style={s.btnSec} onClick={copyText}>
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
          <button
            style={{ ...s.btnSec, ...(isSaved ? s.btnSaved : {}) }}
            onClick={onSave}
            disabled={isSaved}
          >
            {isSaved ? "✓ Saved" : "💾 Save"}
          </button>
        </div>
      </div>

      {/* ── Word + phonetic + POS ────────────────────────────── */}
      <div style={s.headline}>
        <h2 style={s.word}>{word}</h2>
        {phonetic && <span style={s.phonetic}>📢 {phonetic}</span>}
        <span style={posStyle(partOfSpeech)}>{partOfSpeech}</span>
      </div>

      {/* ── Translations ────────────────────────────────────── */}
      <div style={s.translations}>
        <span style={s.transItem}>🇷🇺 <strong>{ru}</strong></span>
        <span style={s.divider}>|</span>
        <span style={s.transItem}>🇺🇿 <strong>{uz}</strong></span>
      </div>

      <hr style={s.hr} />

      {/* ── Definition ──────────────────────────────────────── */}
      <div style={s.section}>
        <span style={s.label}>📖 Definition</span>
        <p style={s.definition}>{definition}</p>
      </div>

      {/* ── Example sentence ────────────────────────────────── */}
      {example && (
        <div style={s.exBox}>
          <span style={s.exIcon}>💬</span>
          <p style={s.exText}>"{example}"</p>
        </div>
      )}

      {/* ── Synonyms ────────────────────────────────────────── */}
      {synonyms?.length > 0 && (
        <div style={s.synonymRow}>
          <span style={s.synLabel}>≈ Similar:</span>
          {synonyms.slice(0, 5).map(syn => (
            <span key={syn} style={s.synChip}>{syn}</span>
          ))}
        </div>
      )}

      <hr style={s.hr} />

      {/* ── Common mistakes ─────────────────────────────────── */}
      <div style={s.section}>
        <span style={s.label}>⚠️ Common Mistakes</span>
        <div style={s.mistakeList}>
          {(mistakes || []).map((m, i) => (
            <div key={i} style={s.mistakeItem}>
              <span style={s.dot} />
              <span style={s.mistakeText}>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Usage contexts ──────────────────────────────────── */}
      <div style={s.section}>
        <span style={s.label}>✅ Best Used For</span>
        <div style={s.usageRow}>
          {(usageContexts || []).map((u, i) => (
            <span key={i} style={s.usageChip}>{u}</span>
          ))}
        </div>
      </div>

      {/* ── Extra definitions ───────────────────────────────── */}
      {extraDefs.length > 0 && (
        <>
          <hr style={s.hr} />
          <button style={s.toggleBtn} onClick={() => setShowAll(p => !p)}>
            {showAll
              ? "▲ Hide extra definitions"
              : `▼ ${extraDefs.length} more definition${extraDefs.length > 1 ? "s" : ""}`}
          </button>
          {showAll && extraDefs.map((d, i) => (
            <div key={i} style={s.extraDef}>
              <span style={posStyle(d.partOfSpeech)}>{d.partOfSpeech}</span>
              <p style={{ ...s.definition, marginTop: 6 }}>{d.definition}</p>
              {d.example && <p style={s.exSmall}>"{d.example}"</p>}
            </div>
          ))}
        </>
      )}

      {/* ── Compact format preview ──────────────────────────── */}
      <hr style={s.hr} />
      <div style={s.section}>
        <span style={s.label}>📋 Compact format</span>
        <pre style={s.pre}>
{`${number || "?"}. ${word.toUpperCase()} ${phonetic || ""} ${ru} | ${uz} = ${partOfSpeech} ${definition}
   "${example || "—"}" | ⚠️ ${(mistakes||[])[0] || "—"} | ✅ ${(usageContexts||[])[0] || "—"}`}
        </pre>
      </div>
    </div>
  );
}

const s = {
  card:        { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r)", overflow: "hidden", boxShadow: "var(--shadow)" },
  topBar:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 18px", background: "var(--surface2)", borderBottom: "1px solid var(--border)" },
  numberBadge: { background: "var(--accent)", color: "#fff", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 },
  actions:     { display: "flex", gap: 8 },
  btnSec:      { padding: "6px 13px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, fontSize: 12, fontWeight: 600 },
  btnSaved:    { opacity: .5, cursor: "default" },

  headline:    { padding: "18px 18px 8px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 },
  word:        { fontSize: 28, fontWeight: 800, letterSpacing: "-.5px", color: "var(--text)" },
  phonetic:    { fontSize: 14, color: "var(--muted)", fontStyle: "italic" },

  translations:{ padding: "0 18px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  transItem:   { fontSize: 15, color: "var(--text)" },
  divider:     { color: "var(--border)", fontSize: 18 },

  hr:          { border: "none", borderTop: "1px solid var(--border)" },

  section:     { padding: "13px 18px" },
  label:       { fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: 8 },
  definition:  { fontSize: 15, color: "var(--text)", lineHeight: 1.65 },

  exBox:       { margin: "0 18px 12px", background: "var(--ex-bg)", border: "1px solid var(--ex-border)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" },
  exIcon:      { fontSize: 15, flexShrink: 0, marginTop: 1 },
  exText:      { fontSize: 14, color: "var(--text)", fontStyle: "italic", lineHeight: 1.55 },

  synonymRow:  { padding: "0 18px 12px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 },
  synLabel:    { fontSize: 12, color: "var(--muted)", fontWeight: 600 },
  synChip:     { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 20, padding: "2px 10px", fontSize: 12, color: "var(--muted)" },

  mistakeList: { display: "flex", flexDirection: "column", gap: 8 },
  mistakeItem: { display: "flex", gap: 9, alignItems: "flex-start" },
  dot:         { width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", flexShrink: 0, marginTop: 7 },
  mistakeText: { fontSize: 14, color: "var(--text)", lineHeight: 1.55 },

  usageRow:    { display: "flex", flexWrap: "wrap", gap: 8 },
  usageChip:   { background: "var(--green-bg)", border: "1px solid var(--green-bd)", color: "var(--green)", borderRadius: 20, padding: "4px 13px", fontSize: 13 },

  toggleBtn:   { background: "transparent", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600, padding: "10px 18px", width: "100%", textAlign: "left" },
  extraDef:    { padding: "0 18px 12px" },
  exSmall:     { fontSize: 13, color: "var(--muted)", fontStyle: "italic", marginTop: 4 },

  pre:         { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "11px 13px", fontSize: 11.5, color: "var(--muted)", fontFamily: "'Courier New', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7, marginTop: 6 },
};
