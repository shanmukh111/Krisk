# Krisk — Conversational AI Recommendation Engine

> Talk naturally. Get recommendations from YouTube, Amazon and Zomato — all at once. Now with persistent, graph-based memory powered by [Cognee](https://www.cognee.ai/).

![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-orange?style=flat-square)
![Cognee](https://img.shields.io/badge/Cognee-Knowledge%20Graph%20Memory-blueviolet?style=flat-square)
![Ollama](https://img.shields.io/badge/Ollama-Gemma3:12b-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## Hackathon Context — WeMakeDevs "The Hangover Part AI" (Cognee Hackathon)

This repo contains two layers, and it's important to be upfront about the line between them:

- **Pre-existing project (built before June 29, 2026):** Krisk itself — the voice-first, multi-agent recommendation engine described below. This was a personal project built prior to the hackathon and is **not** the hackathon submission on its own.
- **Hackathon build (June 29 – July 5, 2026):** Replacing Krisk's original ChromaDB-based conversation memory with **Cognee's graph-vector memory layer**. This is the actual submission — a from-scratch integration built during the hackathon window that gives Krisk persistent, relationship-aware memory of user preferences across sessions, using Cognee's `add`/`cognify`/`search` (and `improve`/`forget`) lifecycle.

The commit history in this repo reflects that split: the initial commit captures the pre-hackathon baseline, and all commits from June 29 onward are the actual hackathon work.

**AI assistance disclosure:** Significant portions of this hackathon build (the Cognee memory integration, debugging, and this README) were developed with assistance from Claude (Anthropic). This is disclosed per the hackathon's AI-usage policy.

### What changed for the hackathon
- `utils/memory.py` (ChromaDB) → `utils/cognee_memory.py` (Cognee knowledge graph)
- `agents/memory_agent.py` and `agents/intent_agent.py` now read/write through Cognee instead of Chroma
- `agents/ranker_agent.py` updated to boost recommendations using Cognee's recalled preference text
- A single persistent background event loop bridges Cognee's async API into the synchronous LangGraph agent functions, with conversation writes running as non-blocking background `cognify()` calls so the user-facing response isn't delayed
- Self-hosted, open-source stack: Ollama (Gemma3:12b) for graph extraction, no external LLM API key required for the memory layer

---

## What is Krisk?

Krisk is a voice-first AI recommendation app. Instead of searching across multiple platforms separately, you just talk — and Krisk understands your full intent, fetches results from multiple platforms simultaneously, ranks them intelligently, and speaks the recommendations back to you.

```
You say: "I'm hungry, craving biryani, also need new running shoes and show me tennis highlights"
         |
Krisk understands all 3 intents at once
         |
Fetches: Zomato food + Amazon products + YouTube videos — in parallel
         |
Ranks YouTube videos using Gemma3:12b vision model (actual video frames)
         |
Replies back with voice
```

---

## Key Features

- **Voice First** — speak naturally, get spoken recommendations back (OpenAI TTS Nova)
- **Multi-Intent Understanding** — detects food, shopping, and entertainment from one sentence
- **Parallel Multi-Platform** — hits Zomato, Amazon and YouTube simultaneously
- **Multimodal Video Ranking** — Gemma3:12b analyzes actual YouTube video frames, not just titles
- **Persistent Graph Memory (Cognee)** — remembers preferences as a knowledge graph, not flat text, and recalls them across sessions
- **Conversational Memory** — ask follow-ups like "why did the first one score 9?" and it knows context
- **Session Isolation** — each user session has independent memory via LangGraph MemorySaver

---

## Architecture

```
User Voice/Text Input
        |
        v
+-----------------------------------------------------+
|                   FastAPI Backend                   |
|                                                     |
|  Gemma3:12b Intent Classifier                       |
|  (followup? vs new request?)                        |
|        |                                            |
|        v                                            |
|  +--------------- LangGraph Pipeline -------------+ |
|  |                                                | |
|  |  audio -> transcript -> memory -> intent ->    | |
|  |        (Cognee recall)   (Cognee write)        | |
|  |                              routing           | |
|  |                                 |              | |
|  |              +-----------------+               | |
|  |              v         v        v              | |
|  |         [YouTube]  [Zomato]  [Amazon]          | |
|  |              +-----------------+               | |
|  |                       |                        | |
|  |                  [Ranker Agent]                 | |
|  |               (Cognee preference boost)         | |
|  +------------------------------------------------+ |
|                       |                             |
|              GPT-4o-mini Reply                      |
+-----------------------------------------------------+
        |
        v
React Frontend (Voice Orb + Chat + Recommendation Cards)
```

### Cognee Memory Flow

```
intent_agent extracts: {item, category, mood, context}
        |
        v
cognee.add(formatted_text) -> cognee.cognify()   [background, non-blocking]
        |
Knowledge graph grows: entities (pizza, user, mood) + relationships
        |
        v
Next turn: memory_agent calls cognee.search(transcript)
        |
Graph + vector hybrid search returns relevant recalled facts
        |
ranker_agent boosts recommendations matching recalled preferences
```

### YouTube Multimodal Ranking

```
YouTube API -> 6 videos
    |
For each video:
  |- Text relevance score    (title + description match)
  |- Metadata score          (views + subscribers + freshness)
  +- Visual score            (Gemma3:12b analyzes 4 video frames)
    |
Final Score = Text x 0.4 + Metadata x 0.4 + Visual x 0.2
    |
Top results sorted by final_score
```

---

## Tech Stack

### Backend
| Component | Technology |
|---|---|
| Framework | FastAPI (Python 3.12) |
| Agent Orchestration | LangGraph |
| Intent Extraction | GPT-4o-mini |
| Vision / Intent Model | Gemma3:12b via Ollama |
| **Conversation Memory** | **Cognee (knowledge graph + vector hybrid)** |
| Speech to Text | OpenAI Whisper (base) |
| Text to Speech | OpenAI TTS (Nova voice) |
| Session Memory | LangGraph MemorySaver |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 18 |
| Voice Input | Web Speech API |
| Styling | CSS-in-JS (custom dark theme) |
| Fonts | Google Fonts (Sora + DM Mono) |

### External APIs
| Platform | API |
|---|---|
| YouTube | YouTube Data API v3 |
| Shopping | Amazon via RapidAPI |
| LLM | OpenAI GPT-4o-mini |
| Vision / Graph Extraction | Ollama Gemma3:12b (local / remote GPU) |

---

## Project Structure

```
krisk/
├── backend/
│   ├── server.py              # FastAPI routes (/chat /recommend /speak /transcribe)
│   ├── pipeline.py            # LangGraph graph — wires all 9 agents
│   ├── state.py               # PipelineState TypedDict
│   ├── config.py              # API keys and settings
│   ├── agents/
│   │   ├── intent_agent.py    # GPT-4o-mini extracts intents, mood, context
│   │   ├── routing_agent.py   # Decides which platforms to activate
│   │   ├── youtube_agent.py   # YouTube search + multimodal ranking trigger
│   │   ├── zomato_agent.py    # Food recommendations
│   │   ├── flipkart_agent.py  # Amazon product search
│   │   ├── ranker_agent.py    # Merges and sorts all platform results
│   │   ├── memory_agent.py    # Cognee preference retrieval
│   │   └── transcript_agent.py
│   └── utils/
│       ├── youtube_ranker.py    # Gemma3 multimodal ranking logic
│       ├── amazon_api.py        # RapidAPI Amazon search
│       ├── cognee_memory.py     # Cognee knowledge-graph memory (hackathon build)
│       └── memory.py            # Legacy ChromaDB memory (superseded)
└── convo-frontend/
    └── src/
        └── App.js             # Full React UI
```

---

## Getting Started

### Prerequisites
- Python 3.10+, Node.js 18+
- ffmpeg: `sudo apt install ffmpeg`
- Ollama with Gemma3 pulled (`ollama pull gemma3:12b`, `ollama pull nomic-embed-text`)
- API Keys: OpenAI, YouTube Data v3, RapidAPI

### 1. Clone the repo
```bash
git clone https://github.com/shanmukh111/Krisk.git
cd Krisk
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn openai langgraph langchain langchain-openai \
    cognee openai-whisper sounddevice httpx ollama python-multipart requests
```

### 3. Configure environment
Create a `.env` file in `backend/`:
```
OPENAI_API_KEY=sk-...
LLM_PROVIDER=ollama
LLM_MODEL=gemma3:12b
LLM_ENDPOINT=http://localhost:11434/v1
LLM_API_KEY=ollama
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSIONS=768
```

### 4. Start Ollama with Gemma3
```bash
ollama serve
```

### 5. Start Backend
```bash
uvicorn server:app --port 8000 --host 0.0.0.0
```

### 6. Start Frontend
```bash
cd ../convo-frontend
npm install
HTTPS=true npm start
```

### 7. Test
```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"transcript": "show me tennis highlights", "conversation_history": []}'
```

---

## Roadmap

- [x] Multi-agent LangGraph pipeline
- [x] Gemma3 multimodal YouTube ranking
- [x] Voice input/output (Whisper + TTS)
- [x] Session memory and followup detection
- [x] Cognee knowledge-graph memory layer (hackathon build)
- [ ] Knowledge graph visualization in frontend
- [ ] `improve()` — cross-conversation preference enrichment
- [ ] `forget()` — preference pruning
- [ ] Deploy to Railway + Vercel

---

## Author

**Shanmukha Srinivas Regidi**
IIT Goa | AI/ML Developer
[GitHub](https://github.com/shanmukh111)

---

## License

MIT License — feel free to use, modify and build on top of this.