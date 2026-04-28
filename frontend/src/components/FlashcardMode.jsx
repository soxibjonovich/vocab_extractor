import { useState, useEffect } from "react";

export default function FlashcardMode({ words }) {
  const [index,   setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode,    setMode]    = useState("word"); // word | definition | translation
  const [score,   setScore]   = useState({ known: 0, learning: 0 });
  const [done,    setDone]    = useState(false);
  const [deck,    setDeck]    = useState(words);

  // Shuffle on mount
  useEffect(() => {
    setDeck([...words].sort(() => Math.random() - 0.5));
    setIndex(0); setFlipped(false); setScore({ known: 0, learning: 0 }); setDone(false);
  }, [words]);

  if (words.length === 0) {
    return (
      <div style={s.empty}>
        <span style={{ fontSize: 40 }}>🃏</span>
        <p style={s.emptyTitle}>No flashcards yet</p>
        <p style={s.emptyNote}>Save some words first, then come back to study!</p>
      </div>
    );
  }

  if (done) {
    const total = score.known + score.learning;
    const pct   = Math.round((score.known / total) * 100);
    return (
      <div style={s.done}>
        <span style={{ fontSize: 52 }}>{pct >= 70 ? "🎉" : "💪"}</span>
        <h2 style={s.doneTitle}>Round complete!</h2>
        <p style={s.doneSub}>{score.known} knew · {score.learning} still learning</p>
        <div style={s.doneBar}>
          <div style={{ ...s.doneBarFill, width: `${pct}%` }} />
        </div>
        <p style={s.donePct}>{pct}% known</p>
        <button style={s.btnPrimary} onClick={() => {
          setDeck([...words].sort(() => Math.random() - 0.5));
          setIndex(0); setFlipped(false); setScore({ known: 0, learning: 0 }); setDone(false);
        }}>🔄 Shuffle & retry</button>
      </div>
    );
  }

  const card = deck[index];
  if (!card) return null;

  const progress = Math.round((index / deck.length) * 100);

  function next(knew) {
    setScore(s => ({ ...s, known: knew ? s.known + 1 : s.known, learning: knew ? s.learning : s.learning + 1 }));
    if (index + 1 >= deck.length) { setDone(true); return; }
    setIndex(i => i + 1);
    setFlipped(false);
  }

  const MODES = [
    { id: "word",       label: "Word → Definition" },
    { id: "definition", label: "Definition → Word" },
    { id: "translation",label: "Translation → Word" },
  ];

  return (
    <div style={s.wrap}>
      {/* Mode selector */}
      <div style={s.modeSel}>
        {MODES.map(m => (
          <button key={m.id} style={{ ...s.modeBtn, ...(mode === m.id ? s.modeBtnActive : {}) }}
            onClick={() => { setMode(m.id); setFlipped(false); }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div style={s.progressRow}>
        <span style={s.progressLabel}>{index + 1} / {deck.length}</span>
        <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${progress}%` }} /></div>
        <span style={s.progressLabel}>{score.known} ✓</span>
      </div>

      {/* Card */}
      <div style={{ ...s.card, ...(flipped ? s.cardFlipped : {}) }} onClick={() => setFlipped(f => !f)}>
        {!flipped ? (
          <div style={s.front}>
            <p style={s.tapHint}>tap to flip</p>
            {mode === "word" && (
              <>
                <h2 style={s.mainWord}>{card.word}</h2>
                {card.phonetic && <p style={s.mainPhonetic}>📢 {card.phonetic}</p>}
                <span style={s.mainPos}>{card.partOfSpeech}</span>
              </>
            )}
            {mode === "definition" && (
              <>
                <p style={s.mainDef}>{card.definition}</p>
                {card.example && <p style={s.mainEx}>"{card.example}"</p>}
              </>
            )}
            {mode === "translation" && (
              <>
                <p style={s.mainTrans}>🇷🇺 {card.translations?.russian || "—"}</p>
                <p style={s.mainTrans}>🇺🇿 {card.translations?.uzbek   || "—"}</p>
              </>
            )}
          </div>
        ) : (
          <div style={s.back}>
            <p style={s.tapHint}>tap to flip back</p>
            {mode === "word" ? (
              <>
                <p style={s.backWord}>{card.word}</p>
                <p style={s.backDef}>{card.definition}</p>
                {card.example && <p style={s.backEx}>"{card.example}"</p>}
                <div style={s.backTrans}>
                  <span>🇷🇺 {card.translations?.russian || "—"}</span>
                  <span style={{ opacity: .4 }}>|</span>
                  <span>🇺🇿 {card.translations?.uzbek || "—"}</span>
                </div>
              </>
            ) : (
              <>
                <h2 style={s.mainWord}>{card.word}</h2>
                {card.phonetic && <p style={s.mainPhonetic}>📢 {card.phonetic}</p>}
                <p style={s.backDef}>{card.definition}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {flipped && (
        <div style={s.btns}>
          <button style={s.btnLearning} onClick={() => next(false)}>🔁 Still learning</button>
          <button style={s.btnKnow}     onClick={() => next(true)}>✓ I knew it!</button>
        </div>
      )}

      {!flipped && (
        <button style={s.btnSkip} onClick={() => next(false)}>Skip →</button>
      )}
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 16 },
  modeSel: { display: "flex", gap: 6, flexWrap: "wrap" },
  modeBtn: { padding: "6px 14px", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 8, fontSize: 12, fontWeight: 600 },
  modeBtnActive: { background: "var(--accent)", border: "1px solid var(--accent)", color: "#fff" },
  progressRow: { display: "flex", alignItems: "center", gap: 10 },
  progressLabel: { fontSize: 12, color: "var(--muted)", minWidth: 40 },
  progressBar: { flex: 1, height: 5, background: "var(--surface2)", borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", background: "var(--accent)", borderRadius: 10, transition: "width .4s" },
  card: { background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 20, minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: "32px 28px", textAlign: "center", transition: "border-color .2s, background .2s", userSelect: "none" },
  cardFlipped: { borderColor: "var(--accent)", background: "rgba(108,99,255,.05)" },
  front: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" },
  back:  { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" },
  tapHint: { fontSize: 11, color: "var(--muted)", marginBottom: 4 },
  mainWord: { fontSize: 36, fontWeight: 800, letterSpacing: "-.5px" },
  mainPhonetic: { fontSize: 16, color: "var(--muted)", fontStyle: "italic" },
  mainPos: { fontSize: 12, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", background: "rgba(108,99,255,.12)", padding: "3px 10px", borderRadius: 12 },
  mainDef: { fontSize: 17, lineHeight: 1.6, maxWidth: 480 },
  mainEx: { fontSize: 14, color: "var(--muted)", fontStyle: "italic" },
  mainTrans: { fontSize: 22, fontWeight: 700 },
  backWord: { fontSize: 26, fontWeight: 800, color: "var(--accent)", marginBottom: 4 },
  backDef: { fontSize: 15, color: "var(--text)", lineHeight: 1.6, maxWidth: 460 },
  backEx: { fontSize: 13, color: "var(--muted)", fontStyle: "italic" },
  backTrans: { display: "flex", gap: 12, fontSize: 14, color: "var(--muted)", flexWrap: "wrap", justifyContent: "center" },
  btns: { display: "flex", gap: 12 },
  btnLearning: { flex: 1, padding: "13px", background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", color: "var(--red)", borderRadius: 12, fontSize: 14, fontWeight: 700 },
  btnKnow: { flex: 1, padding: "13px", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)", color: "var(--green)", borderRadius: 12, fontSize: 14, fontWeight: 700 },
  btnSkip: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 13, alignSelf: "flex-end" },
  btnPrimary: { padding: "12px 28px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700 },
  empty: { textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 700 },
  emptyNote: { fontSize: 14, color: "var(--muted)" },
  done: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  doneTitle: { fontSize: 24, fontWeight: 800 },
  doneSub: { fontSize: 15, color: "var(--muted)" },
  doneBar: { width: "100%", maxWidth: 300, height: 10, background: "var(--surface2)", borderRadius: 10, overflow: "hidden" },
  doneBarFill: { height: "100%", background: "var(--green)", borderRadius: 10, transition: "width .6s" },
  donePct: { fontSize: 18, fontWeight: 700, color: "var(--green)" },
};
