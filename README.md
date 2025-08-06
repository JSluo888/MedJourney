# MedJourney - AI-Driven Companion Platform for Alzheimer's Patients

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

<div align="right">
  <a href="README.md">🇺🇸 English</a> | <a href="README_CN.md">🇨🇳 中文</a>
</div>

## 📖 Project Overview

MedJourney is an AI-driven companion platform specifically designed for Alzheimer's patients, integrating advanced AI technology, real-time communication, and medical knowledge retrieval. The platform provides comprehensive support for patients, families, and healthcare professionals through multimodal interaction, intelligent dialogue, and cognitive assessment.

### 🎯 Core Values
- **Patient Care**: Provides 24/7 AI companionship and cognitive support
- **Family Support**: Real-time monitoring of patient status with professional advice
- **Medical Assistance**: Provides detailed assessment reports and analysis for healthcare professionals
- **Data-Driven**: AI-powered intelligent analysis and prediction

## 🔒 Security Configuration

### Environment Variables Setup
The project is configured to use environment variables to protect sensitive information. Please ensure:

1. **Copy Environment Variable Templates**:
   ```bash
   # Frontend
   cp medjourney-frontend/env.example medjourney-frontend/.env
   
   # Backend
   cp medjourney-backend/env.example medjourney-backend/.env
   ```

2. **Configure API Keys**:
   - MiniMax API Key (Chat functionality)
   - Stepfun API Key (TEN Framework real-time conversation)

3. **Ensure .env files are not committed**:
   - .gitignore is configured
   - Sensitive information will not be uploaded to GitHub

## ✨ Main Features

### 🤖 AI Intelligent Dialogue
- **Multimodal Interaction**: Supports voice, text, and image input
- **Real-time Dialogue**: Intelligent dialogue system based on MiniMax API
- **Emotion Recognition**: AI-driven emotional state analysis
- **Cognitive Assessment**: Natural dialogue embedded with MMSE-style assessment

### 📋 Three-Stage Assessment Process
1. **Basic Assessment**: Collect patient information, symptoms, and family history
2. **Case Upload**: Upload medical images and case descriptions
3. **AI Dialogue**: Intelligent dialogue and cognitive testing

### 👥 Virtual Patient System
- **Early Stage**: Mild cognitive impairment simulation
- **Middle Stage**: Moderate symptom simulation
- **Late Stage**: Severe symptom simulation

### 📊 Reports and Analysis
- **Family Summary**: Easy-to-understand health status reports
- **Doctor Reports**: Professional medical analysis reports
- **PDF Reports**: Downloadable reports with charts and detailed analysis
- **Social Sharing**: Support for report sharing and dissemination

### 🏥 Medical History Assistant (New)
- **Multimodal Input**: Supports text, image, and document uploads
- **Intelligent Organization**: AI automatically organizes unstructured medical history information
- **Real-time Updates**: Automatically updates family summaries and doctor dashboards
- **Professional Analysis**: Generates structured medical history summaries and recommendations

## 🏗️ Technical Architecture

### Frontend Technology Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Real-time Communication**: TEN Framework WebSocket
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas

### Backend Technology Stack
- **Runtime**: Node.js 18+ + Express + TypeScript
- **AI Services**: MiniMax API + TEN Framework
- **Database**: Local SQLite
- **File Processing**: Multer + Sharp
- **Authentication**: JWT + bcryptjs
- **Real-time Communication**: WebSocket

### AI/ML Services
- **Large Language Model**: MiniMax API (abab6.5s-chat)
- **Real-time Dialogue**: Stepfun API (TEN Framework)
- **Image Analysis**: Multimodal AI processing
- **Knowledge Retrieval**: RAG (Retrieval-Augmented Generation)

### Deployment and Operations
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Environment Management**: Environment variable configuration
- **Monitoring**: Winston logging system

## 🚀 Quick Start

### Environment Requirements
- Node.js 18+
- npm or pnpm
- Docker & Docker Compose (optional)

### 1. Clone the Project
```bash
git clone https://github.com/yourusername/MedJourney.git
cd MedJourney
```

