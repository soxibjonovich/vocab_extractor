import { useState } from "react";

export default function VocabList({ data, fileName, onReset }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(false);

  const filtered = data.vocab.filter((v) =>
    v.word.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(word) {
    setExpanded((prev) => (prev === word ? null : word));
  }

  function copyAll() {
    const text = data.vocab.map((v) => v.word).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const posColors = {
    noun: "#6c9fff",
    verb: "#4caf82",
    adjective: "#e0a95c",
    adverb: "#c084fc",
    default: "#8b8fa8",
  };

  function posColor(pos) {
    return posColors[pos?.toLowerCase()] || posColors.default;
  }

  return (
    <div>
      {/* Top bar */}
      <div style={s.topBar}>
        <div>
          <p style={s.fileLabel}>{fileName}</p>
          <p style={s.count}>
            <span style={s.countNum}>{data.count}</span> vocabulary words found
          </p>
        </div>
        <div style={s.topActions}>
          <button style={s.secondaryBtn} onClick={copyAll}>
            {copied ? "✓ Copied!" : "Copy all words"}
          </button>
          <button style={s.primaryBtn} onClick={onReset}>
            Upload new PDF
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          style={s.searchInput}
          placeholder="Filter words…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Results info */}
      {search && (
        <p style={s.resultInfo}>
          {filtered.length} of {data.count} words match "{search}"
        </p>
      )}

      {/* Word cards */}
      <div style={s.list}>
        {filtered.length === 0 ? (
          <div style={s.empty}>No words match your search.</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.word}
              style={{
                ...s.card,
                borderColor:
                  expanded === item.word ? "#6c63ff" : "#2e3350",
              }}
            >
              {/* Card header — always visible */}
              <div
                style={s.cardHeader}
                onClick={() => toggle(item.word)}
              >
                <div style={s.wordRow}>
                  <span style={s.word}>{item.word}</span>
                  {item.phonetic && (
                    <span style={s.phonetic}>{item.phonetic}</span>
                  )}
                  <div style={s.posTags}>
                    {item.definitions.map((d, i) => (
                      <span
                        key={i}
                        style={{
                          ...s.posTag,
                          color: posColor(d.partOfSpeech),
                          borderColor: posColor(d.partOfSpeech) + "44",
                          background: posColor(d.partOfSpeech) + "14",
                        }}
                      >
                        {d.partOfSpeech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* First definition preview (collapsed) */}
                {expanded !== item.word && (
                  <p style={s.preview}>
                    {item.definitions[0]?.definition}
                  </p>
                )}

                <span style={s.chevron}>
                  {expanded === item.word ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded definitions */}
              {expanded === item.word && (
                <div style={s.cardBody}>
                  {item.definitions.map((def, idx) => (
                    <div key={idx} style={s.defBlock}>
                      <span
                        style={{
                          ...s.posLabel,
                          color: posColor(def.partOfSpeech),
                        }}
                      >
                        {def.partOfSpeech}
                      </span>
                      <p style={s.defText}>{def.definition}</p>
                      {def.example && (
                        <p style={s.example}>
                          <em>"{def.example}"</em>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const s = {
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  fileLabel: { fontSize: 12, color: "#8b8fa8", marginBottom: 2 },
  count: { fontSize: 16, color: "#e8eaf6" },
  countNum: { fontWeight: 700, color: "#6c63ff", fontSize: 20 },
  topActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  primaryBtn: {
    padding: "9px 20px",
    background: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "9px 20px",
    background: "transparent",
    color: "#6c63ff",
    border: "1px solid #6c63ff55",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    background: "#1a1d27",
    border: "1px solid #2e3350",
    borderRadius: 10,
    padding: "0 14px",
    marginBottom: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e8eaf6",
    fontSize: 14,
    padding: "12px 0",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  clearBtn: {
    background: "transparent",
    border: "none",
    color: "#8b8fa8",
    cursor: "pointer",
    fontSize: 13,
    padding: "4px",
  },
  resultInfo: { fontSize: 12, color: "#8b8fa8", marginBottom: 10 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  empty: {
    textAlign: "center",
    color: "#8b8fa8",
    padding: "32px 0",
    fontSize: 14,
  },
  card: {
    background: "#1a1d27",
    border: "1px solid",
    borderRadius: 12,
    overflow: "hidden",
    transition: "border-color 0.15s",
  },
  cardHeader: {
    padding: "14px 18px",
    cursor: "pointer",
    position: "relative",
    paddingRight: 40,
  },
  wordRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  word: {
    fontSize: 17,
    fontWeight: 700,
    color: "#e8eaf6",
    letterSpacing: "0.2px",
  },
  phonetic: { fontSize: 13, color: "#8b8fa8" },
  posTags: { display: "flex", gap: 6, flexWrap: "wrap" },
  posTag: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    border: "1px solid",
    letterSpacing: "0.3px",
    textTransform: "uppercase",
  },
  preview: {
    fontSize: 13,
    color: "#8b8fa8",
    lineHeight: 1.5,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  chevron: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 10,
    color: "#8b8fa8",
  },
  cardBody: {
    padding: "0 18px 16px",
    borderTop: "1px solid #2e3350",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    paddingTop: 14,
  },
  defBlock: { display: "flex", flexDirection: "column", gap: 4 },
  posLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  defText: { fontSize: 14, color: "#e8eaf6", lineHeight: 1.6 },
  example: { fontSize: 13, color: "#8b8fa8", lineHeight: 1.5 },
};
