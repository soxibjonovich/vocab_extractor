import { useState } from "react";

export default function WordInput({ onSearch, loading }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    const w = value.trim();
    if (w) onSearch(w);
  }

  return (
    <form onSubmit={submit} style={s.form}>
      <div style={s.inputWrap}>
        <span style={s.icon}>🔍</span>
        <input
          style={s.input}
          placeholder="Enter an English word…"
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={loading}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {value && !loading && (
          <button type="button" style={s.clear} onClick={() => setValue("")}>✕</button>
        )}
      </div>
      <button type="submit" disabled={!value.trim() || loading} style={s.btn}>
        {loading ? "Looking up…" : "Look up →"}
      </button>
    </form>
  );
}

const s = {
  form: { display: "flex", gap: 10, marginBottom: 20 },
  inputWrap: { flex: 1, display: "flex", alignItems: "center", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "0 14px", transition: "border-color .2s" },
  icon: { fontSize: 16, marginRight: 8, opacity: .6 },
  input: { flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 16, padding: "14px 0" },
  clear: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 13, padding: "4px" },
  btn: { padding: "0 24px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", opacity: 1, transition: "opacity .2s" },
};
