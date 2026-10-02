# Post Street Teleprompter

Mobile-friendly teleprompter with horizontal mirroring enabled by default, microphone-driven following, freestyle hold, and phrase-based reacquisition. Paste a script, open the teleprompter, then start voice follow and allow microphone access. Scripts and settings are saved only in this browser. Microphone audio and script context are sent to OpenAI while voice follow is connected.

## Vercel

Import `poststreetmediaadmin/post-street-teleprompter`. Use the repository root, Other framework, and no build command. `index.html` is the app; `api/token.js` is a Node serverless function.

Set `OPENAI_API_KEY` in Vercel server environment variables. Never put it in source files or a public-prefixed variable. The app requests POST `/api/token`; GET returns 405 intentionally. Only a short-lived Realtime client secret is returned to the browser. Protect personal deployments with Vercel access controls where available; the token endpoint has no app-level login.

Run `npm test` for local mock endpoint and text-follow tests. These do not prove live account/model access or microphone performance. Live testing requires a deployed endpoint, server key, and an HTTPS browser with microphone permission.

## Behavior

No automatic timed scrolling. Short matching phrases advance near the current line; jumps farther ahead require at least five matching words. Unrelated speech holds the cursor. Back, Forward and Hold support manual correction. Voice matching is heuristic: repeated script phrases and transcription errors can require manual correction. Horizontal mirroring applies to script text while controls remain readable.
