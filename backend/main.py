import os
import re
import json
import html
import asyncio
import httpx
from collections import Counter

import fitz  # PyMuPDF
from wordfreq import zipf_frequency
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Vocab Extractor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ───────────────────────────────────────────────────────────────────
DICT_API     = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
MYMEMORY_API = "https://api.mymemory.translated.net/get?q={text}&langpair=en|{lang}"
GROQ_API     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.1-8b-instant"
GROQ_KEY     = os.getenv("GROQ_API_KEY", "")

ZIPF_THRESHOLD = 4.3


# ── Models ───────────────────────────────────────────────────────────────────
class LookupRequest(BaseModel):
    word: str


# ── Helpers ──────────────────────────────────────────────────────────────────
async def fetch_dictionary(word: str, client: httpx.AsyncClient) -> dict | None:
    try:
        r = await client.get(DICT_API.format(word=word), timeout=6.0)
        if r.status_code != 200:
            return None
        data = r.json()
        if not data or not isinstance(data, list):
            return None

        entry = data[0]
        phonetic = entry.get("phonetic", "")

        # Try to find phonetic from phonetics list if top-level missing
        if not phonetic:
            for ph in entry.get("phonetics", []):
                if ph.get("text"):
                    phonetic = ph["text"]
                    break

        meanings = entry.get("meanings", [])
        definitions = []
        synonyms = []

        for meaning in meanings:
            pos = meaning.get("partOfSpeech", "")
            defs = meaning.get("definitions", [])
            syns = meaning.get("synonyms", [])
            synonyms.extend(syns[:3])
            if defs:
                definitions.append({
                    "partOfSpeech": pos,
                    "definition": defs[0].get("definition", ""),
                    "example": defs[0].get("example", ""),
                    "synonyms": syns[:3],
                    "antonyms": meaning.get("antonyms", [])[:2],
                })

        if not definitions:
            return None

        return {
            "word": entry.get("word", word),
            "phonetic": phonetic,
            "definitions": definitions,
            "synonyms": list(dict.fromkeys(synonyms))[:5],
        }
    except Exception:
        return None


async def translate(text: str, lang: str, client: httpx.AsyncClient) -> str:
    try:
        url = MYMEMORY_API.format(text=text, lang=lang)
        r = await client.get(url, timeout=6.0)
        if r.status_code != 200:
            return "—"
        data = r.json()
        translated = data.get("responseData", {}).get("translatedText", "").strip()
        # Decode HTML entities (MyMemory returns e.g. &#39; instead of ')
        translated = html.unescape(translated)
        # MyMemory sometimes returns the original word if it can't translate
        if translated.lower() == text.lower() or not translated:
            return "—"
        return translated
    except Exception:
        return "—"


async def groq_generate(word: str, pos: str, definition: str, example: str,
                         synonyms: list[str], client: httpx.AsyncClient) -> dict:
    """
    Use Groq's free LLM to generate:
    - A simple example sentence (if none from dictionary)
    - 2-3 common mistakes ESL learners make
    - 2-3 best usage contexts
    Falls back to rule-based if GROQ_API_KEY not set.
    """
    need_example = not example or not example.strip()

    if not GROQ_KEY:
        result = _rule_based_mistakes(word, pos, definition, synonyms)
        if need_example:
            result["example"] = f"She showed great {word} in her work."
        return result

    syn_text = ", ".join(synonyms) if synonyms else "none"
    example_instruction = (
        f'3. example: a single SHORT sentence (8-12 words) using "{word}" naturally.\n'
        if need_example else ""
    )
    example_json = ', "example": "..."' if need_example else ""

    prompt = (
        f'English word: "{word}" | POS: {pos} | Definition: {definition}\n'
        f'Synonyms: {syn_text}\n\n'
        f'Generate for an ESL learner (Russian/Uzbek background):\n'
        f'1. mistakes: array of 2-3 SHORT strings (max 15 words each). '
        f'Common errors — wrong POS, wrong preposition, confusion with similar words. '
        f'Format: "mistake — why it\'s wrong".\n'
        f'2. usageContexts: array of 2-3 SHORT strings (max 12 words each). '
        f'Specific contexts where this word fits best.\n'
        f'{example_instruction}'
        f'\nReply ONLY with valid JSON: '
        f'{{"mistakes": [...], "usageContexts": [...]{example_json}}}'
    )

    try:
        r = await client.post(
            GROQ_API,
            headers={"Authorization": f"Bearer {GROQ_KEY}",
                     "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 300,
            },
            timeout=10.0,
        )
        if r.status_code != 200:
            return _rule_based_mistakes(word, pos, definition, synonyms)

        content = r.json()["choices"][0]["message"]["content"].strip()
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            result = {
                "mistakes":      parsed.get("mistakes", [])[:3],
                "usageContexts": parsed.get("usageContexts", [])[:3],
            }
            if need_example and parsed.get("example"):
                result["example"] = parsed["example"]
            return result
    except Exception:
        pass

    return _rule_based_mistakes(word, pos, definition, synonyms)


