import { useState, useRef } from "react";

export default function FileUpload({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      onFile(file);
    } else {
      alert("Please drop a PDF file.");
    }
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      style={{
        ...s.zone,
        borderColor: dragging ? "#6c63ff" : "#2e3350",
        background: dragging ? "rgba(108,99,255,0.06)" : "#1a1d27",
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      <div style={s.icon}>📄</div>
      <p style={s.headline}>Drop your PDF here</p>
      <p style={s.sub}>or click to browse</p>

      <div style={s.badges}>
        <span style={s.badge}>PDF only</span>
        <span style={s.badge}>Max ~5 MB recommended</span>
      </div>

      <button
        style={s.btn}
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
      >
        Choose file
      </button>

      <p style={s.hint}>
        The app extracts non-common English words and fetches their definitions
        automatically.
      </p>
    </div>
  );
}

const s = {
  zone: {
    border: "2px dashed",
    borderRadius: 16,
    padding: "56px 32px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  icon: { fontSize: 52, lineHeight: 1 },
  headline: { fontSize: 20, fontWeight: 700, color: "#e8eaf6" },
  sub: { fontSize: 14, color: "#8b8fa8", marginTop: -4 },
  badges: { display: "flex", gap: 8, marginTop: 4 },
  badge: {
    fontSize: 12,
    background: "rgba(108,99,255,0.15)",
    color: "#6c63ff",
    padding: "3px 10px",
    borderRadius: 20,
    fontWeight: 500,
  },
  btn: {
    marginTop: 12,
    padding: "11px 28px",
    background: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  hint: {
    fontSize: 12,
    color: "#8b8fa8",
    maxWidth: 380,
    marginTop: 8,
    lineHeight: 1.5,
  },
};
