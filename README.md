# Vocab Extractor

Upload a PDF reading passage → get a clean list of uncommon vocabulary words with definitions.

**Tech stack:** FastAPI (Python) · React + Vite · Free Dictionary API  
**Hosting:** Render (backend) · GitHub Pages (frontend)

---

## Project Structure

```
vocab_extractor/
├── backend/
│   ├── main.py            # FastAPI app
│   ├── requirements.txt
│   └── render.yaml        # Render deployment config
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── FileUpload.jsx
│   │       └── VocabList.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js     # base path = /vocab_extractor/
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml
└── .gitignore
```

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API runs at http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local and add:
# VITE_API_URL=http://localhost:8000
npm run dev
# App runs at http://localhost:5173/vocab_extractor/
```

---

## Deployment

### 1. Backend → Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo.
4. Set **Root Directory** to `backend`.
5. Render will auto-detect `render.yaml`. Deploy.
6. Copy your Render URL (e.g. `https://vocab-extractor-api.onrender.com`).

### 2. Frontend → GitHub Pages

1. In your GitHub repo → **Settings → Pages** → Source: **GitHub Actions**.
2. Go to **Settings → Secrets → Actions** → add secret:
   - `VITE_API_URL` = your Render URL (e.g. `https://vocab-extractor-api.onrender.com`)
3. In `frontend/vite.config.js`, make sure `base` matches your repo name:
   ```js
   base: "/vocab_extractor/",   // ← change if your repo is named differently
   ```
4. Push to `main` — GitHub Actions builds and deploys automatically.
5. Your app is live at `https://<your-username>.github.io/vocab_extractor/`

---

## How It Works

1. PDF is uploaded to the FastAPI backend.
2. **PyMuPDF** extracts all text.
3. **NLTK stopwords** + a custom filter remove common/filler words (length < 4, "yes", "no", "thank", etc.).
4. Remaining unique words are sent concurrently to the **Free Dictionary API** (dictionaryapi.dev).
5. Words that have valid definitions are returned with part-of-speech, definition, and example sentence.

> **Note:** Render's free tier sleeps after 15 min of inactivity. The first request after sleep may take ~30 seconds to wake up.
