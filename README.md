# MedJourney

MedJourney is an AI-powered web application designed to provide real-time, multimodal companionship and cognitive support for Alzheimer's patients. The project leverages advanced AI, real-time communication, and retrieval-augmented generation (RAG) technologies to deliver natural, interactive, and supportive experiences for patients, families, and healthcare professionals.

## Project Overview

- **Purpose:**
  - To build a cutting-edge, extensible, and healthcare-oriented AI companion web application for Alzheimer's patients.
  - To integrate state-of-the-art real-time communication, multimodal AI, and knowledge retrieval technologies for enhanced patient engagement and cognitive assessment.

- **Key Features:**
  - Real-time voice and text conversation with AI agents.
  - Multimodal interaction: voice, text, and image input.
  - Cognitive assessment tools (e.g., MMSE) embedded in natural dialogue.
  - Personalized knowledge retrieval using RAG and medical knowledge bases.
  - Family/doctor dashboards for data visualization and trend analysis.
  - Empathy and emotion recognition in AI responses.
  - Secure, privacy-focused architecture.

## System Architecture

- **Frontend:**
  - Built with React, TypeScript, Vite, Tailwind CSS, Zustand, and Radix UI.
  - Integrates Agora Web SDK for real-time audio streaming.
  - Communicates with backend via WebSocket for low-latency, bidirectional messaging.

- **Backend:**
  - Node.js (v18+), Express, TypeScript.
  - Integrates TEN (Transformative Extensions Network) Framework for modular AI agent orchestration.
  - Uses LangChain and Pinecone for RAG (retrieval-augmented generation) and vector database.
  - Supports integration with OpenAI, Deepgram (STT), ElevenLabs (TTS), and other AI services.
  - REST and WebSocket APIs for frontend communication.
  - Supabase for data storage and authentication.

- **DevOps:**
  - Docker/Docker Compose for local development and deployment.
  - Environment variables managed via `.env` files.

## Tech Stack

- **Frontend:**
  - React, TypeScript, Vite, Tailwind CSS, Zustand, Radix UI, Agora Web SDK
- **Backend:**
  - Node.js, Express, TypeScript, TEN Framework, LangChain, Pinecone, Supabase, WebSocket, REST API
- **AI/ML Services:**
  - OpenAI (LLM), Deepgram (STT), ElevenLabs (TTS), Gemini (multimodal), Chart.js (visualization)
- **DevOps:**
  - Docker, Docker Compose

## Getting Started

### Prerequisites
- Node.js v18+
- npm or pnpm
- Docker & Docker Compose (for full-stack/local deployment)

### Setup
1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/MedJourney.git
   cd MedJourney
   ```
2. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both backend and frontend directories, and fill in required API keys (Agora, OpenAI, Deepgram, ElevenLabs, Pinecone, etc).
3. **Install dependencies:**
   - Backend:
     ```sh
     cd medjourney-backend
     npm install
     # or
     pnpm install
     ```
   - Frontend:
     ```sh
     cd ../medjourney-mvp
     npm install
     # or
     pnpm install
     ```
4. **Run locally:**
   - Backend:
     ```sh
     npm run dev
     ```
   - Frontend:
     ```sh
     npm run dev
     ```
5. **(Optional) Run with Docker Compose:**
   ```sh
   docker-compose up --build
   ```

## Development Roadmap

| Phase | Core Tasks | Est. Time | Priority |
|-------|-----------|-----------|----------|
| 1. PoC | TEN Agent setup, Agora audio, core dialog (STT->LLM->TTS) | 1 week | Highest |
| 2. Core Features | RAG knowledge base, RAG integration, basic frontend UI | 2 weeks | Highest |
| 3. Experience | Voice barge-in, senior-friendly UI/UX | 1 week | High |
| 4. Data & Support | Emotion/Empathy logic, data analytics, dashboards | 1 week | Medium |
| 5. Integration & Test | Cognitive assessment (MMSE), E2E test, deployment prep | 1 week | Medium |

**Total Estimate:** ~6 weeks for MVP

## License

This project is licensed under the MIT License.

## Acknowledgements
- TEN Framework (by Agora)
- OpenAI, Deepgram, ElevenLabs, Pinecone, Supabase
- All open-source contributors
