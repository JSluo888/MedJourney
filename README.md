# MedJourney

MedJourney is an AI-powered web application designed to provide real-time, multimodal companionship and cognitive support for Alzheimer's patients. The project leverages advanced AI, real-time communication, and retrieval-augmented generation (RAG) technologies to deliver natural, interactive, and supportive experiences for patients, families, and healthcare professionals.

## 🚀 Live Demo

**Deployed Application:** https://06jy00o1s5lb.space.minimax.io

## Project Overview

- **Purpose:**
  - To build a cutting-edge, extensible, and healthcare-oriented AI companion web application for Alzheimer's patients.
  - To integrate state-of-the-art real-time communication, multimodal AI, and knowledge retrieval technologies for enhanced patient engagement and cognitive assessment.

- **Key Features:**
  - ✅ **Real-time voice and text conversation** with AI agents using TEN Framework
  - ✅ **Multimodal interaction**: voice, text, and image input processing
  - ✅ **Three-stage assessment flow**: Basic questionnaire → Case upload → AI conversation
  - ✅ **Virtual patient profiles**: Early, middle, and late-stage Alzheimer's simulation
  - ✅ **Cognitive assessment tools** embedded in natural dialogue
  - ✅ **Personalized knowledge retrieval** using RAG and medical knowledge bases
  - ✅ **Family/doctor dashboards** for data visualization and trend analysis
  - ✅ **Emotion recognition** and empathy in AI responses
  - ✅ **PDF report generation** with charts and comprehensive analysis
  - ✅ **Social sharing** capabilities for reports and insights
  - ✅ **Secure, privacy-focused architecture**

## System Architecture

- **Frontend:**
  - Built with React 18, TypeScript, Vite, Tailwind CSS, Zustand, and Radix UI
  - Integrates Agora Web SDK for real-time audio streaming
  - Communicates with backend via REST API and WebSocket for low-latency messaging
  - Responsive design optimized for elderly users

- **Backend:**
  - Node.js (v18+), Express, TypeScript
  - Integrates TEN (Transformative Extensions Network) Framework for modular AI agent orchestration
  - Uses LangChain and Pinecone for RAG (retrieval-augmented generation) and vector database
  - Supports integration with Stepfun AI, ElevenLabs (TTS), and other AI services
  - REST and WebSocket APIs for frontend communication
  - Supabase for data storage and authentication

- **DevOps:**
  - Docker/Docker Compose for local development and deployment
  - Environment variables managed via `.env` files
  - Automated deployment to cloud platform

## Tech Stack

- **Frontend:**
  - React 18, TypeScript, Vite, Tailwind CSS, Zustand, Radix UI
  - Agora Web SDK, jsPDF, Recharts, React Hook Form
- **Backend:**
  - Node.js, Express, TypeScript, TEN Framework, LangChain, Pinecone
  - Supabase, WebSocket, REST API, Stepfun AI, ElevenLabs
- **AI/ML Services:**
  - Stepfun AI (LLM), ElevenLabs (TTS), Gemini (multimodal), Chart.js
- **DevOps:**
  - Docker, Docker Compose, Cloud deployment

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
   - Copy `.env.example` to `.env` in both backend and frontend directories
   - Fill in required API keys:
     - Agora App ID
     - Stepfun AI API Key
     - ElevenLabs API Key
     - Pinecone API Key
     - Supabase credentials

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
     cd ../medjourney-frontend
     npm install
     # or
     pnpm install
     ```

4. **Run locally:**
   - Backend:
     ```sh
     cd medjourney-backend
     npm run dev
     ```
   - Frontend:
     ```sh
     cd medjourney-frontend
     npm run dev
     ```

5. **(Optional) Run with Docker Compose:**
   ```sh
   docker-compose up --build
   ```

## Core Features

### 🏥 Three-Stage Assessment Flow
1. **Basic Assessment** - Collect patient information, symptoms, and family history
2. **Case Upload** - Upload medical images and case descriptions
3. **AI Conversation** - Intelligent dialogue with cognitive testing and emotion analysis

### 🤖 AI-Powered Features
- **TEN Framework Integration** - Multi-modal AI conversation (voice, text, image)
- **Real-time Voice Communication** - Agora-powered audio streaming
- **Emotion Recognition** - AI-driven emotional state analysis
- **Cognitive Assessment** - Embedded MMSE-style evaluations
- **Personalized Responses** - Context-aware AI interactions

### 📊 Reporting & Analytics
- **Comprehensive Reports** - PDF generation with charts and analysis
- **Family Dashboard** - Progress tracking and trend visualization
- **Doctor Reports** - Professional medical summaries
- **Social Sharing** - Easy sharing via links and social media

### 👥 Virtual Patient System
- **Early-stage Alzheimer's** - Mild cognitive impairment simulation
- **Middle-stage Alzheimer's** - Moderate symptoms simulation  
- **Late-stage Alzheimer's** - Advanced symptoms simulation

## API Endpoints

### Core Services
- `POST /api/conversation/start` - Start TEN Framework conversation session
- `POST /api/conversation/:sessionId/message` - Send multi-modal messages
- `GET /api/conversation/:sessionId/analysis` - Get real-time conversation analysis
- `POST /api/speech/synthesize` - ElevenLabs voice synthesis
- `POST /api/assessment/analyze` - Assessment analysis
- `GET /api/reports/:sessionId/generate` - Generate detailed reports

### Health & Testing
- `GET /api/health` - System health check
- `POST /api/test/stepfun` - Stepfun AI service test
- `POST /api/test/emotion` - Emotion analysis test
- `GET /api/test/status` - Service status check

## Development Status

### ✅ Completed Features
- [x] Complete frontend application with 7 core pages
- [x] Backend API with full REST and WebSocket support
- [x] TEN Framework integration for multi-modal AI
- [x] Agora real-time voice communication
- [x] Three-stage assessment workflow
- [x] Virtual patient profiles system
- [x] PDF report generation and sharing
- [x] Emotion recognition and analysis
- [x] Responsive UI optimized for elderly users
- [x] Production deployment and testing

### 🔄 Current Development
- Enhanced AI conversation capabilities
- Advanced cognitive assessment tools
- Family dashboard improvements
- Performance optimization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgements
- TEN Framework (by Agora)
- Stepfun AI, ElevenLabs, Pinecone, Supabase
- All open-source contributors and the healthcare AI community