def _rule_based_mistakes(word: str, pos: str, definition: str,
                          synonyms: list[str]) -> dict:
    """Fallback rule-based mistake generation when Groq key not available."""
    mistakes = []
    usage = []
    definition_lower = definition.lower()

    if pos == "noun":
        mistakes.append(
            f"❌ Using '{word}' as a verb — it's a noun (thing/concept), not an action"
        )
        if synonyms:
            mistakes.append(
                f"❌ Swapping with '{synonyms[0]}' without checking the nuance — "
                f"similar meaning but different connotation"
            )
        if "uncountable" in definition_lower or "abstract" in definition_lower:
            mistakes.append(f"❌ '{word}s' — this noun is often uncountable, no plural needed")

    elif pos == "verb":
        mistakes.append(
            f"❌ Forgetting third-person 's' — he/she/it {word}s (not {word})"
        )
        mistakes.append(
            f"❌ Using '{word}' without the right preposition — "
            f"check which preposition it pairs with"
        )

    elif pos == "adjective":
        mistakes.append(
            f"❌ Placing '{word}' after the noun — adjectives go BEFORE nouns in English"
        )
        mistakes.append(
            f"❌ Using '{word}' as a noun — it describes something, it IS NOT a thing"
        )

    elif pos == "adverb":
        mistakes.append(
            f"❌ Using the adjective form instead — add '-ly' for the adverb: {word}"
        )
        mistakes.append(
            f"❌ Placing '{word}' at the wrong position — adverbs usually go before the verb"
        )

    else:
        mistakes.append(
            f"❌ Confusing '{word}' with similar-sounding words — check pronunciation carefully"
        )
        mistakes.append(
            f"❌ Using '{word}' in the wrong register — check if it's formal or informal"
        )

    # Add formal/informal usage note from definition
    if "formal" in definition_lower:
        mistakes.append(f"❌ Casual use — '{word}' is formal; avoid in everyday speech")
        usage.append("Academic writing, professional emails, formal reports")
        usage.append("Official documents and presentations")
    elif "informal" in definition_lower or "colloquial" in definition_lower:
        mistakes.append(f"❌ Formal use — '{word}' is informal/colloquial")
        usage.append("Casual conversations with friends")
        usage.append("Informal writing (chats, social media)")
    else:
        usage.append("Both written and spoken English")
        usage.append("Professional and academic contexts")
        usage.append(f"When describing {definition_lower[:40].rstrip(' ,.').rstrip()}…")

    return {"mistakes": mistakes[:3], "usageContexts": usage[:3]}


# ── PDF helpers (kept from original feature) ─────────────────────────────────
STOP_WORDS = {
    "i","me","my","we","our","you","your","he","him","his","she","her","it",
    "its","they","them","their","this","that","these","those","am","is","are",
    "was","were","be","been","being","have","has","had","do","does","did",
    "will","would","could","should","may","might","shall","can","not","and",
    "but","or","if","as","at","by","for","of","on","to","up","in","out",
    "no","so","a","an","the","fig","figure","table","page","chapter","section",
}

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return "".join(page.get_text() for page in doc)

