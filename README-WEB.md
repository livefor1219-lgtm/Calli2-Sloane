# Calli Pitch - YC Interview Practice App

A high-end English speaking practice web application for startup founders. Practice your pitch with **Sloane**, a brutal Silicon Valley VC partner.

## 🎨 Design

- **Style**: SaaS Dark Chic with Glassmorphism
- **Background**: Deep Dark Navy (#0f172a) with animated gradient blobs
- **Accent**: Neon Orange (#ff5722)
- **UI**: Glassmorphism cards with backdrop blur and semi-transparent borders

## ✨ Features

### 1. **Sloane AI Persona**
- Powered by Google Gemini API
- Brutal, direct feedback on your pitch
- Keeps responses short and impactful (max 2 sentences)

### 2. **Voice Recording**
- Click the large neon orange microphone button to start
- Real-time speech-to-text transcription
- Automatic pitch analysis by Sloane

### 3. **Whisper Mode (Time Freeze Effect)**
- Click the "🤫 Whisper" button (bottom right)
- **Time Freeze**: Entire screen goes grayscale + blur
- Enter Korean thoughts → Get sophisticated English translations
- Perfect for when you're stuck mid-conversation

### 4. **Level Progress**
- Track your progress through 4 levels
- Visual progress bar at the top

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` and add your Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Gemini API handler
│   ├── globals.css               # Global styles + Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main UI page
├── components/
│   └── WhisperModal.tsx          # Whisper mode modal
├── types/
│   └── speech.d.ts               # Speech Recognition types
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 Usage

1. **Start Recording**: Click the large orange microphone button
2. **Speak Your Pitch**: Talk naturally - your speech will be transcribed
3. **Get Feedback**: Sloane will analyze and give brutal, direct feedback
4. **Use Whisper Mode**: If stuck, click "🤫 Whisper" to translate Korean thoughts to English

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (`@google/generative-ai`)
- **Icons**: Lucide React
- **Speech**: Web Speech API (browser native)

## 📝 Notes

- **Browser Compatibility**: Requires Chrome/Edge for Web Speech API
- **API Key**: Keep your Gemini API key secure and never commit it to git
- **Whisper Mode**: The time-freeze effect uses CSS filters (grayscale + blur)

## 🚢 Deployment

Build for production:

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
vercel
```

Make sure to add your `NEXT_PUBLIC_GEMINI_API_KEY` to your deployment environment variables.

## 📄 License

Private project - All rights reserved

