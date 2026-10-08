# VoiceBox

**A one-button voice recorder for elderly parents that transcribes, summarizes, and delivers organized updates to family members.**

## How It Works

1. **Senior parent** taps the big red button, speaks, taps again
2. Audio uploads to the server automatically
3. AI transcribes (Whisper) and summarizes (Claude) the message
4. **Family member** sees organized, categorized notes in their feed

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  FRONTEND (React PWA)                                │
│                                                      │
│  Senior: Big record button → upload                  │
│  Family: Card feed of transcribed + summarized notes │
└───────────────────┬──────────────────────────────────┘
                    │  REST API
┌───────────────────▼──────────────────────────────────┐
│  BACKEND (Node.js + Express)                         │
│                                                      │
│  Auth (PIN) → Upload → Whisper → Claude → SQLite     │
└──────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Transcription | OpenAI Whisper API |
| Summarization | Claude API (Anthropic) |
| Auth | PIN-based (keyed PIN hashes, expiring HMAC tokens, rate limited) |
| Storage | Local disk (MVP) |

## Setup

### Prerequisites

- Node.js 20+
- OpenAI API key (Whisper)
- Anthropic API key (Claude)

### Install & Run

```bash
# Backend
cd backend
cp .env.example .env    # Fill in API keys and AUTH_SECRET
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Create a Family

```bash
curl -X POST http://localhost:3001/api/family \
  -H "Content-Type: application/json" \
  -d '{
    "familyName": "The Smiths",
    "seniorName": "Mom",
    "seniorPin": "1234",
    "memberName": "Sarah",
    "memberPin": "5678"
  }'
```

Then log in with PIN `1234` (senior recorder) or `5678` (family feed).

## Security Notes

- `AUTH_SECRET` signs login tokens and keys the PIN hashes. The server refuses to start in production without a strong one. Generate it with `openssl rand -hex 32`.
- PINs are stored as keyed HMAC hashes, never in plaintext. Existing plaintext PINs are converted on startup.
- Login tokens expire after `TOKEN_TTL_DAYS` (default 30). The app returns to the PIN screen when a token expires.
- Login and family creation are rate limited per IP, with a global ceiling. Set `TRUST_PROXY` to the number of proxy hops when running behind a reverse proxy so limits apply per client.
- PINs double as login identifiers, so two families can never share a code. Rate limiting bounds how fast anyone can probe for codes in use; longer PINs (up to 8 digits) make probing slower still.
- Logs record note IDs, lengths, and categories, never transcript or summary text.
- Deleting a note deletes its audio file.

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server (serves frontend in prod)
│   │   ├── db.js                 # SQLite setup + schema
│   │   ├── middleware/auth.js    # PIN token auth
│   │   ├── routes/
│   │   │   ├── auth.js           # POST /api/auth/login
│   │   │   ├── notes.js          # Voice note CRUD + upload
│   │   │   └── family.js         # Family onboarding
│   │   └── services/
│   │       ├── transcription.js  # Whisper API
│   │       ├── summarizer.js     # Claude API
│   │       ├── processor.js      # AI pipeline orchestrator
│   │       └── storage.js        # Audio file storage
│   ├── data/                     # SQLite DB + audio files (gitignored)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # State-based routing
│   │   ├── screens/
│   │   │   ├── Login.jsx         # PIN numpad
│   │   │   ├── SeniorRecorder.jsx # Big record button
│   │   │   └── FamilyFeed.jsx    # Note cards feed
│   │   ├── components/
│   │   │   ├── PinPad.jsx        # Large numpad
│   │   │   ├── RecordButton.jsx  # Animated record circle
│   │   │   ├── AudioPlayer.jsx   # Simple play/stop
│   │   │   └── NoteCard.jsx      # Voice note card
│   │   ├── hooks/
│   │   │   ├── useAuth.js        # Auth state
│   │   │   └── useRecorder.js    # MediaRecorder wrapper
│   │   ├── utils/api.js          # API client
│   │   └── styles/global.css     # Accessibility-first styles
│   └── public/manifest.json      # PWA manifest
├── Dockerfile                    # Production container build
├── railway.json                  # Railway deployment config
├── .gitignore
└── README.md
```

## Accessibility

- Minimum 20px font size
- 48px+ touch targets
- High contrast (WCAG AAA)
- No gestures — tap only
- No multi-step navigation
- System font stack
- Status communicated via text, not just color
- AI output clearly labeled