def deduplicate_forms(words: list[str]) -> list[str]:
    word_set = set(words)
    keep, seen_roots = [], set()
    for w in words:
        root = None
        for suffix, min_len in [("ies",3),("es",3),("s",3),("ing",4),
                                 ("tion",4),("tions",4),("ed",3),("ly",3),
                                 ("ness",4),("ment",4),("ments",4)]:
            if w.endswith(suffix) and len(w)-len(suffix) >= min_len:
                cr = w[:-len(suffix)]
                if suffix == "ies": cr += "y"
                if cr in word_set and cr != w:
                    root = cr; break
        if root and root in seen_roots:
            continue
        seen_roots.add(w)
        keep.append(w)
    return keep

def tokenize_and_filter(text: str) -> list[str]:
    tokens = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    candidates = [w for w in tokens
                  if len(w)>=4 and w not in STOP_WORDS
                  and zipf_frequency(w,"en") < ZIPF_THRESHOLD]
    freq = Counter(candidates)
    return deduplicate_forms([w for w,_ in freq.most_common()])

async def fetch_definition_simple(word: str, client: httpx.AsyncClient) -> dict | None:
    try:
        r = await client.get(DICT_API.format(word=word), timeout=6.0)
        if r.status_code != 200: return None
        data = r.json()
        if not data or not isinstance(data, list): return None
        entry = data[0]
        phonetic = entry.get("phonetic","")
        if not phonetic:
            for ph in entry.get("phonetics",[]):
                if ph.get("text"): phonetic = ph["text"]; break
        meanings = entry.get("meanings",[])
        defs = []
        for m in meanings:
            d = m.get("definitions",[])
            if d:
                defs.append({"partOfSpeech": m.get("partOfSpeech",""),
                             "definition": d[0].get("definition",""),
                             "example": d[0].get("example","")})
            if len(defs) >= 2: break
        return {"word": word, "phonetic": phonetic, "definitions": defs} if defs else None
    except Exception:
        return None


# ── Routes ───────────────────────────────────────────────────────────────────

@app.post("/lookup")
async def lookup_word(req: LookupRequest):
    """
    Look up a single word and return full vocabulary entry:
    IPA pronunciation, RU/UZ translations, definition, example,
    common mistakes, and best usage contexts.
    """
    word = req.word.strip().lower()
    if not word or not word.replace("-", "").isalpha():
        raise HTTPException(status_code=400, detail="Please provide a valid English word.")

    async with httpx.AsyncClient() as client:
        # Run dictionary lookup and both translations concurrently
        dict_data, ru, uz = await asyncio.gather(
            fetch_dictionary(word, client),
            translate(word, "ru", client),
            translate(word, "uz", client),
        )

    if not dict_data:
        raise HTTPException(
            status_code=404,
            detail=f'Word "{word}" not found in dictionary. Check spelling.'
        )

    first = dict_data["definitions"][0]
    pos        = first["partOfSpeech"]
    definition = first["definition"]
    example    = first["example"]
    synonyms   = dict_data.get("synonyms", [])

    # Generate mistakes & usage (Groq if key available, else rule-based)
    async with httpx.AsyncClient() as client:
        extras = await groq_generate(word, pos, definition, example, synonyms, client)

    # Use Groq-generated example if dictionary had none
    final_example = example or extras.get("example", "")

    return {
        "word":         dict_data["word"],
        "phonetic":     dict_data["phonetic"],
        "translations": {"russian": ru, "uzbek": uz},
        "definitions":  dict_data["definitions"],   # all POS
        "partOfSpeech": pos,
        "definition":   definition,
        "example":      final_example,
        "synonyms":     synonyms,
        "mistakes":     extras["mistakes"],
        "usageContexts": extras["usageContexts"],
    }


@app.post("/extract")
async def extract_vocab(file: UploadFile = File(...)):
    """Upload a PDF → list of uncommon vocab words with definitions."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    try:
        text = extract_text_from_pdf(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {e}")
    if not text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in this PDF.")

    candidates = tokenize_and_filter(text)
    vocab_list = []
    async with httpx.AsyncClient() as client:
        for i in range(0, len(candidates), 25):
            batch = candidates[i: i + 25]
            results = await asyncio.gather(
                *[fetch_definition_simple(w, client) for w in batch]
            )
            vocab_list.extend(r for r in results if r)

    if not vocab_list:
        raise HTTPException(status_code=404,
                            detail="No vocabulary words found in this PDF.")
    return {"count": len(vocab_list), "vocab": vocab_list}


@app.get("/health")
def health():
    return {"status": "ok"}
