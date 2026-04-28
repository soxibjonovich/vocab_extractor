import { useState } from "react";

export default function SavedWords({ words, onDelete, onLookup }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const filtered = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase())
  );

  if (words.length === 0) {
    return (
      <div style={s.empty}>
        <span style={{ fontSize: 40 }}>📋</span>
        <p style={s.emptyTitle}>No saved words yet</p>
        <p style={s.emptyNote}>Look up a word and hit "Save" to add it here.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={s.topBar}>
        <p style={s.count}><strong style={s.num}>{words.length}</strong> saved words</p>
        <div style={s.searchWrap}>
          <span style={{ opacity: .5, fontSize: 14 }}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Filter words…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={s.list}>
        {filtered.map(entry => {
          const open = expanded === entry.word;
          const ru = entry.translations?.russian || "—";
          const uz = entry.translations?.uzbek   || "—";
          return (
            <div key={entry.word} style={{ ...s.row, borderColor: open ? "var(--accent)" : "var(--border)" }}>
              {/* Header */}
              <div style={s.rowHeader} onClick={() => setExpanded(open ? null : entry.word)}>
                <div style={s.rowLeft}>
                  <span style={s.num2}>#{entry.number}</span>
                  <div>
                    <span style={s.rowWord}>{entry.word}</span>
                    {entry.phonetic && <span style={s.rowPhonetic}> {entry.phonetic}</span>}
                  </div>
                  <span style={s.rowPos}>{entry.partOfSpeech}</span>
                </div>
                <div style={s.rowRight}>
                  <span style={s.rowTrans}>🇷🇺 {ru}</span>
                  <button style={s.deleteBtn} onClick={e => { e.stopPropagation(); onDelete(entry.word); }}>🗑</button>
                  <span style={s.chevron}>{open ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded */}
              {open && (
                <div style={s.rowBody}>
                  <p style={s.rowDef}>{entry.definition}</p>
                  {entry.example && <p style={s.rowEx}>"{entry.example}"</p>}
                  <div style={s.rowTransFull}>
                    <span>🇷🇺 {ru}</span>
                    <span style={{ opacity: .4 }}>|</span>
                    <span>🇺🇿 {uz}</span>
                  </div>
                  {(entry.mistakes||[]).length > 0 && (
                    <div style={s.rowMistakes}>
                      {entry.mistakes.map((m,i) => (
                        <p key={i} style={s.rowMistake}>⚠️ {m}</p>
                      ))}
                    </div>
                  )}
                  <div style={s.rowActions}>
                    <button style={s.btnSm} onClick={() => onLookup(entry.word)}>🔍 Re-lookup</button>
                    <button style={{ ...s.btnSm, color: "var(--red)", borderColor: "var(--red)" }} onClick={() => onDelete(entry.word)}>🗑 Remove</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "24px 0", fontSize: 14 }}>
            No words match "{search}"
          </p>
        )}
      </div>
    </div>
  );
}

const s = {
  empty: { textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 700 },
  emptyNote: { fontSize: 14, color: "var(--muted)" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 },
  count: { fontSize: 15, color: "var(--muted)" },
  num: { color: "var(--accent)", fontSize: 20 },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px" },
  searchInput: { background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13 },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  row: { background: "var(--surface)", border: "1px solid", borderRadius: "var(--card-r)", overflow: "hidden", transition: "border-color .15s" },
  rowHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer", flexWrap: "wrap", gap: 8 },
  rowLeft: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  num2: { fontSize: 11, color: "var(--muted)", fontWeight: 700, minWidth: 24 },
  rowWord: { fontSize: 16, fontWeight: 700 },
  rowPhonetic: { fontSize: 12, color: "var(--muted)", fontStyle: "italic" },
  rowPos: { fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", background: "rgba(108,99,255,.12)", padding: "2px 8px", borderRadius: 10 },
  rowRight: { display: "flex", alignItems: "center", gap: 10 },
  rowTrans: { fontSize: 13, color: "var(--muted)" },
  deleteBtn: { background: "transparent", border: "none", fontSize: 14, opacity: .4, padding: "2px 4px" },
  chevron: { fontSize: 10, color: "var(--muted)" },
  rowBody: { padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 },
  rowDef: { fontSize: 14, color: "var(--text)", lineHeight: 1.5 },
  rowEx: { fontSize: 13, color: "var(--muted)", fontStyle: "italic" },
  rowTransFull: { display: "flex", gap: 12, fontSize: 13, color: "var(--text)", flexWrap: "wrap" },
  rowMistakes: { display: "flex", flexDirection: "column", gap: 4 },
  rowMistake: { fontSize: 13, color: "var(--muted)", lineHeight: 1.4 },
  rowActions: { display: "flex", gap: 8, marginTop: 4 },
  btnSm: { padding: "5px 12px", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 7, fontSize: 12, fontWeight: 600 },
};