### 2. Environment Configuration
```bash
# Frontend configuration
cd medjourney-frontend
cp env.example .env
# Edit .env file to configure necessary API keys

# Backend configuration
cd ../medjourney-backend
cp env.example .env
# Edit .env file to configure database and API keys
```

### 3. Install Dependencies
```bash
# Frontend dependencies
cd medjourney-frontend
npm install

# Backend dependencies
cd ../medjourney-backend
npm install
```

### 4. Start Development Environment
```bash
# Start backend service
cd medjourney-backend
npm run dev

# Start frontend service
cd ../medjourney-frontend
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🔧 Configuration Guide

### Required Environment Variables

#### Frontend (.env)
```env
# MiniMax API Configuration (Chat functionality)
VITE_MINIMAX_API_KEY=your_minimax_api_key
VITE_MINIMAX_GROUP_ID=your_group_id

# Stepfun AI Configuration (TEN Framework real-time conversation)
VITE_STEPFUN_API_KEY=your_stepfun_api_key

# TEN Framework Configuration
VITE_TEN_WS_URL=ws://localhost:8080
VITE_TEN_API_URL=http://localhost:8080

# API Base URL
VITE_API_BASE_URL=http://localhost:3000/api
```

#### Backend (.env)
```env
# AI Services Configuration
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_GROUP_ID=your_group_id
STEPFUN_API_KEY=your_stepfun_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging Configuration
LOG_LEVEL=info
```

## 📱 Core Pages

### Main Feature Pages
- **Dashboard** (`/dashboard`): System overview and quick operations
- **Medical History Assistant** (`/history`): AI-driven medical history organization and dialogue
- **Basic Assessment** (`/assessment/basic`): Patient basic information collection
- **Case Upload** (`/assessment/case`): Medical document and image upload
- **AI Dialogue** (`/assessment/chat`): Intelligent dialogue and cognitive assessment
- **Virtual Patients** (`/virtual-patients`): Different stage patient simulation

### Report Pages
- **Family Summary** (`/reports/family`): Health reports for families
- **Doctor Reports** (`/reports/doctor`): Professional medical analysis reports
- **Share Reports** (`/reports/share`): Report sharing and dissemination

## 🔌 API Interfaces

### Core Service Interfaces
```http
# Conversation Management
POST /conversation/create
POST /conversation/:sessionId/message
GET /conversation/:sessionId/messages
GET /conversation/:sessionId/analysis
POST /conversation/:sessionId/end

# Assessment Management
POST /assessment/session
POST /assessment/:sessionId/basic
POST /assessment/:sessionId/case
POST /assessment/:sessionId/complete
GET /assessment/:sessionId/report

# File Upload
POST /upload/image
POST /upload/medical-history

# Reports
GET /reports/family-summary
GET /reports/doctor/sessions
GET /reports/doctor/:sessionId

# Patient History
POST /patient/history
GET /patient/history

# Dashboard
GET /dashboard/stats
```

## 🛠️ Development

### Project Structure
```
medjourney/
├── medjourney-frontend/     # React frontend application
├── medjourney-backend/      # Node.js backend API
├── ten-framework/          # TEN Framework integration
├── docs/                   # Documentation
└── docker-compose.yml      # Docker configuration
```

### Key Technologies
- **MiniMax API**: Core AI engine for intelligent dialogue and multimodal input processing
- **TEN Framework**: Open-source real-time multimodal conversational AI framework
- **Stepfun AI**: LLM integrated with TEN Framework for real-time AI responses
- **Local SQLite**: Local data storage for patient data, conversations, and assessments

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start
docker-compose up --build

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Full-stack: http://localhost:80
```

### Manual Deployment
```bash
# Build frontend
cd medjourney-frontend
npm run build

# Build backend
cd ../medjourney-backend
npm run build

# Start services
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TEN Framework**: Open-source real-time conversational AI framework
- **MiniMax**: AI language model provider
- **Stepfun**: Real-time AI conversation provider
- **React Community**: Frontend framework and ecosystem
- **Node.js Community**: Backend runtime and ecosystem

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/MedJourney/issues) page
2. Create a new issue with detailed information
3. Contact the development team

---

**MedJourney** - Empowering Alzheimer's patients with AI companionship and support. 