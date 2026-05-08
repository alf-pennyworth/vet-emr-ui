# API Platform Usability for External Companies

## Quick Answer: YES

Another company **can** send recorded speech to our APIs and receive back:
- **Transcription** (text from audio)
- **Entity extraction** (medications, diagnoses, allergies, conditions, etc.)
- **SOAP notes** (subjective, objective, assessment, plan)
- **Structured clinical data** in JSON format

## How It Works (3-Step Flow)

### Step 1: Upload Audio
```
POST /api/audio-upload
Content-Type: multipart/form-data

Fields:
  audio      : audio file (mp3, wav, etc.)
  clinicId   : identifier for the clinic
  patientId  : identifier for the patient
  sessionId  : identifier for the session
```
Returns: upload record with `id` and `storageKey`

### Step 2: Transcribe
```
POST /api/transcribe
Content-Type: multipart/form-data

Fields:
  audio     : audio file (or pass audio_url from step 1)
  language  : "de" or "en" (default "de")
```
Returns: AssemblyAI transcript JSON including:
- `text` — full transcription
- `entities` — detected entities (medical terms, dates, etc.)
- `language_code`

### Step 3: Extract Clinical Data
```
POST /api/extract
Content-Type: application/json

Body:
{
  "transcript": "<text from step 2>",
  "model": "gemma3:12b"     // optional, default shown
}
```
Returns: structured JSON with:
- `subjective`, `objective`, `assessment`, `plan`
- `diagnosis`
- `medications` (array of name/dosage/frequency)
- `allergies` (array)
- `conditions` (array)
- `followUp`
- `entities` (array of text/type)

## Services We Use

### AssemblyAI — Speech-to-Text
- **Endpoint**: `https://api.assemblyai.com/v2`
- **Services enabled**:
  - `punctuate: true` — adds punctuation
  - `format_text: true` — formats text
  - `speaker_labels: false` — no speaker diarization currently
  - `entity_detection: true` — extracts medical entities automatically
- **Languages supported**: German (`de`) and US English (`en_us`)
- **API Key**: configured in `.env.local` as `ASSEMBLYAI_API_KEY`

### Ollama — Local LLM for Clinical Extraction
- **Base URL**: `http://localhost:11434/v1` (configurable via `OLLAMA_BASE_URL`)
- **API Key**: `ollama` (configurable via `OLLAMA_API_KEY`)
- **Default model**: `gemma3:12b`
- **Endpoint used**: `POST /v1/chat/completions`
- **Temperature**: 0.2 (low, for consistent structured output)
- **Max tokens**: 4096

## Is It Already Set Up?

**Yes.** All three API routes are implemented and wired:

| Route | File | Status |
|-------|------|--------|
| `POST /api/audio-upload` | `app/api/audio-upload/route.ts` | Live |
| `POST /api/transcribe` | `app/api/transcribe/route.ts` | Live |
| `GET  /api/transcribe/[id]` | `app/api/transcribe/[id]/route.ts` | Live (status poll) |
| `POST /api/extract` | `app/api/extract/route.ts` | Live |

The `.env.local` already contains a real `ASSEMBLYAI_API_KEY` so transcription works out of the box.

Ollama must be running locally (or accessible at `OLLAMA_BASE_URL`) with the `gemma3:12b` model pulled for extraction to work.

## What an External Company Needs to Do

1. Point their HTTP client at our deployed base URL.
2. Call the 3 endpoints in sequence (upload → transcribe → extract).
3. Parse the JSON response from `/api/extract`.

No authentication layer is currently implemented on these routes — they are open API endpoints.
