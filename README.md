# Krisk — Conversational AI Recommendation Engine

> Talk naturally. Get recommendations from YouTube, Amazon and Zomato — all at once.

![Python](https://img.shields.io/badge/Python-3.9-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-orange?style=flat-square)
![Ollama](https://img.shields.io/badge/Ollama-Gemma3:12b-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

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
- **Conversational Memory** — ask follow-ups like "why did the first one score 9?" and it knows context
- **Session Isolation** — each user session has independent memory via LangGraph MemorySaver
- **ChromaDB Memory** — remembers your preferences across conversations

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
|  |                              routing           | |
|  |                                 |              | |
|  |              +-----------------+               | |
|  |              v         v        v              | |
|  |         [YouTube]  [Zomato]  [Amazon]          | |
|  |              +-----------------+               | |
|  |                       |                        | |
|  |                  [Ranker Agent]                 | |
|  +------------------------------------------------+ |
|                       |                             |
|              GPT-4o-mini Reply                      |
+-----------------------------------------------------+
        |
        v
React Frontend (Voice Orb + Chat + Recommendation Cards)
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
| Framework | FastAPI (Python 3.9) |
| Agent Orchestration | LangGraph |
| Intent Extraction | GPT-4o-mini |
| Vision / Intent Model | Gemma3:12b via Ollama |
| Speech to Text | OpenAI Whisper (base) |
| Text to Speech | OpenAI TTS (Nova voice) |
| Vector Memory | ChromaDB |
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
| Vision | Ollama Gemma3:12b (local / remote GPU) |

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
│   │   ├── memory_agent.py    # ChromaDB preference retrieval
│   │   └── transcript_agent.py
│   └── utils/
│       ├── youtube_ranker.py  # Gemma3 multimodal ranking logic
│       ├── amazon_api.py      # RapidAPI Amazon search
│       └── memory.py          # ChromaDB save/retrieve
└── convo-frontend/
    └── src/
        └── App.js             # Full React UI
```

---

## Getting Started

### Prerequisites
- Python 3.9+, Node.js 18+
- ffmpeg: `sudo apt install ffmpeg`
- Ollama with Gemma3 pulled
- API Keys: OpenAI, YouTube Data v3, RapidAPI

### 1. Clone the repo
```bash
git clone https://github.com/shanmukh1911/Krisk.git
cd Krisk
```

### 2. Backend Setup
```bash
cd backend
python3.9 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn openai langgraph langchain langchain-openai \
    chromadb pysqlite3-binary openai-whisper sounddevice httpx ollama
```

### 3. Start Ollama with Gemma3
```bash
# Local (CPU):
ollama pull gemma3:4b
ollama serve

# Remote GPU (recommended):
OLLAMA_HOST=0.0.0.0 ollama serve
# Update OLLAMA_HOST in config.py to point to your GPU machine IP
```

### 4. Start Backend
```bash
uvicorn server:app --port 8000 --host 0.0.0.0
```

### 5. Start Frontend
```bash
cd ../convo-frontend
npm install
HTTPS=true npm start
```

### 6. Test
```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"transcript": "show me tennis highlights", "conversation_history": []}'
```

---

## Configuration

Edit `backend/config.py`:
```python
OPENAI_API_KEY      = "sk-..."
YOUTUBE_API_KEY     = "AIza..."
RAPIDAPI_KEY        = "..."
OLLAMA_HOST         = "http://localhost:11434"   # or remote GPU IP
OLLAMA_VISION_MODEL = "gemma3:12b"              # or gemma3:4b for CPU
```

---

## Roadmap

- [x] Multi-agent LangGraph pipeline
- [x] Gemma3 multimodal YouTube ranking
- [x] Voice input/output (Whisper + TTS)
- [x] Session memory and followup detection
- [x] Amazon product search
- [ ] Spotify mood-based music agent
- [ ] RLHF — thumbs up/down feedback on cards
- [ ] Deploy to Railway + Vercel
- [ ] React Native mobile app
- [ ] Wake word: "Hey Krisk"

---

## Author

**Shanmukha Srinivas Regidi**  
IIT Goa | AI/ML Developer  
[GitHub](https://github.com/shanmukh1911)

---

## License

MIT License — feel free to use, modify and build on top of this.
