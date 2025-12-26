# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

## 3. Create Environment File

Create `.env.local` in the root directory:

```bash
GEMINI_API_KEY=your_actual_api_key_here
```

**Important**: Never commit `.env.local` to git!

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5. Test the App

1. **Voice Recording**: Click the orange microphone button and speak
2. **Whisper Mode**: Click "🤫 Whisper" button (bottom right) to test the time-freeze effect
3. **Korean Translation**: Enter Korean text in the whisper modal to get English suggestions

## Browser Requirements

- **Chrome** or **Edge** (for Web Speech API)
- Modern browser with ES6+ support

## Troubleshooting

### "Gemini API key not configured"
- Make sure `.env.local` exists in the root directory
- Check that `GEMINI_API_KEY` is set correctly
- Restart the dev server after creating/modifying `.env.local`

### Speech Recognition not working
- Use Chrome or Edge browser
- Check browser permissions for microphone access
- Make sure you're using HTTPS or localhost (required for Web Speech API)

### Time-freeze effect not visible
- Check browser console for errors
- Ensure CSS filters are supported (all modern browsers)

